"""
Deterministic Matching Dimension Evaluators

Implements explicit, explainable, and source-grounded evaluation for each matching dimension:
1. Eligibility Compatibility (Step 4 output consumption)
2. Business Sector Alignment
3. Business Stage Alignment
4. Geographic Applicability
5. Target Beneficiary Alignment
6. Financial Compatibility (Step 5 output consumption)

ZERO AI / ML / Heuristic guessing is used.
"""
from typing import Optional, List, Dict, Any
from decimal import Decimal

from app.schemas.eligibility import EligibilityStatus, EligibilityCheckResponse
from app.schemas.finance import FinancialCalculationRequest, FinancialCalculationResponse
from app.schemas.matching import DimensionScore
from app.services.matching.config import DIMENSION_WEIGHTS, STATUS_MULTIPLIERS


def evaluate_eligibility_dimension(
    eligibility_response: EligibilityCheckResponse
) -> DimensionScore:
    """
    Evaluates eligibility compatibility by consuming the authoritative Step 4 evaluation result.
    Does NOT recompute or alter eligibility outcomes.
    """
    weight = DIMENSION_WEIGHTS["eligibility"]
    status = eligibility_response.overall_status
    multiplier = STATUS_MULTIPLIERS.get(status, 0.0)
    score_awarded = round(weight * multiplier, 2)

    summary = eligibility_response.summary
    if status == EligibilityStatus.MATCHED:
        explanation = (
            f"All {summary.matched_count} evaluated mandatory eligibility criteria matched."
        )
    elif status == EligibilityStatus.UNVERIFIED:
        explanation = (
            f"{summary.unverified_count} mandatory eligibility criteria remain unverified due to missing profile inputs."
        )
    else: # FAILED
        explanation = (
            f"{summary.failed_count} mandatory eligibility criteria failed evaluation against stored rules."
        )

    return DimensionScore(
        factor="eligibility",
        status=status,
        weight=weight,
        score_awarded=score_awarded,
        explanation=explanation,
    )


def evaluate_sector_dimension(
    profile_sector: Optional[str],
    scheme_sectors: Optional[List[str]]
) -> DimensionScore:
    """
    Evaluates business sector compatibility using normalized structured values.
    """
    weight = DIMENSION_WEIGHTS["sector_fit"]

    # If scheme specifies no sectors, it is universally applicable
    if not scheme_sectors:
        return DimensionScore(
            factor="sector_fit",
            status=EligibilityStatus.MATCHED,
            weight=weight,
            score_awarded=round(weight * STATUS_MULTIPLIERS[EligibilityStatus.MATCHED], 2),
            explanation="Scheme is applicable across all business sectors.",
        )

    # Missing profile sector produces UNVERIFIED
    if profile_sector is None or not str(profile_sector).strip():
        return DimensionScore(
            factor="sector_fit",
            status=EligibilityStatus.UNVERIFIED,
            weight=weight,
            score_awarded=round(weight * STATUS_MULTIPLIERS[EligibilityStatus.UNVERIFIED], 2),
            explanation="Business sector was not specified in profile; sector compatibility is unverified.",
        )

    user_sec_norm = str(profile_sector).strip().lower().replace(" ", "_").replace("-", "_")
    scheme_secs_norm = [
        str(s).strip().lower().replace(" ", "_").replace("-", "_")
        for s in scheme_sectors
    ]

    if user_sec_norm in scheme_secs_norm:
        status = EligibilityStatus.MATCHED
        multiplier = STATUS_MULTIPLIERS[EligibilityStatus.MATCHED]
        explanation = f"Your business sector '{profile_sector}' matches the scheme's supported sectors."
    else:
        status = EligibilityStatus.FAILED
        multiplier = STATUS_MULTIPLIERS[EligibilityStatus.FAILED]
        explanation = f"Your business sector '{profile_sector}' is not in the scheme's supported sectors ({', '.join(scheme_sectors)})."

    return DimensionScore(
        factor="sector_fit",
        status=status,
        weight=weight,
        score_awarded=round(weight * multiplier, 2),
        explanation=explanation,
    )


