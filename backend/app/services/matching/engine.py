"""
Explainable Scheme Matching & Ranking Engine Core Service

Integrates:
- Structured applicant profile and enterprise inputs
- Deterministic Step 4 Eligibility Engine outputs
- Deterministic Step 5 Financial Engine outputs
- Structured scheme knowledge metadata
- Transparent multi-dimension scoring and tie-breaking

Produces explainable shortlists with criterion-level positive, negative, and unverified facts.
ZERO AI / LLMs / embeddings / vector databases / ML models.
"""
from typing import List, Optional, Union, Dict, Any
from datetime import datetime, timezone

from app.models.scheme import Scheme
from app.schemas.eligibility import (
    EligibilityStatus,
    EntrepreneurProfileInput,
)
from app.schemas.finance import (
    FinancialCalculationRequest,
    FinancialCalculationResponse,
)
from app.schemas.matching import (
    MatchCategory,
    DimensionScore,
    SchemeMatchResult,
    SchemeMatchingResponse,
)
from app.services.eligibility.engine import EligibilityEngine
from app.services.finance.engine import FinancialEngine
from app.services.matching.dimensions import (
    evaluate_eligibility_dimension,
    evaluate_sector_dimension,
    evaluate_stage_dimension,
    evaluate_geography_dimension,
    evaluate_beneficiary_dimension,
    evaluate_financial_dimension,
)
from app.services.matching.reasons import generate_match_reasons
from app.services.matching.ranking import rank_and_shortlist_schemes


def _extract_profile_val(profile: Union[EntrepreneurProfileInput, Dict[str, Any]], *attr_names: str) -> Optional[Any]:
    """Helper to extract attribute from either a Pydantic model or dictionary safely."""
    if isinstance(profile, dict):
        for name in attr_names:
            if name in profile and profile[name] is not None:
                return profile[name]
        return None
    for name in attr_names:
        if hasattr(profile, name):
            val = getattr(profile, name)
            if val is not None:
                return val
    return None


