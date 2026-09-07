"""
Application Assistance and Tracking Service

Synthesizes pre-application guidance from scheme knowledge, eligibility, finance,
and verified partners, and manages user-recorded application lifecycle timelines.
"""
from typing import List, Optional, Dict, Any
from datetime import datetime, date, timezone
from decimal import Decimal
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException

from app.models.access import Application, ApplicationStatusHistory, ChannelPartner
from app.models.scheme import Scheme
from app.models.profile import Entrepreneur, BusinessProfile, FinancialProfile
from app.schemas.partner import SchemePartnerResponse
from app.schemas.application import (
    ApplicationCreate,
    ApplicationUpdate,
    ApplicationStatusUpdate,
    ApplicationResponse,
    ApplicationDetailResponse,
    ApplicationStatusHistoryResponse,
    ApplicationAssistanceResponse,
    RequiredDocumentChecklistItem,
    ApplicationStatus,
)
from app.services.partner.service import PartnerService
from app.services.eligibility.engine import EligibilityEngine
from app.services.finance.calculator import calculate_repayment_summary, _quantize_money
from app.services.profile.adapters import to_eligibility_input, to_financial_request


STATUS_EXPLANATIONS = {
    "DRAFT": "Application is in draft stage.",
    "APPLICATION_STARTED": "You have initiated your scheme preparation in VittMitra.",
    "SUBMITTED": "Your application has been recorded as submitted to the official portal / partner office.",
    "UNDER_REVIEW": "The application is recorded as being reviewed or appraised by the implementing authority / bank.",
    "ADDITIONAL_INFORMATION_REQUIRED": "Additional documents or physical clarifications have been requested by the reviewing authority.",
    "APPROVED": "The application is recorded as approved / sanctioned. Verify final sanction letter with official authority.",
    "REJECTED": "The application is recorded as rejected. Check official communication for grounds of rejection.",
    "COMPLETED": "Application processing and initial disbursement recorded as completed.",
    "UNKNOWN": "Current status is unspecified.",
}

STATUS_NEXT_ACTIONS = {
    "DRAFT": "Review mandatory checklist documents and prepare project requirements.",
    "APPLICATION_STARTED": "Gather required checklist documents and visit the official portal or nearest verified channel partner.",
    "SUBMITTED": "Save your official application reference / acknowledgement receipt and follow up with the nodal office.",
    "UNDER_REVIEW": "Keep your contact information active and attend physical verification / interview if scheduled.",
    "ADDITIONAL_INFORMATION_REQUIRED": "Provide the requested supporting documents to the reviewing officer or portal immediately.",
    "APPROVED": "Visit the designated lending branch to execute loan documents and initiate subsidy claim.",
    "REJECTED": "Examine the official rejection rationale; evaluate alternative schemes or address eligibility gaps.",
    "COMPLETED": "Ensure timely repayment compliance and maintain project milestone records.",
    "UNKNOWN": "Update your current status in the tracker as you make progress.",
}