def evaluate_stage_dimension(
    profile_stage: Optional[str],
    scheme_stages: Optional[List[str]]
) -> DimensionScore:
    """
    Evaluates enterprise development stage (e.g. idea, new_enterprise, expansion).
    """
    weight = DIMENSION_WEIGHTS["stage_fit"]

    if not scheme_stages:
        return DimensionScore(
            factor="stage_fit",
            status=EligibilityStatus.MATCHED,
            weight=weight,
            score_awarded=round(weight * STATUS_MULTIPLIERS[EligibilityStatus.MATCHED], 2),
            explanation="Scheme is applicable to all enterprise growth stages.",
        )

    if profile_stage is None or not str(profile_stage).strip():
        return DimensionScore(
            factor="stage_fit",
            status=EligibilityStatus.UNVERIFIED,
            weight=weight,
            score_awarded=round(weight * STATUS_MULTIPLIERS[EligibilityStatus.UNVERIFIED], 2),
            explanation="Business stage was not specified in profile; stage compatibility is unverified.",
        )

    user_stage_norm = str(profile_stage).strip().lower().replace(" ", "_").replace("-", "_")
    scheme_stages_norm = [
        str(s).strip().lower().replace(" ", "_").replace("-", "_")
        for s in scheme_stages
    ]

    if user_stage_norm in scheme_stages_norm:
        status = EligibilityStatus.MATCHED
        multiplier = STATUS_MULTIPLIERS[EligibilityStatus.MATCHED]
        explanation = f"Your business stage '{profile_stage}' matches the scheme's targeted enterprise phase."
    else:
        status = EligibilityStatus.FAILED
        multiplier = STATUS_MULTIPLIERS[EligibilityStatus.FAILED]
        explanation = f"Your business stage '{profile_stage}' does not match supported stages ({', '.join(scheme_stages)})."

    return DimensionScore(
        factor="stage_fit",
        status=status,
        weight=weight,
        score_awarded=round(weight * multiplier, 2),
        explanation=explanation,
    )


def evaluate_geography_dimension(
    profile_state: Optional[str],
    scheme_geography_level: Optional[str]
) -> DimensionScore:
    """
    Evaluates geographic applicability (National vs State-specific).
    """
    weight = DIMENSION_WEIGHTS["geography_fit"]
    geo = str(scheme_geography_level or "NATIONAL").strip().upper()

    if geo in ("NATIONAL", "CENTRAL", "ALL_INDIA"):
        # National schemes apply universally across all States and UTs
        if profile_state and str(profile_state).strip():
            explanation = f"Scheme applies nationally across all States and Union Territories, including {profile_state}."
        else:
            explanation = "Scheme applies nationally across all States and Union Territories."
        return DimensionScore(
            factor="geography_fit",
            status=EligibilityStatus.MATCHED,
            weight=weight,
            score_awarded=round(weight * STATUS_MULTIPLIERS[EligibilityStatus.MATCHED], 2),
            explanation=explanation,
        )

    # State-specific scheme evaluation
    if profile_state is None or not str(profile_state).strip():
        return DimensionScore(
            factor="geography_fit",
            status=EligibilityStatus.UNVERIFIED,
            weight=weight,
            score_awarded=round(weight * STATUS_MULTIPLIERS[EligibilityStatus.UNVERIFIED], 2),
            explanation="Applicant state was not provided; state-specific applicability is unverified.",
        )

    user_st_norm = str(profile_state).strip().lower().replace(" ", "_").replace("-", "_")
    geo_norm = geo.lower().replace(" ", "_").replace("-", "_")

    if (
        user_st_norm in geo_norm
        or geo_norm in user_st_norm
        or geo_norm.replace("state_", "") == user_st_norm
    ):
        status = EligibilityStatus.MATCHED
        multiplier = STATUS_MULTIPLIERS[EligibilityStatus.MATCHED]
        explanation = f"Your state '{profile_state}' is covered by this state-sponsored scheme."
    else:
        status = EligibilityStatus.FAILED
        multiplier = STATUS_MULTIPLIERS[EligibilityStatus.FAILED]
        explanation = f"Your state '{profile_state}' is not covered by this scheme (jurisdiction: {scheme_geography_level})."

    return DimensionScore(
        factor="geography_fit",
        status=status,
        weight=weight,
        score_awarded=round(weight * multiplier, 2),
        explanation=explanation,
    )


