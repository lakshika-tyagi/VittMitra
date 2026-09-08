"""
Database Seeding Script for Verified Channel Partners and Scheme Mappings

Loads controlled, verified channel partner records from data/partners/partners_seed.json
into PostgreSQL and associates them with corresponding schemes.
"""
import os
import sys
import json
import asyncio
from pathlib import Path

# Add backend directory to sys.path
root_dir = Path(__file__).resolve().parent.parent
backend_dir = root_dir / "backend"
sys.path.insert(0, str(backend_dir))

from geoalchemy2.elements import WKTElement
from sqlalchemy import select
from app.db.session import async_session_factory
from app.models.scheme import Scheme
from app.models.access import ChannelPartner, SchemeChannelPartner


async def seed_channel_partners():
    """Seeds channel partners and scheme-partner associations."""
    base_dir = Path(__file__).resolve().parent.parent
    seed_file = base_dir / "data" / "partners" / "partners_seed.json"

    if not seed_file.exists():
        print(f"[ERROR] Seed file not found: {seed_file}")
        return

    with open(seed_file, "r", encoding="utf-8") as f:
        partners_data = json.load(f)

    async with async_session_factory() as session:
        print(f"[*] Seeding {len(partners_data)} verified channel partners...")

        for p_data in partners_data:
            # Check if partner already exists
            stmt = select(ChannelPartner).where(ChannelPartner.partner_code == p_data["partner_code"])
            res = await session.execute(stmt)
            partner = res.scalar_one_or_none()

            lat = p_data.get("latitude")
            lon = p_data.get("longitude")
            geom = WKTElement(f"POINT({lon} {lat})", srid=4326) if (lat is not None and lon is not None) else None

            if not partner:
                partner = ChannelPartner(
                    partner_code=p_data["partner_code"],
                    organization_name=p_data["organization_name"],
                    partner_type=p_data["partner_type"],
                    state=p_data["state"],
                    district=p_data["district"],
                    city=p_data.get("city"),
                    pincode=p_data.get("pincode"),
                    address=p_data["address"],
                    latitude=lat,
                    longitude=lon,
                    location=geom,
                    services_offered=p_data.get("services_offered", []),
                    contact_person=p_data.get("contact_person"),
                    contact_phone=p_data.get("contact_phone"),
                    contact_email=p_data.get("contact_email"),
                    official_url=p_data.get("official_url"),
                    verification_status=p_data.get("verification_status", "VERIFIED"),
                    source_agency=p_data["source_agency"],
                    source_url=p_data.get("source_url"),
                    notes=p_data.get("notes"),
                    is_active=True,
                )
                session.add(partner)
                await session.flush()
                print(f"  [+] Created partner: {partner.organization_name} ({partner.partner_code})")
            else:
                print(f"  [.] Partner exists: {partner.organization_name}")

            # Now link supported schemes
            for scheme_mapping in p_data.get("supported_schemes", []):
                scheme_code = scheme_mapping["scheme_code"]
                scheme_stmt = select(Scheme).where(Scheme.scheme_code == scheme_code)
                s_res = await session.execute(scheme_stmt)
                scheme = s_res.scalar_one_or_none()

                if scheme:
                    # Check if link already exists
                    link_stmt = select(SchemeChannelPartner).where(
                        SchemeChannelPartner.scheme_id == scheme.id,
                        SchemeChannelPartner.channel_partner_id == partner.id
                    )
                    l_res = await session.execute(link_stmt)
                    existing_link = l_res.scalar_one_or_none()

                    if not existing_link:
                        new_link = SchemeChannelPartner(
                            scheme_id=scheme.id,
                            channel_partner_id=partner.id,
                            role_type=scheme_mapping.get("role_type", "LENDING_INSTITUTION"),
                            service_scope=scheme_mapping.get("service_scope"),
                            is_primary_partner=scheme_mapping.get("is_primary_partner", False),
                            verification_status="VERIFIED",
                            source_reference=p_data["source_agency"]
                        )
                        session.add(new_link)
                        print(f"    -> Associated with scheme: {scheme_code} (Role: {new_link.role_type})")
                else:
                    print(f"    [!] Scheme {scheme_code} not found in DB. Run scheme seed first.")

        await session.commit()
        print("[SUCCESS] Channel partner seeding completed.")


if __name__ == "__main__":
    asyncio.run(seed_channel_partners())
