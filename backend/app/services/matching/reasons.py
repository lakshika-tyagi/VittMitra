"""
Structured Explainability Reason Generator for Scheme Matching

Compiles criterion-level facts into transparent, human-readable reasons:
- Positive reasons: "Why this scheme is ranked highly"
- Negative reasons: "Why not currently eligible"
- Unverified indicators: "Missing data / uncertainty"

ZERO AI / LLM is used. All reasons are built deterministically from evaluated facts.
"""
from typing import List
from app.schemas.eligibility import EligibilityStatus, EligibilityCheckResponse
from app.schemas.matching import DimensionScore, MatchReasons


def generate_match_reasons(
    dimension_scores: List[DimensionScore],
    eligibility_response: EligibilityCheckResponse
) -> MatchReasons:
    """
    Constructs explainable positive, negative, and unverified reason lists from evaluated facts.
    """
    positive_reasons: List[str] = []
    negative_reasons: List[str] = []
    unverified_reasons: List[str] = []

    # 1. Process evaluated dimension factors
    for ds in dimension_scores:
        if ds.status == EligibilityStatus.MATCHED:
            # Add positive factor explanation
            positive_reasons.append(ds.explanation)
        elif ds.status == EligibilityStatus.FAILED:
            # Add failure explanation if not duplicate of eligibility criteria
            if ds.factor != "eligibility":
                negative_reasons.append(ds.explanation)
        elif ds.status == EligibilityStatus.UNVERIFIED:
            # Add unverified observation if not duplicate of eligibility criteria
            if ds.factor != "eligibility":
                unverified_reasons.append(ds.explanation)

    # 2. Extract detailed criterion-level eligibility reasons from Step 4
    for crit in eligibility_response.criteria:
        if crit.status == EligibilityStatus.FAILED:
            negative_reasons.append(f"Eligibility rule '{crit.criterion}' failed: {crit.explanation}")
        elif crit.status == EligibilityStatus.UNVERIFIED:
            unverified_reasons.append(f"Eligibility rule '{crit.criterion}' unverified: {crit.explanation}")

    # Remove duplicates while preserving order
    def _dedup(seq: List[str]) -> List[str]:
        seen = set()
        out = []
        for item in seq:
            if item not in seen:
                seen.add(item)
                out.append(item)
        return out

    return MatchReasons(
        positive=_dedup(positive_reasons),
        negative=_dedup(negative_reasons),
        unverified=_dedup(unverified_reasons),
    )