def evaluate_beneficiary_dimension(
    profile_category: Optional[str],
    profile_gender: Optional[str],
    scheme_beneficiaries: Optional[List[str]]
) -> DimensionScore:
    """
    Evaluates target beneficiary alignment from structured applicant demographic inputs.
    """
    weight = DIMENSION_WEIGHTS["beneficiary_fit"]

    if not scheme_beneficiaries:
        return DimensionScore(
            factor="beneficiary_fit",
            status=EligibilityStatus.MATCHED,
            weight=weight,
            score_awarded=round(weight * STATUS_MULTIPLIERS[EligibilityStatus.MATCHED], 2),
            explanation="Scheme has universal target beneficiary applicability.",
        )

    scheme_bens_norm = [str(b).strip().lower() for b in scheme_beneficiaries]
    is_universal = any(b in ("general", "all", "micro_entrepreneurs", "retailers") for b in scheme_bens_norm)

    has_cat = profile_category is not None and bool(str(profile_category).strip())
    has_gen = profile_gender is not None and bool(str(profile_gender).strip())

    cat_norm = str(profile_category).strip().lower() if has_cat else None
    gen_norm = str(profile_gender).strip().lower() if has_gen else None

    # Check direct match with social category or gender
    cat_match = cat_norm in scheme_bens_norm if cat_norm else False
    gen_match = (gen_norm in scheme_bens_norm or (gen_norm == "female" and "women" in scheme_bens_norm)) if gen_norm else False

    if cat_match or gen_match:
        return DimensionScore(
            factor="beneficiary_fit",
            status=EligibilityStatus.MATCHED,
            weight=weight,
            score_awarded=round(weight * STATUS_MULTIPLIERS[EligibilityStatus.MATCHED], 2),
            explanation="Your demographic profile matches the scheme's targeted beneficiary groups.",
        )

    if is_universal:
        # Scheme has broad/general access
        return DimensionScore(
            factor="beneficiary_fit",
            status=EligibilityStatus.MATCHED,
            weight=weight,
            score_awarded=round(weight * STATUS_MULTIPLIERS[EligibilityStatus.MATCHED], 2),
            explanation="Scheme provides broad assistance open to general categories and targeted groups.",
        )

    # Scheme is restrictive (e.g. only SC/ST/Women)
    if not has_cat and not has_gen:
        return DimensionScore(
            factor="beneficiary_fit",
            status=EligibilityStatus.UNVERIFIED,
            weight=weight,
            score_awarded=round(weight * STATUS_MULTIPLIERS[EligibilityStatus.UNVERIFIED], 2),
            explanation="Category and gender not specified; targeted beneficiary compatibility is unverified.",
        )

    return DimensionScore(
        factor="beneficiary_fit",
        status=EligibilityStatus.FAILED,
        weight=weight,
        score_awarded=round(weight * STATUS_MULTIPLIERS[EligibilityStatus.FAILED], 2),
        explanation=f"Scheme specifically targets ({', '.join(scheme_beneficiaries)}), which does not match provided profile.",
    )


