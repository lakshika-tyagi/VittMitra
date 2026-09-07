"""
Profile Foundation Service Layer

Handles CRUD operations, relational persistence, and deterministic completeness tracking
for entrepreneurs, business profiles, and financial inputs.
"""
from typing import List, Optional, Dict, Any
from datetime import date
from decimal import Decimal
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from sqlalchemy.orm import selectinload

from app.models.profile import Entrepreneur, BusinessProfile, FinancialProfile
from app.schemas.profile import (
    EntrepreneurCreate,
    EntrepreneurUpdate,
    EntrepreneurResponse,
    BusinessProfileCreate,
    BusinessProfileUpdate,
    BusinessProfileResponse,
    FinancialProfileCreate,
    FinancialProfileUpdate,
    FinancialProfileResponse,
    UnifiedProfileCreate,
    UnifiedProfileResponse,
    ProfileCompleteness,
)


def evaluate_profile_completeness(
    entrepreneur: Entrepreneur,
    business: Optional[BusinessProfile] = None,
    financial: Optional[FinancialProfile] = None,
) -> ProfileCompleteness:
    """
    Deterministically computes completeness metrics across personal, business, and financial sections.
    Zero heuristics, zero AI/LLM. Strictly inspects core required attributes.
    """
    missing_fields: List[str] = []
    completed_sections: List[str] = []
    
    # 1. Personal section evaluation
    personal_required = {
        "full_name": bool(entrepreneur.full_name and entrepreneur.full_name.strip()),
        "age_or_dob": bool(entrepreneur.age is not None or entrepreneur.date_of_birth is not None),
        "state": bool(entrepreneur.state and entrepreneur.state.strip()),
    }
    personal_missing = [f"personal.{k}" for k, v in personal_required.items() if not v]
    missing_fields.extend(personal_missing)
    personal_complete = len(personal_missing) == 0
    if personal_complete:
        completed_sections.append("personal")

    # 2. Business section evaluation
    if business is None:
        business_required = {
            "sector": False,
            "business_stage": False,
        }
        business_missing = ["business.profile_missing", "business.sector", "business.business_stage"]
        missing_fields.extend(business_missing)
        business_complete = False
    else:
        business_required = {
            "sector": bool(business.sector and business.sector.strip()),
            "business_stage": bool(business.business_stage and business.business_stage.strip()),
        }
        business_missing = [f"business.{k}" for k, v in business_required.items() if not v]
        missing_fields.extend(business_missing)
        business_complete = len(business_missing) == 0
        if business_complete:
            completed_sections.append("business")

    # 3. Financial section evaluation
    if financial is None:
        financial_required = {
            "project_cost": False,
        }
        financial_missing = ["financial.profile_missing", "financial.project_cost"]
        missing_fields.extend(financial_missing)
        financial_complete = False
    else:
        financial_required = {
            "project_cost": bool(financial.project_cost is not None and financial.project_cost > Decimal("0.00")),
        }
        financial_missing = [f"financial.{k}" for k, v in financial_required.items() if not v]
        missing_fields.extend(financial_missing)
        financial_complete = len(financial_missing) == 0
        if financial_complete:
            completed_sections.append("financial")

    # Aggregate completeness
    all_points = (
        list(personal_required.values())
        + list(business_required.values())
        + list(financial_required.values())
    )
    total_points = len(all_points)
    satisfied_points = sum(1 for p in all_points if p)
    completion_percentage = round((satisfied_points / total_points) * 100.0, 1) if total_points > 0 else 0.0
    is_complete = personal_complete and business_complete and financial_complete

    section_breakdown = {
        "personal": {
            "is_complete": personal_complete,
            "required_fields": list(personal_required.keys()),
            "missing_fields": personal_missing,
        },
        "business": {
            "is_complete": business_complete,
            "required_fields": list(business_required.keys()),
            "missing_fields": business_missing,
        },
        "financial": {
            "is_complete": financial_complete,
            "required_fields": list(financial_required.keys()),
            "missing_fields": financial_missing,
        },
    }

    return ProfileCompleteness(
        is_complete=is_complete,
        completion_percentage=completion_percentage,
        missing_fields=missing_fields,
        completed_sections=completed_sections,
        section_breakdown=section_breakdown,
    )


