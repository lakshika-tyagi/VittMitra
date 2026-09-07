"""
Safe Field Resolver and Profile Normalizer for Eligibility Evaluation

Safely maps rule field specifications to entrepreneur profile attributes.
Guarantees that missing or empty data returns None rather than defaulting or guessing.
"""
from typing import Any, Dict, Optional, Union
from app.schemas.eligibility import EntrepreneurProfileInput


# Canonical field aliases mapping alternative input keys to standard keys
FIELD_ALIASES: Dict[str, list[str]] = {
    "age": ["age", "applicant_age"],
    "gender": ["gender", "applicant_gender", "sex"],
    "category": ["category", "social_category", "caste_category", "caste"],
    "social_category": ["social_category", "category", "caste_category", "caste"],
    "state": ["state", "applicant_state", "business_state"],
    "district": ["district", "business_district"],
    "area_type": ["area_type", "location", "location_type", "geography_type", "region_type"],
    "business_stage": ["business_stage", "business_type", "stage", "enterprise_stage"],
    "business_type": ["business_type", "business_stage", "stage"],
    "sector": ["sector", "industry_sector", "activity_sector"],
    "annual_income": ["annual_income", "income", "family_income", "applicant_income"],
    "project_cost": ["project_cost", "investment", "loan_amount", "total_project_cost"],
    "investment": ["investment", "project_cost", "loan_amount"],
    "enterprise_size": ["enterprise_size", "msme_type", "business_size"],
    "is_greenfield": ["is_greenfield", "greenfield", "is_new_unit"],
    "is_defaulter": ["is_defaulter", "defaulter", "has_loan_default", "is_bank_defaulter"],
    "has_vending_proof": ["has_vending_proof", "vending_proof", "is_street_vendor", "has_cov_lor"],
    "is_notified_trade": ["is_notified_trade", "is_traditional_trade", "is_artisan", "traditional_artisan"],
    "is_single_family_applicant": ["is_single_family_applicant", "single_family_member", "is_one_per_family"],
    "has_govt_employee_in_family": ["has_govt_employee_in_family", "govt_employee_in_family", "has_government_servant"],
    "availed_pmegp_mudra_last_5yr": ["availed_pmegp_mudra_last_5yr", "availed_prior_central_subsidy", "prior_subsidy_5yr"],
    "is_non_farm_income_generating": ["is_non_farm_income_generating", "non_farm_activity", "is_income_generating"],
    "education_mfg_above_10lakh": ["education_mfg_above_10lakh", "education_level", "qualification"],
    "education_srv_above_5lakh": ["education_srv_above_5lakh", "education_level", "qualification"],
}


def _dict_from_profile(profile: Union[EntrepreneurProfileInput, Dict[str, Any]]) -> Dict[str, Any]:
    """Convert input profile to standardized dictionary with lowercase keys."""
    if isinstance(profile, EntrepreneurProfileInput):
        data = profile.model_dump(exclude_none=False)
    elif isinstance(profile, dict):
        data = dict(profile)
    else:
        return {}

    # Build clean normalized lookup dict with stripped lowercase keys
    normalized: Dict[str, Any] = {}
    for k, v in data.items():
        if k is not None:
            clean_k = str(k).strip().lower()
            # Treat empty strings or whitespace as None (missing)
            if isinstance(v, str) and not v.strip():
                normalized[clean_k] = None
            else:
                normalized[clean_k] = v
    return normalized


def resolve_field_value(
    field_name: str,
    profile: Union[EntrepreneurProfileInput, Dict[str, Any]]
) -> Any:
    """
    Safely resolves the user value for a given rule field name from profile inputs.
    
    Returns:
        The resolved value (str, int, float, bool, list) or None if missing/unspecified.
    """
    if not field_name:
        return None

    clean_field = field_name.strip().lower()
    data = _dict_from_profile(profile)

    # 1. Handle special compound field: category_or_gender (e.g. Stand-Up India)
    if clean_field in ("category_or_gender", "gender_or_category"):
        cat_val = resolve_field_value("category", profile)
        gen_val = resolve_field_value("gender", profile)
        res = []
        if cat_val is not None:
            res.append(str(cat_val))
        if gen_val is not None:
            res.append(str(gen_val))
        return res if res else None

    # 2. Check direct key match
    if clean_field in data and data[clean_field] is not None:
        return data[clean_field]

    # 3. Check alias lookups
    aliases = FIELD_ALIASES.get(clean_field, [])
    for alias in aliases:
        if alias in data and data[alias] is not None:
            return data[alias]

    # 4. Fallback search for partial key match in extra fields
    for k, v in data.items():
        if k == clean_field or k.replace("-", "_") == clean_field.replace("-", "_"):
            if v is not None:
                return v

    return None