def evaluate_financial_dimension(
    financial_req: Optional[FinancialCalculationRequest],
    profile_project_cost: Optional[Any],
    profile_sector: Optional[str],
    benefits_summary: Optional[Dict[str, Any]],
    financial_resp: Optional[FinancialCalculationResponse] = None
) -> DimensionScore:
    """
    Evaluates financial compatibility by comparing project cost / loan amounts against verified scheme ceilings.
    If no verified financial parameter is available in metadata, returns UNVERIFIED rather than guessing.
    """
    weight = DIMENSION_WEIGHTS["financial_fit"]

    # Resolve project cost
    project_cost: Optional[Decimal] = None
    if financial_req is not None and financial_req.project_cost is not None:
        project_cost = Decimal(str(financial_req.project_cost))
    elif profile_project_cost is not None:
        try:
            project_cost = Decimal(str(profile_project_cost))
        except Exception:
            project_cost = None

    # Resolve loan requirement / financing gap
    loan_amount: Optional[Decimal] = None
    if financial_resp is not None and financial_resp.loan is not None:
        loan_amount = financial_resp.loan.principal
    elif financial_req is not None and financial_req.loan_amount is not None:
        loan_amount = Decimal(str(financial_req.loan_amount))

    # If no financial inputs provided at all
    if project_cost is None and loan_amount is None:
        return DimensionScore(
            factor="financial_fit",
            status=EligibilityStatus.UNVERIFIED,
            weight=weight,
            score_awarded=round(weight * STATUS_MULTIPLIERS[EligibilityStatus.UNVERIFIED], 2),
            explanation="Financial parameters (project cost / loan requirement) were not provided; financial fit is unverified.",
        )

    # If scheme has no verified benefits summary
    if not benefits_summary or not isinstance(benefits_summary, dict):
        return DimensionScore(
            factor="financial_fit",
            status=EligibilityStatus.UNVERIFIED,
            weight=weight,
            score_awarded=round(weight * STATUS_MULTIPLIERS[EligibilityStatus.UNVERIFIED], 2),
            explanation="Scheme has no verified financial ceilings in metadata; financial fit is unverified.",
        )

    # Inspect verified parameter limits
    # 1. Project cost ceilings (e.g. PMEGP Mfg vs Srv)
    sector_norm = str(profile_sector).strip().lower() if profile_sector else ""
    max_cost_mfg = benefits_summary.get("max_project_cost_manufacturing_inr") or benefits_summary.get("max_cost_mfg")
    max_cost_srv = benefits_summary.get("max_project_cost_services_inr") or benefits_summary.get("max_cost_srv")

    if project_cost is not None:
        if "manuf" in sector_norm and max_cost_mfg is not None:
            max_c = Decimal(str(max_cost_mfg))
            if project_cost > max_c:
                return DimensionScore(
                    factor="financial_fit",
                    status=EligibilityStatus.FAILED,
                    weight=weight,
                    score_awarded=0.0,
                    explanation=f"Proposed project cost (₹{project_cost:,.2f}) exceeds manufacturing ceiling of ₹{max_c:,.2f}.",
                )
        elif ("serv" in sector_norm or "trad" in sector_norm) and max_cost_srv is not None:
            max_c = Decimal(str(max_cost_srv))
            if project_cost > max_c:
                return DimensionScore(
                    factor="financial_fit",
                    status=EligibilityStatus.FAILED,
                    weight=weight,
                    score_awarded=0.0,
                    explanation=f"Proposed project cost (₹{project_cost:,.2f}) exceeds service ceiling of ₹{max_c:,.2f}.",
                )

    # 2. Min & Max Loan Amounts (e.g. Stand-Up India, MUDRA, SVANidhi, Vishwakarma)
    min_loan = benefits_summary.get("min_loan_amount_inr") or benefits_summary.get("min_loan_inr")
    max_loan = benefits_summary.get("max_loan_amount_inr") or benefits_summary.get("max_loan_inr")

    # Product categories (MUDRA Shishu / Kishore / Tarun)
    if not max_loan and "product_categories" in benefits_summary:
        cats = benefits_summary["product_categories"]
        if isinstance(cats, dict) and "tarun" in cats and "max_loan_inr" in cats["tarun"]:
            max_loan = cats["tarun"]["max_loan_inr"]

    # Tranche maximums (SVANidhi, Vishwakarma)
    if not max_loan and "third_tranche_loan_inr" in benefits_summary:
        max_loan = benefits_summary["third_tranche_loan_inr"]
    elif not max_loan and "second_tranche_loan_inr" in benefits_summary:
        max_loan = benefits_summary["second_tranche_loan_inr"]
    elif not max_loan and "first_tranche_loan_inr" in benefits_summary:
        max_loan = benefits_summary["first_tranche_loan_inr"]

    effective_amount = loan_amount if loan_amount is not None else project_cost

    if effective_amount is not None:
        if min_loan is not None:
            min_l = Decimal(str(min_loan))
            if effective_amount < min_l:
                return DimensionScore(
                    factor="financial_fit",
                    status=EligibilityStatus.FAILED,
                    weight=weight,
                    score_awarded=0.0,
                    explanation=f"Requested financing (₹{effective_amount:,.2f}) is below the scheme minimum threshold of ₹{min_l:,.2f}.",
                )

        if max_loan is not None:
            max_l = Decimal(str(max_loan))
            if effective_amount > max_l:
                return DimensionScore(
                    factor="financial_fit",
                    status=EligibilityStatus.FAILED,
                    weight=weight,
                    score_awarded=0.0,
                    explanation=f"Requested financing (₹{effective_amount:,.2f}) exceeds the verified scheme ceiling of ₹{max_l:,.2f}.",
                )

    # If limits were checked and passed
    if min_loan is not None or max_loan is not None or max_cost_mfg is not None or max_cost_srv is not None:
        cost_str = f"₹{project_cost:,.2f}" if project_cost is not None else "provided requirements"
        return DimensionScore(
            factor="financial_fit",
            status=EligibilityStatus.MATCHED,
            weight=weight,
            score_awarded=round(weight * STATUS_MULTIPLIERS[EligibilityStatus.MATCHED], 2),
            explanation=f"Your proposed project requirement ({cost_str}) fits within verified scheme financial parameters.",
        )

    # If no specific limit found in benefits_summary
    return DimensionScore(
        factor="financial_fit",
        status=EligibilityStatus.UNVERIFIED,
        weight=weight,
        score_awarded=round(weight * STATUS_MULTIPLIERS[EligibilityStatus.UNVERIFIED], 2),
        explanation="Financial compatibility could not be fully verified because specific scheme limits are not recorded.",
    )