# ==============================================================================
# Entrepreneur CRUD
# ==============================================================================

async def create_entrepreneur(db: AsyncSession, payload: EntrepreneurCreate) -> Entrepreneur:
    data = payload.model_dump()
    # If age is not set but date_of_birth is, compute age deterministically
    if data.get("age") is None and data.get("date_of_birth") is not None:
        dob: date = data["date_of_birth"]
        today = date.today()
        calculated_age = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
        data["age"] = calculated_age

    entrepreneur = Entrepreneur(**data)
    db.add(entrepreneur)
    await db.commit()
    await db.refresh(entrepreneur)
    return entrepreneur


async def get_entrepreneur(db: AsyncSession, entrepreneur_id: int) -> Optional[Entrepreneur]:
    query = (
        select(Entrepreneur)
        .where(Entrepreneur.id == entrepreneur_id)
        .options(
            selectinload(Entrepreneur.business_profiles),
            selectinload(Entrepreneur.financial_profiles),
        )
    )
    result = await db.execute(query)
    return result.scalar_one_or_none()


async def list_entrepreneurs(db: AsyncSession, skip: int = 0, limit: int = 50) -> List[Entrepreneur]:
    query = (
        select(Entrepreneur)
        .order_by(Entrepreneur.id.desc())
        .offset(skip)
        .limit(limit)
        .options(
            selectinload(Entrepreneur.business_profiles),
            selectinload(Entrepreneur.financial_profiles),
        )
    )
    result = await db.execute(query)
    return list(result.scalars().all())


async def update_entrepreneur(
    db: AsyncSession, entrepreneur_id: int, payload: EntrepreneurUpdate
) -> Optional[Entrepreneur]:
    entrepreneur = await get_entrepreneur(db, entrepreneur_id)
    if not entrepreneur:
        return None

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(entrepreneur, field, value)

    # Recompute age if date_of_birth changed and age not explicitly provided
    if "date_of_birth" in update_data and "age" not in update_data and entrepreneur.date_of_birth is not None:
        dob = entrepreneur.date_of_birth
        today = date.today()
        entrepreneur.age = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))

    await db.commit()
    await db.refresh(entrepreneur)
    return entrepreneur


async def delete_entrepreneur(db: AsyncSession, entrepreneur_id: int) -> bool:
    entrepreneur = await get_entrepreneur(db, entrepreneur_id)
    if not entrepreneur:
        return False
    await db.delete(entrepreneur)
    await db.commit()
    return True


# ==============================================================================
# Business Profile CRUD
# ==============================================================================

async def create_business_profile(
    db: AsyncSession, entrepreneur_id: int, payload: BusinessProfileCreate
) -> BusinessProfile:
    business_data = payload.model_dump()
    business_data["entrepreneur_id"] = entrepreneur_id
    business = BusinessProfile(**business_data)
    db.add(business)
    await db.commit()
    await db.refresh(business)
    return business


async def get_business_profile(db: AsyncSession, business_id: int) -> Optional[BusinessProfile]:
    query = select(BusinessProfile).where(BusinessProfile.id == business_id)
    result = await db.execute(query)
    return result.scalar_one_or_none()


async def get_business_profiles_by_entrepreneur(
    db: AsyncSession, entrepreneur_id: int
) -> List[BusinessProfile]:
    query = (
        select(BusinessProfile)
        .where(BusinessProfile.entrepreneur_id == entrepreneur_id)
        .order_by(BusinessProfile.id.desc())
    )
    result = await db.execute(query)
    return list(result.scalars().all())


async def update_business_profile(
    db: AsyncSession, business_id: int, payload: BusinessProfileUpdate
) -> Optional[BusinessProfile]:
    business = await get_business_profile(db, business_id)
    if not business:
        return None

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(business, field, value)

    await db.commit()
    await db.refresh(business)
    return business


async def delete_business_profile(db: AsyncSession, business_id: int) -> bool:
    business = await get_business_profile(db, business_id)
    if not business:
        return False
    await db.delete(business)
    await db.commit()
    return True


# ==============================================================================
# Financial Profile CRUD
# ==============================================================================

