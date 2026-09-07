"""
Deterministic Ranking and Tie-Breaking Engine for Government Schemes

Sorts evaluated scheme match results using a multi-tiered deterministic key.
Zero randomness is used. Identical inputs produce identical rankings.
"""
from typing import List, Tuple
from app.schemas.matching import SchemeMatchResult
from app.services.matching.config import CATEGORY_PRIORITY, STATUS_PRIORITY


def _ranking_sort_key(item: SchemeMatchResult) -> Tuple[int, float, int, int, str]:
    """
    Computes a 5-tier deterministic sort tuple for ranking scheme results:
    1. Category Priority (Ascending: 1 for ELIGIBLE, 2 for POTENTIALLY_RELEVANT, 3 for NOT_ELIGIBLE)
    2. Negative Match Score (Descending: higher match score first)
    3. Eligibility Status Priority (Ascending: 1 for MATCHED, 2 for UNVERIFIED, 3 for FAILED)
    4. Negative Verified Criteria Matches (Descending: more matched criteria first)
    5. Scheme Code (Ascending: stable alphabetical tie-breaker)
    """
    category_rank = CATEGORY_PRIORITY.get(item.match_category, 99)
    neg_score = -float(item.match_score)
    status_rank = STATUS_PRIORITY.get(item.eligibility_status, 99)
    neg_matched_count = -int(item.eligibility_summary.matched_count)
    stable_code = str(item.scheme_code).strip().upper()

    return (category_rank, neg_score, status_rank, neg_matched_count, stable_code)


def rank_and_shortlist_schemes(
    results: List[SchemeMatchResult],
    limit: int = 10,
    include_ineligible: bool = True
) -> List[SchemeMatchResult]:
    """
    Deterministically sorts scheme results, filters ineligible schemes if requested,
    assigns 1-based integer ranks, and applies the result limit.
    """
    # 1. Filter ineligible schemes if requested
    if not include_ineligible:
        filtered = [r for r in results if r.match_category != "NOT_ELIGIBLE"]
    else:
        filtered = list(results)

    # 2. Sort deterministically using the 5-tier key
    sorted_results = sorted(filtered, key=_ranking_sort_key)

    # 3. Apply limit
    shortlisted = sorted_results[:limit] if limit and limit > 0 else sorted_results

    # 4. Reassign sequential 1-based ranks
    for idx, item in enumerate(shortlisted, start=1):
        item.rank = idx

    return shortlisted
