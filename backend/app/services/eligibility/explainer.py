"""
Deterministic Human-Readable Explanation Generator for Scheme Eligibility

Generates clean, explainable reasoning for every criterion outcome (MATCHED, FAILED, UNVERIFIED)
without utilizing AI models, LLMs, or non-deterministic generators.
"""
from typing import Any, Optional
from app.schemas.eligibility import EligibilityStatus


def generate_criterion_explanation(
    field_name: str,
    operator: str,
    expected_value: Any,
    user_value: Any,
    status: EligibilityStatus,
    rule_description: Optional[str] = None
) -> str:
    """
    Generates a deterministic, transparent explanation for why a rule matched, failed, or is unverified.
    """
    clean_field = field_name.replace("_", " ").title()

    if status == EligibilityStatus.UNVERIFIED:
        if user_value is None:
            return (
                f"{clean_field} was not provided in applicant profile; "
                f"cannot verify required condition ({operator} {expected_value})."
            )
        return (
            f"Unable to verify {clean_field} (provided: {user_value}) "
            f"against required condition ({operator} {expected_value}) due to data format or operator mismatch."
        )

    if status == EligibilityStatus.MATCHED:
        op = operator.strip().lower()
        if op in (">=", "gte"):
            return f"Applicant {clean_field.lower()} is {user_value}; meets required minimum of >= {expected_value}."
        if op in (">", "gt"):
            return f"Applicant {clean_field.lower()} is {user_value}; strictly exceeds threshold of > {expected_value}."
        if op in ("<=", "lte"):
            return f"Applicant {clean_field.lower()} is {user_value}; falls within allowable ceiling of <= {expected_value}."
        if op in ("<", "lt"):
            return f"Applicant {clean_field.lower()} is {user_value}; is strictly below limit of < {expected_value}."
        if op in ("==", "=", "eq", "boolean", "bool"):
            return f"Applicant {clean_field.lower()} is {user_value}; satisfies requirement of == {expected_value}."
        if op in ("!=", "<>", "ne"):
            return f"Applicant {clean_field.lower()} is {user_value}; satisfies condition of != {expected_value}."
        if op in ("in", "is_in"):
            return f"Applicant {clean_field.lower()} is {user_value}; is included in eligible group {expected_value}."
        if op in ("not_in", "not in"):
            return f"Applicant {clean_field.lower()} is {user_value}; is not in excluded group {expected_value}."
        if op in ("contains",):
            return f"Applicant {clean_field.lower()} contains {expected_value}; satisfies required criteria."
        if op in ("not_contains", "not contains"):
            return f"Applicant {clean_field.lower()} does not contain {expected_value}; satisfies exclusion criteria."
        return f"Applicant {clean_field.lower()} is {user_value}; satisfies condition ({operator} {expected_value})."

    if status == EligibilityStatus.FAILED:
        op = operator.strip().lower()
        if op in (">=", "gte"):
            return f"Applicant {clean_field.lower()} is {user_value}; fails to meet required minimum of >= {expected_value}."
        if op in (">", "gt"):
            return f"Applicant {clean_field.lower()} is {user_value}; does not exceed required threshold of > {expected_value}."
        if op in ("<=", "lte"):
            return f"Applicant {clean_field.lower()} is {user_value}; exceeds allowable ceiling of <= {expected_value}."
        if op in ("<", "lt"):
            return f"Applicant {clean_field.lower()} is {user_value}; is not below required limit of < {expected_value}."
        if op in ("==", "=", "eq", "boolean", "bool"):
            return f"Applicant {clean_field.lower()} is {user_value}; does not match required value of == {expected_value}."
        if op in ("!=", "<>", "ne"):
            return f"Applicant {clean_field.lower()} is {user_value}; violates restriction of != {expected_value}."
        if op in ("in", "is_in"):
            return f"Applicant {clean_field.lower()} is {user_value}; is not among eligible group {expected_value}."
        if op in ("not_in", "not in"):
            return f"Applicant {clean_field.lower()} is {user_value}; belongs to excluded group {expected_value}."
        if op in ("contains",):
            return f"Applicant {clean_field.lower()} does not contain required element {expected_value}."
        if op in ("not_contains", "not contains"):
            return f"Applicant {clean_field.lower()} contains restricted element {expected_value}."
        return f"Applicant {clean_field.lower()} is {user_value}; violates condition ({operator} {expected_value})."

    return f"Evaluated {clean_field}: status is {status.value}."