async def create_financial_profile(
    db: AsyncSession, entrepreneur_id: int, payload: FinancialProfileCreate
) -> FinancialProfile:
    fin_data = payload.model_dump()
    fin_data["entrepreneur_id"] = entrepreneur_id
    financial = FinancialProfile(**fin_data)
    db.add(financial)
    await db.commit()
    await db.refresh(financial)
    return financial


async def get_financial_profile(db: AsyncSession, financial_id: int) -> Optional[FinancialProfile]:
    query = select(FinancialProfile).where(FinancialProfile.id == financial_id)
    result = await db.execute(query)
    return result.scalar_one_or_none()


async def get_financial_profiles_by_entrepreneur(
    db: AsyncSession, entrepreneur_id: int
) -> List[FinancialProfile]:
    query = (
        select(FinancialProfile)
        .where(FinancialProfile.entrepreneur_id == entrepreneur_id)
        .order_by(FinancialProfile.id.desc())
    )
    result = await db.execute(query)
    return list(result.scalars().all())


async def update_financial_profile(
    db: AsyncSession, financial_id: int, payload: FinancialProfileUpdate
) -> Optional[FinancialProfile]:
    financial = await get_financial_profile(db, financial_id)
    if not financial:
        return None

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(financial, field, value)

    await db.commit()
    await db.refresh(financial)
    return financial


async def delete_financial_profile(db: AsyncSession, financial_id: int) -> bool:
    financial = await get_financial_profile(db, financial_id)
    if not financial:
        return False
    await db.delete(financial)
    await db.commit()
    return True


# ==============================================================================
# Unified Profile Methods
# ==============================================================================

async def create_unified_profile(
    db: AsyncSession, payload: UnifiedProfileCreate
) -> UnifiedProfileResponse:
    """
    Creates an entrepreneur, business profile (if provided), and financial profile (if provided)
    in a single database transaction, returning the aggregated profile and completeness.
    """
    entrepreneur = await create_entrepreneur(db, payload.entrepreneur)
    
    created_business: Optional[BusinessProfile] = None
    if payload.business:
        created_business = await create_business_profile(db, entrepreneur.id, payload.business)

    created_financial: Optional[FinancialProfile] = None
    if payload.financial:
        fin_create = payload.financial
        if created_business and fin_create.business_profile_id is None:
            fin_create.business_profile_id = created_business.id
        created_financial = await create_financial_profile(db, entrepreneur.id, fin_create)

    # Explicitly query child profiles to guarantee fresh session data
    business_profiles = await get_business_profiles_by_entrepreneur(db, entrepreneur.id)
    financial_profiles = await get_financial_profiles_by_entrepreneur(db, entrepreneur.id)

    primary_business = business_profiles[0] if business_profiles else None
    primary_financial = financial_profiles[0] if financial_profiles else None
    completeness = evaluate_profile_completeness(entrepreneur, primary_business, primary_financial)

    return UnifiedProfileResponse(
        entrepreneur=EntrepreneurResponse.model_validate(entrepreneur),
        business_profiles=[BusinessProfileResponse.model_validate(b) for b in business_profiles],
        financial_profiles=[FinancialProfileResponse.model_validate(f) for f in financial_profiles],
        completeness=completeness,
    )


async def get_unified_profile(
    db: AsyncSession, entrepreneur_id: int
) -> Optional[UnifiedProfileResponse]:
    """
    Fetches the full entrepreneur record with associated business and financial profiles,
    and dynamically calculates completeness.
    """
    entrepreneur = await get_entrepreneur(db, entrepreneur_id)
    if not entrepreneur:
        return None

    business_profiles = await get_business_profiles_by_entrepreneur(db, entrepreneur.id)
    financial_profiles = await get_financial_profiles_by_entrepreneur(db, entrepreneur.id)

    primary_business = business_profiles[0] if business_profiles else None
    primary_financial = financial_profiles[0] if financial_profiles else None
    completeness = evaluate_profile_completeness(entrepreneur, primary_business, primary_financial)

    return UnifiedProfileResponse(
        entrepreneur=EntrepreneurResponse.model_validate(entrepreneur),
        business_profiles=[BusinessProfileResponse.model_validate(b) for b in business_profiles],
        financial_profiles=[FinancialProfileResponse.model_validate(f) for f in financial_profiles],
        completeness=completeness,
    )