class ApplicationService:
    @staticmethod
    def get_status_explanation(status: str) -> str:
        return STATUS_EXPLANATIONS.get(status, "Status information recorded by user.")

    @staticmethod
    def get_next_action(status: str) -> str:
        return STATUS_NEXT_ACTIONS.get(status, "Follow official scheme guidance and keep your records updated.")

    @staticmethod
    async def get_application_assistance(
        db: AsyncSession,
        entrepreneur_id: int,
        scheme_id: int
    ) -> ApplicationAssistanceResponse:
        """
        Synthesizes a comprehensive pre-application guidance package by reusing
        Step 3 (Documents), Step 4 (Eligibility), Step 5 (Finance), and Step 10 (Channel Partners).
        """
        # 1. Fetch Scheme
        scheme_stmt = select(Scheme).where(Scheme.id == scheme_id)
        scheme_res = await db.execute(scheme_stmt)
        scheme = scheme_res.scalar_one_or_none()
        if not scheme:
            raise HTTPException(status_code=404, detail=f"Scheme ID {scheme_id} not found")

        # 2. Fetch Entrepreneur & Profile
        ent_stmt = select(Entrepreneur).where(Entrepreneur.id == entrepreneur_id)
        ent_res = await db.execute(ent_stmt)
        entrepreneur = ent_res.scalar_one_or_none()
        if not entrepreneur:
            raise HTTPException(status_code=404, detail=f"Entrepreneur ID {entrepreneur_id} not found")

        # 3. Step 4 Eligibility Evaluation
        profile_dict = to_eligibility_input(entrepreneur)
        elig_result = EligibilityEngine.evaluate_scheme(scheme, profile_dict)
        elig_status = elig_result.overall_status.value if hasattr(elig_result.overall_status, "value") else str(elig_result.overall_status)
        elig_msg = (
            f"All mandatory criteria satisfied for {scheme.scheme_code}"
            if elig_status == "MATCHED"
            else f"Some mandatory criteria failed or unverified for {scheme.scheme_code}"
        )

        # 4. Step 5 Financial Snapshot
        project_cost = None
        own_contrib = None
        loan_req = None
        est_emi = None
        est_subsidy = None

        if entrepreneur.financial_profiles:
            fin = entrepreneur.financial_profiles[0]
            project_cost = fin.project_cost
            own_contrib = fin.own_contribution or Decimal("0.00")
            loan_req = fin.loan_requirement or (project_cost - own_contrib if project_cost else None)

            if loan_req and loan_req > 0:
                try:
                    repay = calculate_repayment_summary(
                        principal=loan_req,
                        annual_interest_rate=Decimal("9.5"),
                        tenure_months=60
                    )
                    est_emi = repay.estimated_emi
                except Exception:
                    est_emi = None

            # Calculate subsidy if scheme supports it
            benefits = scheme.benefits_summary or {}
            subsidy_pct_raw = (
                benefits.get("subsidy_percentage")
                or benefits.get("max_subsidy_pct")
                or benefits.get("subsidy_rate_general_pct")
                or 0
            )
            try:
                subsidy_pct = Decimal(str(subsidy_pct_raw))
                if subsidy_pct > 0 and project_cost:
                    est_subsidy = _quantize_money(project_cost * subsidy_pct / Decimal("100.00"))
            except Exception:
                est_subsidy = None

        # 5. Step 3 Required Documents Checklist
        doc_checklist: List[RequiredDocumentChecklistItem] = []
        for doc in scheme.documents:
            doc_checklist.append(
                RequiredDocumentChecklistItem(
                    document_code=doc.document_code,
                    document_name=doc.document_name,
                    description=doc.description,
                    is_mandatory=doc.is_mandatory,
                    issuing_authority=getattr(doc, "issuing_authority", None),
                    purpose=getattr(doc, "purpose", None)
                )
            )

        # 6. Step 10 Recommended Channel Partners
        partners = await PartnerService.get_partners_for_scheme(
            db=db,
            scheme_id=scheme.id,
            district=entrepreneur.district,
            state=entrepreneur.state,
            user_lat=float(entrepreneur.latitude) if entrepreneur.latitude else None,
            user_lon=float(entrepreneur.longitude) if entrepreneur.longitude else None,
            limit=5
        )

        # 7. Official Portal URL from Sources
        official_portal = None
        for src in scheme.sources:
            if src.official_url:
                official_portal = src.official_url
                break

        # Standard step-by-step guidance instructions
        application_steps = [
            f"Step 1: Verify that you have all {len([d for d in doc_checklist if d.is_mandatory])} mandatory documents ready.",
            "Step 2: Review your own equity contribution and project cost estimates.",
            f"Step 3: Approach your nearest verified channel partner (e.g. {partners[0].organization_name if partners else 'District Industries Centre'}) for pre-application guidance.",
            f"Step 4: Submit your online application via the official portal ({official_portal or 'Official Ministry Portal'}).",
            "Step 5: Record your Application Reference / Acknowledgement Number in VittMitra to track your timeline."
        ]

        prerequisites = [
            f"Target scheme applies at {scheme.geography_level.title()} level.",
            "Identity proof and address proof must be clear and legible.",
            "Ensure bank account is Aadhaar-seeded for direct benefit / subsidy transfers.",
            "Final loan and subsidy approvals depend on physical verification and bank credit appraisal."
        ]

        return ApplicationAssistanceResponse(
            scheme_id=scheme.id,
            scheme_code=scheme.scheme_code,
            scheme_name=scheme.scheme_name,
            nodal_ministry=scheme.nodal_ministry,
            short_description=scheme.short_description,
            official_portal_url=official_portal,
            eligibility_status=elig_status,
            eligibility_summary_message=elig_msg,
            project_cost=project_cost,
            own_contribution=own_contrib,
            loan_requirement=loan_req,
            estimated_monthly_emi=est_emi,
            estimated_subsidy_amount=est_subsidy,
            required_documents=doc_checklist,
            recommended_partners=partners,
            application_steps=application_steps,
            important_prerequisites=prerequisites
        )

    @staticmethod
    async def create_application(
        db: AsyncSession,
        payload: ApplicationCreate
    ) -> ApplicationResponse:
        """
        Creates a user-recorded application and logs initial status history.
        """
        # Validate scheme exists
        scheme_stmt = select(Scheme).where(Scheme.id == payload.scheme_id)
        scheme_res = await db.execute(scheme_stmt)
        scheme = scheme_res.scalar_one_or_none()
        if not scheme:
            raise HTTPException(status_code=404, detail=f"Scheme ID {payload.scheme_id} not found")

        # Validate entrepreneur exists
        ent_stmt = select(Entrepreneur).where(Entrepreneur.id == payload.entrepreneur_id)
        ent_res = await db.execute(ent_stmt)
        entrepreneur = ent_res.scalar_one_or_none()
        if not entrepreneur:
            raise HTTPException(status_code=404, detail=f"Entrepreneur ID {payload.entrepreneur_id} not found")

        # Validate partner if provided
        partner = None
        if payload.channel_partner_id:
            part_stmt = select(ChannelPartner).where(ChannelPartner.id == payload.channel_partner_id)
            part_res = await db.execute(part_stmt)
            partner = part_res.scalar_one_or_none()
            if not partner:
                raise HTTPException(status_code=404, detail=f"Channel Partner ID {payload.channel_partner_id} not found")

        # Create Application
        app_date = payload.application_date or date.today()
        initial_status_str = payload.initial_status.value if isinstance(payload.initial_status, ApplicationStatus) else payload.initial_status

        new_app = Application(
            entrepreneur_id=payload.entrepreneur_id,
            scheme_id=payload.scheme_id,
            channel_partner_id=payload.channel_partner_id,
            application_reference_number=payload.application_reference_number,
            application_date=app_date,
            current_status=initial_status_str,
            status_note=payload.status_note,
            target_loan_amount=payload.target_loan_amount,
            target_subsidy_amount=payload.target_subsidy_amount,
            official_portal_url=payload.official_portal_url,
            source_type="USER_RECORDED",
            last_updated_at=datetime.now(timezone.utc),
            is_active=True
        )
        db.add(new_app)
        await db.flush()

        # Add initial timeline event
        history_entry = ApplicationStatusHistory(
            application_id=new_app.id,
            status=initial_status_str,
            status_note=payload.status_note or "Application initiated by applicant",
            recorded_at=datetime.now(timezone.utc),
            source_type="USER_RECORDED"
        )
        db.add(history_entry)
        await db.commit()
        await db.refresh(new_app)

        return ApplicationResponse(
            id=new_app.id,
            entrepreneur_id=new_app.entrepreneur_id,
            scheme_id=scheme.id,
            scheme_code=scheme.scheme_code,
            scheme_name=scheme.scheme_name,
            nodal_ministry=scheme.nodal_ministry,
            channel_partner_id=partner.id if partner else None,
            partner_name=partner.organization_name if partner else None,
            partner_type=partner.partner_type if partner else None,
            application_reference_number=new_app.application_reference_number,
            application_date=new_app.application_date,
            current_status=new_app.current_status,
            status_explanation=ApplicationService.get_status_explanation(new_app.current_status),
            status_note=new_app.status_note,
            target_loan_amount=new_app.target_loan_amount,
            target_subsidy_amount=new_app.target_subsidy_amount,
            official_portal_url=new_app.official_portal_url,
            source_type=new_app.source_type,
            last_updated_at=new_app.last_updated_at,
            created_at=new_app.created_at,
            is_active=new_app.is_active,
            next_recommended_action=ApplicationService.get_next_action(new_app.current_status)
        )

    @staticmethod
    async def update_application_status(
        db: AsyncSession,
        application_id: int,
        payload: ApplicationStatusUpdate
    ) -> ApplicationResponse:
        """
        Updates current status of an application and appends a status history timeline event.
        """
        stmt = select(Application).where(Application.id == application_id)
        res = await db.execute(stmt)
        app = res.scalar_one_or_none()
        if not app:
            raise HTTPException(status_code=404, detail=f"Application ID {application_id} not found")

        status_str = payload.status.value if isinstance(payload.status, ApplicationStatus) else payload.status
        source_str = payload.source_type.value if hasattr(payload.source_type, "value") else payload.source_type

        # Update application current status
        app.current_status = status_str
        app.status_note = payload.status_note
        app.last_updated_at = datetime.now(timezone.utc)

        # Append timeline entry
        history_entry = ApplicationStatusHistory(
            application_id=app.id,
            status=status_str,
            status_note=payload.status_note,
            recorded_at=datetime.now(timezone.utc),
            source_type=source_str
        )
        db.add(history_entry)
        await db.commit()
        await db.refresh(app)

        scheme = app.scheme
        partner = app.channel_partner

        return ApplicationResponse(
            id=app.id,
            entrepreneur_id=app.entrepreneur_id,
            scheme_id=scheme.id,
            scheme_code=scheme.scheme_code,
            scheme_name=scheme.scheme_name,
            nodal_ministry=scheme.nodal_ministry,
            channel_partner_id=partner.id if partner else None,
            partner_name=partner.organization_name if partner else None,
            partner_type=partner.partner_type if partner else None,
            application_reference_number=app.application_reference_number,
            application_date=app.application_date,
            current_status=app.current_status,
            status_explanation=ApplicationService.get_status_explanation(app.current_status),
            status_note=app.status_note,
            target_loan_amount=app.target_loan_amount,
            target_subsidy_amount=app.target_subsidy_amount,
            official_portal_url=app.official_portal_url,
            source_type=app.source_type,
            last_updated_at=app.last_updated_at,
            created_at=app.created_at,
            is_active=app.is_active,
            next_recommended_action=ApplicationService.get_next_action(app.current_status)
        )

    @staticmethod
    async def get_entrepreneur_applications(
        db: AsyncSession,
        entrepreneur_id: int
    ) -> List[ApplicationResponse]:
        """Lists all applications tracked by an entrepreneur."""
        stmt = (
            select(Application)
            .where(Application.entrepreneur_id == entrepreneur_id, Application.is_active == True)
            .order_by(Application.created_at.desc())
        )
        res = await db.execute(stmt)
        apps = res.scalars().all()

        results: List[ApplicationResponse] = []
        for a in apps:
            scheme = a.scheme
            partner = a.channel_partner
            results.append(
                ApplicationResponse(
                    id=a.id,
                    entrepreneur_id=a.entrepreneur_id,
                    scheme_id=scheme.id,
                    scheme_code=scheme.scheme_code,
                    scheme_name=scheme.scheme_name,
                    nodal_ministry=scheme.nodal_ministry,
                    channel_partner_id=partner.id if partner else None,
                    partner_name=partner.organization_name if partner else None,
                    partner_type=partner.partner_type if partner else None,
                    application_reference_number=a.application_reference_number,
                    application_date=a.application_date,
                    current_status=a.current_status,
                    status_explanation=ApplicationService.get_status_explanation(a.current_status),
                    status_note=a.status_note,
                    target_loan_amount=a.target_loan_amount,
                    target_subsidy_amount=a.target_subsidy_amount,
                    official_portal_url=a.official_portal_url,
                    source_type=a.source_type,
                    last_updated_at=a.last_updated_at,
                    created_at=a.created_at,
                    is_active=a.is_active,
                    next_recommended_action=ApplicationService.get_next_action(a.current_status)
                )
            )
        return results

    @staticmethod
    async def get_application_detail(
        db: AsyncSession,
        application_id: int
    ) -> Optional[ApplicationDetailResponse]:
        """Retrieves full application details with timeline history and partner info."""
        stmt = select(Application).where(Application.id == application_id)
        res = await db.execute(stmt)
        app = res.scalar_one_or_none()
        if not app:
            return None

        scheme = app.scheme
        partner = app.channel_partner

        history_items: List[ApplicationStatusHistoryResponse] = []
        for h in app.status_history:
            history_items.append(
                ApplicationStatusHistoryResponse(
                    id=h.id,
                    application_id=h.application_id,
                    status=h.status,
                    status_note=h.status_note,
                    recorded_at=h.recorded_at,
                    source_type=h.source_type
                )
            )

        partner_resp = None
        if partner:
            partner_resp = SchemePartnerResponse(
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
                role_type="LENDING_INSTITUTION",
                is_primary_partner=False
            )

        return ApplicationDetailResponse(
            id=app.id,
            entrepreneur_id=app.entrepreneur_id,
            scheme_id=scheme.id,
            scheme_code=scheme.scheme_code,
            scheme_name=scheme.scheme_name,
            nodal_ministry=scheme.nodal_ministry,
            channel_partner_id=partner.id if partner else None,
            partner_name=partner.organization_name if partner else None,
            partner_type=partner.partner_type if partner else None,
            application_reference_number=app.application_reference_number,
            application_date=app.application_date,
            current_status=app.current_status,
            status_explanation=ApplicationService.get_status_explanation(app.current_status),
            status_note=app.status_note,
            target_loan_amount=app.target_loan_amount,
            target_subsidy_amount=app.target_subsidy_amount,
            official_portal_url=app.official_portal_url,
            source_type=app.source_type,
            last_updated_at=app.last_updated_at,
            created_at=app.created_at,
            is_active=app.is_active,
            next_recommended_action=ApplicationService.get_next_action(app.current_status),
            status_history=history_items,
            channel_partner=partner_resp
        )
