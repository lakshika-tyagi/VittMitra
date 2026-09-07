"""
Central Scoring Configuration for Explainable Scheme Matching & Ranking Engine

All scoring weights, dimension definitions, and tie-breaking priorities are defined
transparently in this single module. NO weights or formulas are scattered across code.
"""
from typing import Dict
from app.schemas.eligibility import EligibilityStatus
from app.schemas.matching import MatchCategory

# ==============================================================================
# TRANSPARENT MATCHING DIMENSION WEIGHTS (Sum = 100.0)
# ==============================================================================
# Rationale:
# 1. Eligibility Compatibility (35%): Dominant dimension. If government rules are not
#    satisfied or verified, a scheme cannot be formally availed regardless of other fits.
# 2. Financial Fit (20%): Project cost ceilings, minimum/maximum loan limits, and margin
#    money requirements dictate whether the entrepreneur's project can be financed.
# 3. Sector Fit (15%): Direct alignment with supported industries (manufacturing, services,
#    trading, handicrafts, agro-allied).
# 4. Business Stage Fit (10%): Match with enterprise maturity (idea, new_enterprise, expansion).
# 5. Target Beneficiary Fit (10%): Inclusion of applicant's demographic/social group or general access.
# 6. Geographic Fit (10%): National applicability vs state-specific jurisdiction.
DIMENSION_WEIGHTS: Dict[str, float] = {
    "eligibility": 35.0,
    "financial_fit": 20.0,
    "sector_fit": 15.0,
    "stage_fit": 10.0,
    "beneficiary_fit": 10.0,
    "geography_fit": 10.0,
}

# Verify total weight invariants
TOTAL_MAX_SCORE: float = sum(DIMENSION_WEIGHTS.values()) # 100.0

# ==============================================================================
# STATUS MULTIPLIERS FOR SCORE COMPUTATION
# ==============================================================================
# MATCHED: Complete verified alignment -> full weight awarded
# UNVERIFIED: Missing profile inputs or unverified parameters -> neutral 50% credit
# FAILED: Explicit mismatch or condition violation -> 0.0 points
STATUS_MULTIPLIERS: Dict[EligibilityStatus, float] = {
    EligibilityStatus.MATCHED: 1.0,
    EligibilityStatus.UNVERIFIED: 0.5,
    EligibilityStatus.FAILED: 0.0,
}

# ==============================================================================
# DETERMINISTIC TIE-BREAKING AND SORT PRIORITIES
# ==============================================================================
# Lower integer indicates higher ranking preference.
CATEGORY_PRIORITY: Dict[MatchCategory, int] = {
    MatchCategory.ELIGIBLE: 1,
    MatchCategory.POTENTIALLY_RELEVANT: 2,
    MatchCategory.NOT_ELIGIBLE: 3,
}

STATUS_PRIORITY: Dict[EligibilityStatus, int] = {
    EligibilityStatus.MATCHED: 1,
    EligibilityStatus.UNVERIFIED: 2,
    EligibilityStatus.FAILED: 3,
}