class MatchingEngine:
    """
    Authoritative, deterministic, explainable scheme matching and ranking engine.
    """

    @classmethod
    def match_single_scheme(
        cls,
        scheme: Scheme,
        profile: Union[EntrepreneurProfileInput, Dict[str, Any]],
        financial_req: Optional[FinancialCalculationRequest] = None
    ) -> Optional[SchemeMatchResult]:
        """
        Evaluates compatibility and computes explainable score breakdown for a single scheme.
        Returns None if scheme is inactive.
        """
        if not getattr(scheme, "is_active", True):
            return None

        # 1. Step 4 Deterministic Eligibility Engine invocation (REUSE)
        eligibility_response = EligibilityEngine.evaluate_scheme(
            scheme=scheme,
            profile=profile
        )

        # 2. Step 5 Deterministic Financial Engine invocation (REUSE)
        financial_response: Optional[FinancialCalculationResponse] = None
        if financial_req is not None:
            try:
                financial_response = FinancialEngine.calculate_financial_structure(
                    request=financial_req,
                    scheme=scheme
                )
            except Exception:
                # In case of validation mismatch on calculation, retain None
                financial_response = None

        # 3. Extract profile fields
        profile_sector = _extract_profile_val(profile, "sector", "business_sector")
        profile_stage = _extract_profile_val(profile, "business_stage", "business_type", "stage")
        profile_state = _extract_profile_val(profile, "state", "residence_state")
        profile_category = _extract_profile_val(profile, "category", "social_category")
        profile_gender = _extract_profile_val(profile, "gender")
        profile_cost = _extract_profile_val(profile, "project_cost", "investment")

        # 4. Evaluate each of the 6 transparent dimensions
        dim_eligibility = evaluate_eligibility_dimension(eligibility_response)
        dim_sector = evaluate_sector_dimension(profile_sector, scheme.sectors)
        dim_stage = evaluate_stage_dimension(profile_stage, scheme.business_stages)
        dim_geography = evaluate_geography_dimension(profile_state, scheme.geography_level)
        dim_beneficiary = evaluate_beneficiary_dimension(profile_category, profile_gender, scheme.target_beneficiaries)
        dim_financial = evaluate_financial_dimension(
            financial_req=financial_req,
            profile_project_cost=profile_cost,
            profile_sector=profile_sector,
            benefits_summary=scheme.benefits_summary,
            financial_resp=financial_response
        )

        dimension_scores: List[DimensionScore] = [
            dim_eligibility,
            dim_financial,
            dim_sector,
            dim_stage,
            dim_beneficiary,
            dim_geography,
        ]

        # 5. Compute overall match score (0.0 to 100.0)
        raw_score = sum(d.score_awarded for d in dimension_scores)
        match_score = round(max(0.0, min(100.0, raw_score)), 2)

        # 6. Authoritative Category Assignment (Eligibility and Hard Constraints Dominate)
        # - Any mandatory rule FAILED -> NOT_ELIGIBLE
        # - Sector FAILED or State FAILED -> NOT_ELIGIBLE
        # - Target Beneficiary FAILED -> NOT_ELIGIBLE
        # - Mandatory rule UNVERIFIED or Key inputs UNVERIFIED -> POTENTIALLY_RELEVANT
        # - All MATCHED -> ELIGIBLE
        has_failure = (
            eligibility_response.overall_status == EligibilityStatus.FAILED
            or dim_sector.status == EligibilityStatus.FAILED
            or dim_geography.status == EligibilityStatus.FAILED
            or dim_beneficiary.status == EligibilityStatus.FAILED
            or dim_stage.status == EligibilityStatus.FAILED
        )

        has_unverified = (
            eligibility_response.overall_status == EligibilityStatus.UNVERIFIED
            or any(d.status == EligibilityStatus.UNVERIFIED for d in dimension_scores)
        )

        if has_failure:
            match_category = MatchCategory.NOT_ELIGIBLE
        elif has_unverified:
            match_category = MatchCategory.POTENTIALLY_RELEVANT
        else:
            match_category = MatchCategory.ELIGIBLE

        # 7. Generate structured explainability reasons
        reasons = generate_match_reasons(
            dimension_scores=dimension_scores,
            eligibility_response=eligibility_response
        )

        # 8. Build financial summary representation if available
        financial_summary: Optional[Dict[str, Any]] = None
        if financial_response is not None:
            financial_summary = {
                "project_cost": float(financial_response.project_cost),
                "own_contribution": float(financial_response.own_contribution),
                "own_contribution_pct": float(financial_response.own_contribution_pct),
                "financing_gap": float(financial_response.financing_gap),
                "principal": float(financial_response.loan.principal),
                "estimated_emi": float(financial_response.loan.estimated_emi),
                "annual_interest_rate": float(financial_response.loan.annual_interest_rate),
                "tenure_months": financial_response.loan.tenure_months,
                "affordability_status": financial_response.affordability.status,
            }

        return SchemeMatchResult(
            rank=1, # Temporary, updated in ranking phase
            scheme_id=scheme.id,
            scheme_code=scheme.scheme_code,
            scheme_name=scheme.scheme_name,
            nodal_ministry=scheme.nodal_ministry,
            match_category=match_category,
            match_score=match_score,
            eligibility_status=eligibility_response.overall_status,
            reasons=reasons,
            score_breakdown=dimension_scores,
            eligibility_summary=eligibility_response.summary,
            financial_summary=financial_summary,
        )

    @classmethod
    def match_and_rank_schemes(
        cls,
        schemes: List[Scheme],
        profile: Union[EntrepreneurProfileInput, Dict[str, Any]],
        financial: Optional[FinancialCalculationRequest] = None,
        limit: int = 10,
        include_ineligible: bool = True
    ) -> SchemeMatchingResponse:
        """
        Evaluates a collection of schemes against entrepreneur inputs, calculates transparent scores,
        and applies deterministic ranking.
        """
        all_evaluated: List[SchemeMatchResult] = []

        for scheme in schemes:
            match_res = cls.match_single_scheme(
                scheme=scheme,
                profile=profile,
                financial_req=financial
            )
            if match_res is not None:
                all_evaluated.append(match_res)

        # Count categories across all evaluated active schemes
        eligible_count = sum(1 for r in all_evaluated if r.match_category == MatchCategory.ELIGIBLE)
        potentially_relevant_count = sum(1 for r in all_evaluated if r.match_category == MatchCategory.POTENTIALLY_RELEVANT)
        not_eligible_count = sum(1 for r in all_evaluated if r.match_category == MatchCategory.NOT_ELIGIBLE)

        # Deterministic ranking and shortlist limiting
        ranked_results = rank_and_shortlist_schemes(
            results=all_evaluated,
            limit=limit,
            include_ineligible=include_ineligible
        )

        return SchemeMatchingResponse(
            total_schemes_evaluated=len(all_evaluated),
            eligible_count=eligible_count,
            potentially_relevant_count=potentially_relevant_count,
            not_eligible_count=not_eligible_count,
            results=ranked_results,
            disclaimer="Match Score is a VittMitra relevance/ranking indicator and is not an official government eligibility or loan-approval score.",
            evaluated_at=datetime.now(timezone.utc),
        )
