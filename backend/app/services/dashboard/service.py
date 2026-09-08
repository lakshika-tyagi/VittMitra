"""
Dashboard Aggregation & Orchestration Service Layer

Coordinates existing deterministic modules (Profile, Financial Engine, Matching Engine,
Feasibility Engine, Channel Partners, and Application Tracking) into a unified, state-aware
entrepreneur dashboard response without duplicating business logic.
"""
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
from decimal import Decimal
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.models.profile import Entrepreneur, BusinessProfile, FinancialProfile
from app.models.scheme import Scheme
from app.schemas.dashboard import (
    DashboardResponse,
    ProfileSummary,
    BusinessSummary,
    FinancialSummary,
    FeasibilitySummary,
    RecommendedSchemeSummary,
    ApplicationSummary,
    ProgressJourney,
    JourneyStage,
    NextBestAction,
)
from app.schemas.profile import ProfileCompleteness
from app.schemas.feasibility import FeasibilityOutcome, FeasibilityAnalysisResponse
from app.schemas.matching import MatchCategory, EligibilityStatus
from app.services.profile.service import (
    get_entrepreneur,
    list_entrepreneurs,
    get_business_profiles_by_entrepreneur,
    get_financial_profiles_by_entrepreneur,
    evaluate_profile_completeness,
)
from app.services.profile.adapters import (
    to_eligibility_input,
    to_financial_request,
    to_matching_request,
    to_feasibility_context,
)
from app.services.finance.engine import FinancialEngine
from app.services.matching.engine import MatchingEngine
from app.services.feasibility.engine import FeasibilityEngine
from app.services.application.service import ApplicationService


