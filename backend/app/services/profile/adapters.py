"""
Profile Integration Adapters

Bridges persistent database profile entities (Entrepreneur, BusinessProfile, FinancialProfile)
to the input contracts expected by:
- Step 4 Deterministic Eligibility Engine (EntrepreneurProfileInput)
- Step 5 Deterministic Financial Engine (FinancialCalculationRequest)
- Step 6 Explainable Scheme Matching & Ranking Engine (SchemeMatchingRequest)
"""
from typing import Optional
from decimal import Decimal
from datetime import date

from app.models.profile import Entrepreneur, BusinessProfile, FinancialProfile
from app.schemas.eligibility import EntrepreneurProfileInput
from app.schemas.finance import FinancialCalculationRequest
from app.schemas.matching import SchemeMatchingRequest


def to_eligibility_input(
    entrepreneur: Entrepreneur,
    business: Optional[BusinessProfile] = None,
    financial: Optional[FinancialProfile] = None,
) -> EntrepreneurProfileInput:
    """
    Transforms relational profile entities into an EntrepreneurProfileInput DTO
    for deterministic evaluation in Step 4 Eligibility Engine.
    """
    # Calculate age if missing but DOB exists
    age = entrepreneur.age
    if age is None and entrepreneur.date_of_birth is not None:
        dob = entrepreneur.date_of_birth
        today = date.today()
        age = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))

    data = {
        "age": age,
        "gender": entrepreneur.gender,
        "category": entrepreneur.category,
        "social_category": entrepreneur.category,
        "state": entrepreneur.state,
        "district": entrepreneur.district,
        "area_type": entrepreneur.area_type,
    }

    if business is not None:
        data.update({
            "sector": business.sector,
            "business_stage": business.business_stage,
            "business_type": business.business_type,
            "is_greenfield": business.is_greenfield,
            "has_vending_proof": business.has_vending_proof,
            "is_notified_trade": business.is_notified_trade,
            "is_single_family_applicant": business.is_single_family_applicant,
            "has_govt_employee_in_family": business.has_govt_employee_in_family,
            "availed_pmegp_mudra_last_5yr": business.availed_pmegp_mudra_last_5yr,
            "is_non_farm_income_generating": business.is_non_farm_income_generating,
            "is_defaulter": business.is_defaulter,
            "prior_experience_years": business.existing_business_vintage_years,
        })

    if financial is not None:
        if financial.project_cost is not None:
            data["project_cost"] = float(financial.project_cost)
            data["investment"] = float(financial.project_cost)
        if financial.annual_income is not None:
            data["annual_income"] = float(financial.annual_income)
        elif financial.monthly_income is not None:
            data["annual_income"] = float(financial.monthly_income * Decimal("12.0"))

    return EntrepreneurProfileInput(**data)


