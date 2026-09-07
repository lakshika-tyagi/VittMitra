"""
Channel Partner Service

Handles querying, filtering, and PostGIS spatial discovery for verified
implementing agencies and lending institutions.
"""
import math
from typing import List, Optional, Dict, Any
from sqlalchemy import select, and_, or_, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.access import ChannelPartner, SchemeChannelPartner
from app.models.scheme import Scheme
from app.schemas.partner import SchemePartnerResponse, ChannelPartnerResponse


def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Computes great-circle distance between two coordinate points in kilometers."""
    R = 6371.0  # Earth radius in kilometers
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (
        math.sin(dlat / 2.0) ** 2
        + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2.0) ** 2
    )
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return round(R * c, 2)


def generate_why_this_partner(role_type: str, service_scope: Optional[str], org_name: str, scheme_name: str) -> str:
    """Generates grounded explanation for why this partner is relevant to the scheme."""
    if service_scope:
        return f"{org_name} is an authorized {role_type.replace('_', ' ').title()} for {scheme_name}: {service_scope}"
    
    role_desc = {
        "NODAL_AGENCY": "State/Central Nodal Implementing Authority overseeing policy administration and subsidy releases.",
        "IMPLEMENTING_AGENCY": "Designated District/State Implementing Agency conducting applicant scrutiny and sponsorship.",
        "FINANCING_BANK": "Official Designated Lending Bank appraising credit, sanctioning loans, and claiming interest/capital subsidies.",
        "LOCAL_FACILITATION": "Official local handholding and facilitation center assisting with document preparation and digital intake."
    }.get(role_type, "Official facilitation and access partner for this scheme.")

    return f"{org_name} serves as the {role_desc}"


class PartnerService:
    @staticmethod
    async def get_partners_for_scheme(
        db: AsyncSession,
        scheme_id: int,
        district: Optional[str] = None,
        state: Optional[str] = None,
        partner_type: Optional[str] = None,
        user_lat: Optional[float] = None,
        user_lon: Optional[float] = None,
        limit: int = 20
    ) -> List[SchemePartnerResponse]:
        """
        Retrieves verified channel partners mapped to a target scheme, prioritizing
        local district and state matches.
        """
        # Fetch scheme name for why_this_partner context
        scheme_stmt = select(Scheme).where(Scheme.id == scheme_id)
        scheme_res = await db.execute(scheme_stmt)
        scheme = scheme_res.scalar_one_or_none()
        scheme_name = scheme.scheme_name if scheme else "Selected Scheme"

        # Query mapped partners
        stmt = (
            select(ChannelPartner, SchemeChannelPartner)
            .join(SchemeChannelPartner, SchemeChannelPartner.channel_partner_id == ChannelPartner.id)
            .where(
                SchemeChannelPartner.scheme_id == scheme_id,
                ChannelPartner.is_active == True
            )
        )

        if partner_type:
            stmt = stmt.where(ChannelPartner.partner_type == partner_type)

        res = await db.execute(stmt)
        rows = res.all()

        results: List[SchemePartnerResponse] = []
        for partner, link in rows:
            dist_km: Optional[float] = None
            if user_lat is not None and user_lon is not None and partner.latitude is not None and partner.longitude is not None:
                dist_km = haversine_distance_km(user_lat, user_lon, float(partner.latitude), float(partner.longitude))

            why_text = generate_why_this_partner(
                link.role_type,
                link.service_scope,
                partner.organization_name,
                scheme_name
            )

            results.append(
                SchemePartnerResponse(
                    id=partner.id,
                    partner_code=partner.partner_code,
                    organization_name=partner.organization_name,
                    partner_type=partner.partner_type,
                    state=partner.state,
                    district=partner.district,
                    city=partner.city,
                    pincode=partner.pincode,
                    address=partner.address,
                    latitude=partner.latitude,
                    longitude=partner.longitude,
                    distance_km=dist_km,
                    services_offered=partner.services_offered or [],
                    contact_person=partner.contact_person,
                    contact_phone=partner.contact_phone,
                    contact_email=partner.contact_email,
                    official_url=partner.official_url,
                    verification_status=partner.verification_status,
                    source_agency=partner.source_agency,
                    source_url=partner.source_url,
                    role_type=link.role_type,
                    service_scope=link.service_scope,
                    is_primary_partner=link.is_primary_partner,
                    why_this_partner=why_text
                )
            )

        # Sort priority: exact district -> exact state -> others (and by distance if available)
        def sort_key(p: SchemePartnerResponse):
            match_priority = 3
            if district and p.district.lower() == district.lower():
                match_priority = 1
            elif state and p.state.lower() == state.lower():
                match_priority = 2

            primary_flag = 0 if p.is_primary_partner else 1
            dist = p.distance_km if p.distance_km is not None else 99999.0
            return (match_priority, primary_flag, dist)

        results.sort(key=sort_key)
        return results[:limit]

    @staticmethod
    async def get_nearby_partners(
        db: AsyncSession,
        lat: float,
        lon: float,
        radius_km: float = 50.0,
        scheme_id: Optional[int] = None,
        partner_type: Optional[str] = None,
        limit: int = 20
    ) -> List[SchemePartnerResponse]:
        """
        PostGIS spatial proximity search returning verified channel partners within radius.
        """
        stmt = select(ChannelPartner).where(
            ChannelPartner.is_active == True,
            ChannelPartner.latitude.isnot(None),
            ChannelPartner.longitude.isnot(None)
        )

        if partner_type:
            stmt = stmt.where(ChannelPartner.partner_type == partner_type)

        if scheme_id:
            stmt = stmt.join(SchemeChannelPartner, SchemeChannelPartner.channel_partner_id == ChannelPartner.id).where(
                SchemeChannelPartner.scheme_id == scheme_id
            )

        res = await db.execute(stmt)
        partners = res.scalars().all()

        results: List[SchemePartnerResponse] = []
        for partner in partners:
            if partner.latitude is None or partner.longitude is None:
                continue

            p_lat = float(partner.latitude)
            p_lon = float(partner.longitude)
            dist = haversine_distance_km(lat, lon, p_lat, p_lon)

            if dist <= radius_km:
                # Find role if scheme specified
                role = "LENDING_INSTITUTION"
                is_primary = False
                for assoc in partner.scheme_associations:
                    if scheme_id and assoc.scheme_id == scheme_id:
                        role = assoc.role_type
                        is_primary = assoc.is_primary_partner
                        break

                results.append(
                    SchemePartnerResponse(
                        id=partner.id,
                        partner_code=partner.partner_code,
                        organization_name=partner.organization_name,
                        partner_type=partner.partner_type,
                        state=partner.state,
                        district=partner.district,
                        city=partner.city,
                        pincode=partner.pincode,
                        address=partner.address,
                        latitude=partner.latitude,
                        longitude=partner.longitude,
                        distance_km=dist,
                        services_offered=partner.services_offered or [],
                        contact_person=partner.contact_person,
                        contact_phone=partner.contact_phone,
                        contact_email=partner.contact_email,
                        official_url=partner.official_url,
                        verification_status=partner.verification_status,
                        source_agency=partner.source_agency,
                        source_url=partner.source_url,
                        role_type=role,
                        is_primary_partner=is_primary,
                        why_this_partner=f"Located {dist:.1f} km away. Official {role.replace('_', ' ').title()}."
                    )
                )

        results.sort(key=lambda p: (p.distance_km or 9999.0))
        return results[:limit]

    @staticmethod
    async def get_partner_detail(db: AsyncSession, partner_id: int) -> Optional[ChannelPartnerResponse]:
        """Retrieves full partner record with associated schemes."""
        stmt = select(ChannelPartner).where(ChannelPartner.id == partner_id)
        res = await db.execute(stmt)
        partner = res.scalar_one_or_none()
        if not partner:
            return None

        supported = []
        for assoc in partner.scheme_associations:
            if assoc.scheme:
                supported.append({
                    "scheme_id": assoc.scheme.id,
                    "scheme_code": assoc.scheme.scheme_code,
                    "scheme_name": assoc.scheme.scheme_name,
                    "role_type": assoc.role_type,
                    "service_scope": assoc.service_scope,
                    "is_primary_partner": assoc.is_primary_partner,
                })

        return ChannelPartnerResponse(
            id=partner.id,
            partner_code=partner.partner_code,
            organization_name=partner.organization_name,
            partner_type=partner.partner_type,
            state=partner.state,
            district=partner.district,
            city=partner.city,
            pincode=partner.pincode,
            address=partner.address,
            latitude=partner.latitude,
            longitude=partner.longitude,
            services_offered=partner.services_offered or [],
            contact_person=partner.contact_person,
            contact_phone=partner.contact_phone,
            contact_email=partner.contact_email,
            official_url=partner.official_url,
            verification_status=partner.verification_status,
            source_agency=partner.source_agency,
            source_url=partner.source_url,
            notes=partner.notes,
            is_active=partner.is_active,
            last_verified_at=partner.last_verified_at,
            created_at=partner.created_at,
            updated_at=partner.updated_at,
            supported_schemes=supported
        )