class DashboardService:
    """Orchestrates comprehensive entrepreneur dashboard data aggregation."""

    @classmethod
    async def get_dashboard(
        cls,
        db: AsyncSession,
        profile_id: Optional[int] = None,
    ) -> DashboardResponse:
        """
        Builds a state-aware aggregated dashboard payload for the specified profile,
        or the active/most recent entrepreneur if none specified.
        """
        entrepreneur: Optional[Entrepreneur] = None

        if profile_id is not None:
            entrepreneur = await get_entrepreneur(db, profile_id)
        else:
            # Fetch the most recently created or active entrepreneur
            entrepreneurs = await list_entrepreneurs(db, skip=0, limit=1)
            if entrepreneurs:
                entrepreneur = entrepreneurs[0]

        # 1. Handle completely empty / new user state
        if not entrepreneur:
            return cls._build_empty_dashboard()

        # 2. Fetch associated business & financial profiles
        business_profiles = await get_business_profiles_by_entrepreneur(db, entrepreneur.id)
        financial_profiles = await get_financial_profiles_by_entrepreneur(db, entrepreneur.id)
        business: Optional[BusinessProfile] = business_profiles[0] if business_profiles else None
        financial: Optional[FinancialProfile] = financial_profiles[0] if financial_profiles else None

        # 3. Compute Profile Completeness
        completeness = evaluate_profile_completeness(entrepreneur, business, financial)

        profile_summary = ProfileSummary(
            id=entrepreneur.id,
            full_name=entrepreneur.full_name,
            age=entrepreneur.age,
            gender=entrepreneur.gender,
            category=entrepreneur.category,
            state=entrepreneur.state,
            district=entrepreneur.district,
            city=entrepreneur.city,
            pincode=entrepreneur.pincode,
            area_type=entrepreneur.area_type,
            latitude=entrepreneur.latitude,
            longitude=entrepreneur.longitude,
            preferred_language=entrepreneur.preferred_language,
            completeness=completeness,
        )

        business_summary = BusinessSummary(
            id=business.id if business else None,
            business_name=business.business_name if business else "Proposed Enterprise",
            sector=business.sector if business else None,
            sub_sector=business.sub_sector if business else None,
            business_stage=business.business_stage if business else None,
            business_type=business.business_type if business else None,
            is_greenfield=business.is_greenfield if business else None,
            existing_business_vintage_years=business.existing_business_vintage_years if business else None,
            location_label=f"{entrepreneur.district or ''}, {entrepreneur.state or ''}".strip(", "),
        )

        # 4. Financial Calculations using Step 5 Engine
        fin_request = to_financial_request(entrepreneur, business, financial)
        fin_calc = FinancialEngine.calculate_financial_structure(fin_request)

        financial_summary = FinancialSummary(
            project_cost=float(fin_calc.project_cost),
            own_contribution_amount=float(fin_calc.own_contribution),
            own_contribution_percentage=float(fin_calc.own_contribution_pct),
            proposed_loan_amount=float(fin_calc.loan.principal),
            subsidy_amount=float(fin_calc.financing_gap - fin_calc.loan.principal) if fin_calc.financing_gap > fin_calc.loan.principal else 0.0,
            subsidy_percentage=0.0,
            estimated_monthly_emi=float(fin_calc.loan.estimated_emi),
            interest_rate_applied=float(fin_calc.loan.annual_interest_rate),
            tenure_months_applied=int(fin_calc.loan.tenure_months),
            annual_income=float(financial.annual_income) if financial and financial.annual_income is not None else None,
        )

        # 5. Feasibility Evaluation using Step 9 Engine
        feasibility_summary = await cls._evaluate_feasibility_summary(
            db, entrepreneur, business, financial
        )

        # 6. Matching & Recommendations using Step 6 Engine
        matching_request = to_matching_request(
            entrepreneur, business, financial, limit=5, include_ineligible=True
        )
        
        # Load verified schemes with rules and sources
        scheme_stmt = (
            select(Scheme)
            .options(
                selectinload(Scheme.eligibility_rules),
                selectinload(Scheme.sources),
            )
            .order_by(Scheme.id.asc())
        )
        scheme_res = await db.execute(scheme_stmt)
        all_schemes = list(scheme_res.scalars().all())

        matching_result = MatchingEngine.match_and_rank_schemes(
            schemes=all_schemes,
            profile=matching_request.profile,
            financial=matching_request.financial,
            limit=matching_request.limit,
            include_ineligible=matching_request.include_ineligible,
        )
        recommended_schemes = cls._format_recommended_schemes(matching_result.results, all_schemes)

        # 7. Active Applications using Step 10 Service
        tracked_apps = await ApplicationService.get_entrepreneur_applications(db, entrepreneur.id)
        active_applications = cls._format_active_applications(tracked_apps)

        # 8. Deterministic Progress Journey
        progress_journey = cls._compute_progress_journey(
            completeness=completeness,
            business=business,
            feasibility=feasibility_summary,
            recommended_schemes=recommended_schemes,
            active_applications=active_applications,
        )

        # 9. Deterministic Next Best Actions
        next_actions = cls._compute_next_actions(
            entrepreneur=entrepreneur,
            business=business,
            financial=financial,
            completeness=completeness,
            feasibility=feasibility_summary,
            recommended_schemes=recommended_schemes,
            active_applications=active_applications,
        )

        return DashboardResponse(
            has_profile=True,
            profile=profile_summary,
            business=business_summary,
            financial=financial_summary,
            feasibility=feasibility_summary,
            recommended_schemes=recommended_schemes,
            active_applications=active_applications,
            progress_journey=progress_journey,
            next_actions=next_actions,
            system_status={
                "environment": "development",
                "eligibility_engine": "Step 4 Deterministic Engine Active",
                "financial_engine": "Step 5 Rule & Formula Engine Active",
                "matching_engine": "Step 6 Multi-Dimensional Ranking Active",
                "feasibility_engine": "Step 9 Geospatial Signal Engine Active",
                "channel_partners": "Step 10 Verified Discovery Active",
                "ai_copilot": "Step 11 Grounded RAG + Gemini Active",
            },
        )

    @classmethod
    async def _evaluate_feasibility_summary(
        cls,
        db: AsyncSession,
        entrepreneur: Entrepreneur,
        business: Optional[BusinessProfile],
        financial: Optional[FinancialProfile],
    ) -> FeasibilitySummary:
        """Evaluates Step 9 Feasibility and creates a compact dashboard summary."""
        feasibility_ctx = to_feasibility_context(entrepreneur, business, financial)
        
        if not entrepreneur.district or not entrepreneur.state or not business or not business.sector:
            return FeasibilitySummary(
                status=FeasibilityOutcome.INSUFFICIENT_DATA,
                status_label="Insufficient Data",
                summary="Complete district, state, and enterprise sector details to generate location intelligence and market viability signals.",
                district=entrepreneur.district,
                state=entrepreneur.state,
                total_signals=0,
                has_sufficient_data=False,
            )

        from app.api.v1.endpoints.feasibility import resolve_district_and_clusters
        district_data, clusters = await resolve_district_and_clusters(
            db=db,
            state=feasibility_ctx.state,
            district=feasibility_ctx.district,
            lat=feasibility_ctx.latitude,
            lng=feasibility_ctx.longitude,
            sector=feasibility_ctx.sector,
        )

        analysis = FeasibilityEngine.evaluate_feasibility(
            context=feasibility_ctx,
            district_ecosystem=district_data,
            nearby_clusters=clusters,
        )

        pos_count = len(analysis.positive_signals)
        caut_count = len(analysis.risk_signals)
        risk_count = 1 if analysis.overall_status == FeasibilityOutcome.HIGH_RISK else 0

        top_signals_list = [
            {
                "title": s.title,
                "signal_type": s.signal_type.value,
                "status": s.status.value,
                "is_positive": s.is_positive,
                "interpretation": s.interpretation,
                "explanation": s.explanation,
            }
            for s in analysis.signals[:3]
        ]

        return FeasibilitySummary(
            status=analysis.overall_status,
            status_label=analysis.overall_status.value.replace("_", " ").title(),
            summary=analysis.summary_notes or analysis.headline,
            district=entrepreneur.district,
            state=entrepreneur.state,
            total_signals=len(analysis.signals),
            positive_signals_count=pos_count,
            caution_signals_count=caut_count,
            high_risk_signals_count=risk_count,
            nearby_clusters_count=len(clusters),
            top_signals=top_signals_list,
            has_sufficient_data=True,
        )

    @classmethod
    def _format_recommended_schemes(
        cls,
        ranked_schemes: List[Any],
        all_schemes: List[Scheme],
    ) -> List[RecommendedSchemeSummary]:
        """Formats ranked scheme matches into compact dashboard recommendation models."""
        scheme_map = {s.id: s for s in all_schemes}
        results: List[RecommendedSchemeSummary] = []

        for item in ranked_schemes[:4]:
            scheme_obj = scheme_map.get(item.scheme_id)
            tags: List[str] = []
            if scheme_obj and scheme_obj.sectors:
                tags.extend(scheme_obj.sectors[:2])
            if scheme_obj and scheme_obj.target_beneficiaries:
                tags.extend(scheme_obj.target_beneficiaries[:2])

            subsidy_val = scheme_obj.benefits_summary.get("subsidy_percentage") if scheme_obj and scheme_obj.benefits_summary else None
            max_loan_val = scheme_obj.benefits_summary.get("max_loan_amount") if scheme_obj and scheme_obj.benefits_summary else None

            subsidy_str = f"Up to {subsidy_val}% Subsidy" if subsidy_val else "Subsidised Credit"
            loan_str = f"Max ₹{int(max_loan_val):,}" if max_loan_val else "Collateral-free Loan"

            primary_pos = item.reasons.positive[0] if item.reasons and item.reasons.positive else None

            results.append(
                RecommendedSchemeSummary(
                    rank=item.rank,
                    scheme_id=item.scheme_id,
                    scheme_code=item.scheme_code,
                    scheme_name=item.scheme_name,
                    nodal_ministry=item.nodal_ministry,
                    match_category=item.match_category,
                    match_score=round(item.match_score, 1),
                    eligibility_status=item.eligibility_status,
                    key_benefit=subsidy_str,
                    primary_reason=primary_pos,
                    tags=tags,
                    subsidy_display=subsidy_str,
                    max_loan_display=loan_str,
                )
            )

        return results

    @classmethod
    def _format_active_applications(
        cls,
        tracked_apps: List[Any],
    ) -> List[ApplicationSummary]:
        """Formats user-recorded applications for dashboard display."""
        results: List[ApplicationSummary] = []
        for app in tracked_apps:
            status_val = app.current_status
            status_label = str(status_val).replace("_", " ").title()

            results.append(
                ApplicationSummary(
                    id=app.id,
                    scheme_id=app.scheme_id,
                    scheme_code=app.scheme_code,
                    scheme_name=app.scheme_name,
                    application_reference_number=app.application_reference_number,
                    current_status=str(status_val),
                    status_display=status_label,
                    application_date=app.application_date,
                    last_updated_at=app.last_updated_at,
                    partner_name=app.partner_name or "Direct Portal",
                    partner_type=app.partner_type or "ONLINE",
                    next_recommended_action=app.next_recommended_action or "Monitor status and prepare supporting documents",
                    is_user_recorded=True,
                )
            )
        return results

    @classmethod
    def _compute_progress_journey(
        cls,
        completeness: ProfileCompleteness,
        business: Optional[BusinessProfile],
        feasibility: FeasibilitySummary,
        recommended_schemes: List[RecommendedSchemeSummary],
        active_applications: List[ApplicationSummary],
    ) -> ProgressJourney:
        """
        Deterministically evaluates stage completion across the 8 journey milestones.
        """
        # Stage 1: Personal Profile
        is_profile_done = "personal" in completeness.completed_sections
        # Stage 2: Business & Location
        is_business_done = business is not None and bool(business.sector and business.business_stage)
        # Stage 3: Feasibility Analysis
        is_feasibility_done = feasibility.has_sufficient_data and feasibility.status != FeasibilityOutcome.INSUFFICIENT_DATA
        # Stage 4: Schemes Discovery
        is_schemes_done = len(recommended_schemes) > 0
        # Stage 5: Best-Fit Selection
        is_scheme_selected = any(s.match_score >= 70.0 for s in recommended_schemes) or len(active_applications) > 0
        # Stage 6: Channel Partner Access
        is_partner_done = len(active_applications) > 0
        # Stage 7: Application Submitted
        is_app_submitted = len(active_applications) > 0
        # Stage 8: Application Tracking Active
        is_tracking_active = len(active_applications) > 0

        stages = [
            JourneyStage(
                stage_id="profile",
                title="Entrepreneur Profile",
                description="Personal and demographic foundation for scheme criteria.",
                is_completed=is_profile_done,
                is_current=not is_profile_done,
                target_url="/onboarding?edit=true&step=1",
            ),
            JourneyStage(
                stage_id="business",
                title="Business & Location",
                description="Enterprise activity, sector, and geographic coordinates.",
                is_completed=is_business_done,
                is_current=is_profile_done and not is_business_done,
                target_url="/onboarding?edit=true&step=2",
            ),
            JourneyStage(
                stage_id="feasibility",
                title="Business Feasibility",
                description="Geospatial MSME density and local cluster viability.",
                is_completed=is_feasibility_done,
                is_current=is_business_done and not is_feasibility_done,
                target_url="/feasibility",
            ),
            JourneyStage(
                stage_id="schemes",
                title="Schemes For You",
                description="Ranked government schemes matching your profile.",
                is_completed=is_schemes_done,
                is_current=is_feasibility_done and not is_schemes_done,
                target_url="/schemes",
            ),
            JourneyStage(
                stage_id="best_fit",
                title="Best-Fit Scheme & Eligibility",
                description="Deep-dive into subsidy structure, EMI, and required documents.",
                is_completed=is_scheme_selected,
                is_current=is_schemes_done and not is_scheme_selected,
                target_url=f"/schemes/{recommended_schemes[0].scheme_code}" if recommended_schemes else "/schemes",
            ),
            JourneyStage(
                stage_id="channel_partner",
                title="Channel Partner Access",
                description="Locate verified DIC, Bank branch, or CSC facilitation centre.",
                is_completed=is_partner_done,
                is_current=is_scheme_selected and not is_partner_done,
                target_url=f"/schemes/{recommended_schemes[0].scheme_code}/access" if recommended_schemes else "/schemes",
            ),
            JourneyStage(
                stage_id="application",
                title="Application Preparation",
                description="Assemble mandatory DPR and verified document package.",
                is_completed=is_app_submitted,
                is_current=is_partner_done and not is_app_submitted,
                target_url="/applications",
            ),
            JourneyStage(
                stage_id="tracking",
                title="Application Tracking",
                description="Track application milestones and get post-loan AI copilot guidance.",
                is_completed=is_tracking_active,
                is_current=is_app_submitted,
                target_url="/applications",
            ),
        ]

        completed_count = sum(1 for s in stages if s.is_completed)
        progress_pct = round((completed_count / len(stages)) * 100.0, 1)

        # Identify current stage
        current_stage = next((s for s in stages if s.is_current), stages[-1])

        return ProgressJourney(
            current_stage_id=current_stage.stage_id,
            current_stage_title=current_stage.title,
            completion_percentage=progress_pct,
            stages=stages,
        )

    @classmethod
    def _compute_next_actions(
        cls,
        entrepreneur: Entrepreneur,
        business: Optional[BusinessProfile],
        financial: Optional[FinancialProfile],
        completeness: ProfileCompleteness,
        feasibility: FeasibilitySummary,
        recommended_schemes: List[RecommendedSchemeSummary],
        active_applications: List[ApplicationSummary],
    ) -> List[NextBestAction]:
        """
        Deterministically selects prioritized next best actions based on actual user state.
        Priority hierarchy (Section 29):
        1. Missing personal / profile information
        2. Missing business / sector information
        3. Missing location / district information
        4. Missing financial information
        5. Feasibility review or update
        6. Explore personalized scheme recommendations
        7. Review top eligible scheme details
        8. Compare schemes
        9. Locate verified channel partner
        10. Track submitted application
        """
        actions: List[NextBestAction] = []

        # 1. Incomplete Profile Actions
        if not completeness.is_complete:
            missing_text = ", ".join([f.replace(".", " ") for f in completeness.missing_fields[:3]])
            actions.append(
                NextBestAction(
                    action_id="complete_profile",
                    priority=1,
                    title="Complete Missing Profile Fields",
                    description=f"Fill missing details ({missing_text}) to maximize eligibility accuracy.",
                    badge_label="Profile Incomplete",
                    badge_type="amber",
                    cta_label="Update Profile",
                    target_url="/onboarding?edit=true",
                    action_category="profile",
                )
            )

        # 2. Feasibility Action
        if not feasibility.has_sufficient_data:
            actions.append(
                NextBestAction(
                    action_id="add_location_feasibility",
                    priority=2,
                    title="Provide Location & Sector for Market Viability",
                    description="Enter your district and enterprise sector to unlock local MSME density signals.",
                    badge_label="Feasibility Pending",
                    badge_type="amber",
                    cta_label="Add Location Details",
                    target_url="/onboarding?edit=true&step=2",
                    action_category="feasibility",
                )
            )
        elif feasibility.status == FeasibilityOutcome.CAUTION:
            actions.append(
                NextBestAction(
                    action_id="review_feasibility_cautions",
                    priority=4,
                    title="Review Market Feasibility Cautions",
                    description=feasibility.summary,
                    badge_label="Caution Signals",
                    badge_type="amber",
                    cta_label="Inspect Location Signals",
                    target_url="/feasibility",
                    action_category="feasibility",
                )
            )

        # 3. Active Applications Action
        if active_applications:
            top_app = active_applications[0]
            actions.append(
                NextBestAction(
                    action_id=f"track_app_{top_app.id}",
                    priority=3,
                    title=f"Track Application for {top_app.scheme_name}",
                    description=f"Status: {top_app.status_display}. Next step: {top_app.next_recommended_action}",
                    badge_label="Active Application",
                    badge_type="emerald",
                    cta_label="Open Tracker",
                    target_url="/applications",
                    action_category="application",
                )
            )

        # 4. Scheme Discovery & Deep-Dive Actions
        if recommended_schemes:
            top_scheme = recommended_schemes[0]
            if not active_applications:
                actions.append(
                    NextBestAction(
                        action_id=f"review_best_fit_{top_scheme.scheme_code}",
                        priority=2,
                        title=f"Explore Best-Fit Scheme: {top_scheme.scheme_name}",
                        description=f"Match Score: {top_scheme.match_score}%. {top_scheme.primary_reason or top_scheme.key_benefit}",
                        badge_label="Top Match",
                        badge_type="emerald",
                        cta_label="View Scheme Details",
                        target_url=f"/schemes/{top_scheme.scheme_code}",
                        action_category="schemes",
                    )
                )

                actions.append(
                    NextBestAction(
                        action_id=f"find_partner_{top_scheme.scheme_code}",
                        priority=5,
                        title=f"Find Verified Channel Partner for {top_scheme.scheme_code}",
                        description="Locate nearby District Industries Centre (DIC) or bank branches to assist your application.",
                        badge_label="Assistance",
                        badge_type="blue",
                        cta_label="Find Partners",
                        target_url=f"/schemes/{top_scheme.scheme_code}/access",
                        action_category="access",
                    )
                )

            if len(recommended_schemes) >= 2:
                actions.append(
                    NextBestAction(
                        action_id="compare_schemes",
                        priority=6,
                        title="Compare Top Government Schemes",
                        description=f"Side-by-side comparison of {recommended_schemes[0].scheme_code} and {recommended_schemes[1].scheme_code}.",
                        badge_label="Comparison",
                        badge_type="purple",
                        cta_label="Compare Schemes",
                        target_url=f"/schemes/compare?schemes={recommended_schemes[0].scheme_code},{recommended_schemes[1].scheme_code}",
                        action_category="schemes",
                    )
                )

        # Sort actions by deterministic priority
        actions.sort(key=lambda a: a.priority)
        return actions[:4]

    @classmethod
    def _build_empty_dashboard(cls) -> DashboardResponse:
        """Returns empty initial state guiding first-time entrepreneurs to start onboarding."""
        empty_stages = [
            JourneyStage(
                stage_id="profile",
                title="Entrepreneur Profile",
                description="Personal and demographic foundation.",
                is_completed=False,
                is_current=True,
                target_url="/onboarding",
            ),
            JourneyStage(
                stage_id="business",
                title="Business & Location",
                description="Enterprise activity and sector.",
                is_completed=False,
                is_current=False,
                target_url="/onboarding",
            ),
            JourneyStage(
                stage_id="feasibility",
                title="Business Feasibility",
                description="Geospatial cluster analysis.",
                is_completed=False,
                is_current=False,
                target_url="/feasibility",
            ),
            JourneyStage(
                stage_id="schemes",
                title="Schemes For You",
                description="Personalized government schemes.",
                is_completed=False,
                is_current=False,
                target_url="/schemes",
            ),
        ]

        return DashboardResponse(
            has_profile=False,
            profile=None,
            business=None,
            financial=None,
            feasibility=None,
            recommended_schemes=[],
            active_applications=[],
            progress_journey=ProgressJourney(
                current_stage_id="profile",
                current_stage_title="Entrepreneur Profile",
                completion_percentage=0.0,
                stages=empty_stages,
            ),
            next_actions=[
                NextBestAction(
                    action_id="start_onboarding",
                    priority=1,
                    title="Begin Entrepreneur Onboarding",
                    description="Create your profile to unlock personalized government scheme matching, financial structuring, and location feasibility.",
                    badge_label="Get Started",
                    badge_type="emerald",
                    cta_label="Start Onboarding",
                    target_url="/onboarding",
                    action_category="profile",
                )
            ],
            system_status={
                "environment": "development",
                "ready": True,
            },
        )