def to_financial_request(
    entrepreneur: Optional[Entrepreneur] = None,
    business: Optional[BusinessProfile] = None,
    financial: Optional[FinancialProfile] = None,
    scheme_code: Optional[str] = None,
    interest_rate_override: Optional[float] = None,
    tenure_months_override: Optional[int] = None,
) -> FinancialCalculationRequest:
    """
    Transforms stored financial and enterprise data into a FinancialCalculationRequest
    for Step 5 Deterministic Financial Calculations.
    """
    project_cost = Decimal("0.00")
    own_contribution = Decimal("0.00")
    loan_req: Optional[Decimal] = None
    monthly_inc: Optional[Decimal] = None
    existing_ob: Optional[Decimal] = Decimal("0.00")
    machinery_c: Optional[Decimal] = None
    infra_c: Optional[Decimal] = None
    wc_c: Optional[Decimal] = None
    other_c: Optional[Decimal] = None

    if financial is not None:
        if financial.project_cost is not None:
            project_cost = financial.project_cost
        if financial.own_contribution is not None:
            own_contribution = financial.own_contribution
        loan_req = financial.loan_requirement
        monthly_inc = financial.monthly_income
        if monthly_inc is None and financial.annual_income is not None and financial.annual_income > 0:
            monthly_inc = (financial.annual_income / Decimal("12.0")).quantize(Decimal("0.01"))
        if financial.existing_monthly_obligations is not None:
            existing_ob = financial.existing_monthly_obligations
        machinery_c = financial.machinery_equipment_cost
        infra_c = financial.infrastructure_cost
        wc_c = financial.working_capital_cost
        other_c = financial.other_expenses_cost

    sector = business.sector if business else None
    social_category = entrepreneur.category if entrepreneur else None
    area_type = entrepreneur.area_type if entrepreneur else None
    state = entrepreneur.state if entrepreneur else None

    # Use sensible defaults for interest rate / tenure if not overridden
    annual_rate = interest_rate_override if interest_rate_override is not None else 9.0
    tenure_mo = tenure_months_override if tenure_months_override is not None else 60

    return FinancialCalculationRequest(
        project_cost=project_cost,
        own_contribution=own_contribution,
        loan_requirement=loan_req,
        annual_interest_rate=annual_rate,
        tenure_months=tenure_mo,
        monthly_income=monthly_inc,
        existing_monthly_obligations=existing_ob,
        sector=sector,
        social_category=social_category,
        area_type=area_type,
        state=state,
        scheme_code=scheme_code,
        machinery_equipment_cost=machinery_c,
        infrastructure_cost=infra_c,
        working_capital_cost=wc_c,
        other_expenses_cost=other_c,
    )


def to_matching_request(
    entrepreneur: Entrepreneur,
    business: Optional[BusinessProfile] = None,
    financial: Optional[FinancialProfile] = None,
    limit: int = 10,
    include_ineligible: bool = True,
) -> SchemeMatchingRequest:
    """
    Transforms relational profile entities into a complete SchemeMatchingRequest DTO
    for Step 6 Explainable Scheme Matching & Ranking Engine.
    """
    profile_input = to_eligibility_input(entrepreneur, business, financial)
    
    financial_req: Optional[FinancialCalculationRequest] = None
    if financial is not None and financial.project_cost is not None and financial.project_cost > 0:
        financial_req = to_financial_request(entrepreneur, business, financial)

    return SchemeMatchingRequest(
        profile=profile_input,
        financial=financial_req,
        limit=limit,
        include_ineligible=include_ineligible,
    )


def to_feasibility_context(
    entrepreneur: Entrepreneur,
    business: Optional[BusinessProfile] = None,
    financial: Optional[FinancialProfile] = None,
):
    """
    Transforms relational profile entities into FeasibilityInputContext
    for Step 9 Business & Location Feasibility Engine.
    """
    from app.schemas.feasibility import FeasibilityInputContext

    return FeasibilityInputContext(
        entrepreneur_id=entrepreneur.id,
        full_name=entrepreneur.full_name,
        business_name=business.business_name if business else None,
        sector=business.sector if business else None,
        sub_sector=business.sub_sector if business else None,
        business_stage=business.business_stage if business else None,
        is_greenfield=business.is_greenfield if business else None,
        existing_business_vintage_years=business.existing_business_vintage_years if business else None,
        state=entrepreneur.state,
        district=entrepreneur.district,
        city=entrepreneur.city,
        pincode=entrepreneur.pincode,
        area_type=entrepreneur.area_type,
        latitude=float(entrepreneur.latitude) if entrepreneur.latitude else None,
        longitude=float(entrepreneur.longitude) if entrepreneur.longitude else None,
        project_cost=financial.project_cost if financial else None,
        own_contribution=financial.own_contribution if financial else None,
        loan_requirement=financial.loan_requirement if financial else None,
        monthly_income=financial.monthly_income if financial else None,
        existing_monthly_obligations=financial.existing_monthly_obligations if financial else None,
        is_defaulter=business.is_defaulter if business else False,
    )
