"""
VittMitra Scheme Knowledge Seeding & Validation Script

Loads, validates, and populates authoritative government scheme seed datasets
into the PostgreSQL database.
"""
import sys
import json
import asyncio
from pathlib import Path
from typing import List

# Add backend directory to sys.path
root_dir = Path(__file__).resolve().parent.parent
backend_dir = root_dir / "backend"
sys.path.insert(0, str(backend_dir))

from pydantic import ValidationError
from sqlalchemy import select
from app.core.config import settings
from app.db.session import async_session_factory, async_engine
from app.models.scheme import Scheme, SchemeSource, SchemeEligibilityRule, SchemeDocument
from app.schemas.scheme import SchemeSeedPayload

SEEDS_DIR = root_dir / "data" / "seed" / "schemes"

def load_and_validate_seed_files() -> List[SchemeSeedPayload]:
    """Reads and validates all JSON files in data/seed/schemes/ using Pydantic."""
    if not SEEDS_DIR.is_dir():
        print(f"[ERROR] Seeds directory not found at: {SEEDS_DIR}")
        return []

    validated_schemes: List[SchemeSeedPayload] = []
    json_files = list(SEEDS_DIR.glob("*.json"))

    if not json_files:
        print(f"[WARNING] No seed JSON files found in {SEEDS_DIR}")
        return []

    print(f"\n[INFO] Validating {len(json_files)} scheme seed files against schema...")

    for f in json_files:
        try:
            with open(f, "r", encoding="utf-8") as fp:
                data = json.load(fp)
            
            payload = SchemeSeedPayload.model_validate(data)
            validated_schemes.append(payload)
            print(f"  [VALID] {payload.scheme_code}: {payload.scheme_name} ({len(payload.sources)} sources, {len(payload.eligibility_rules)} rules, {len(payload.documents)} documents)")
        except ValidationError as ve:
            print(f"  [ERROR] Validation failed for {f.name}: {ve}")
            raise
        except Exception as ex:
            print(f"  [ERROR] Failed to read {f.name}: {ex}")
            raise

    return validated_schemes

async def seed_database(schemes: List[SchemeSeedPayload]):
    """Persists validated schemes into the PostgreSQL database."""
    print("\n[INFO] Connecting to database to seed scheme records...")
    async with async_session_factory() as session:
        for item in schemes:
            # Check if scheme already exists
            query = select(Scheme).where(Scheme.scheme_code == item.scheme_code)
            res = await session.execute(query)
            existing_scheme = res.scalar_one_or_none()

            if existing_scheme:
                print(f"[INFO] Updating existing scheme: {item.scheme_code}")
                existing_scheme.scheme_name = item.scheme_name
                existing_scheme.short_description = item.short_description
                existing_scheme.nodal_ministry = item.nodal_ministry
                existing_scheme.nodal_department = item.nodal_department
                existing_scheme.geography_level = item.geography_level
                existing_scheme.target_beneficiaries = item.target_beneficiaries
                existing_scheme.purpose = item.purpose
                existing_scheme.benefits_summary = item.benefits_summary
                existing_scheme.business_stages = item.business_stages
                existing_scheme.sectors = item.sectors
                existing_scheme.data_status = item.data_status
                existing_scheme.is_active = item.is_active

                # Clear existing child items to replace with fresh verified data
                existing_scheme.sources.clear()
                existing_scheme.eligibility_rules.clear()
                existing_scheme.documents.clear()
                db_scheme = existing_scheme
            else:
                print(f"[INFO] Inserting new scheme: {item.scheme_code}")
                db_scheme = Scheme(
                    scheme_code=item.scheme_code,
                    scheme_name=item.scheme_name,
                    short_description=item.short_description,
                    nodal_ministry=item.nodal_ministry,
                    nodal_department=item.nodal_department,
                    geography_level=item.geography_level,
                    target_beneficiaries=item.target_beneficiaries,
                    purpose=item.purpose,
                    benefits_summary=item.benefits_summary,
                    business_stages=item.business_stages,
                    sectors=item.sectors,
                    data_status=item.data_status,
                    is_active=item.is_active,
                )
                session.add(db_scheme)

            # Add sources
            for s in item.sources:
                db_source = SchemeSource(
                    source_name=s.source_name,
                    source_type=s.source_type,
                    official_url=s.official_url,
                    document_reference=s.document_reference,
                    publication_date=s.publication_date,
                    last_verified_at=s.last_verified_at,
                    version=s.version,
                    notes=s.notes,
                    is_active=s.is_active
                )
                db_scheme.sources.append(db_source)

            # Add eligibility rules
            for r in item.eligibility_rules:
                db_rule = SchemeEligibilityRule(
                    rule_code=r.rule_code,
                    field_name=r.field_name,
                    operator=r.operator,
                    expected_value=r.expected_value,
                    description=r.description,
                    rule_version=r.rule_version,
                    is_active=r.is_active
                )
                db_scheme.eligibility_rules.append(db_rule)

            # Add documents
            for d in item.documents:
                db_doc = SchemeDocument(
                    document_code=d.document_code,
                    document_name=d.document_name,
                    description=d.description,
                    is_mandatory=d.is_mandatory
                )
                db_scheme.documents.append(db_doc)

        await session.commit()
        print("[SUCCESS] All verified schemes seeded successfully into PostgreSQL.")

async def main():
    schemes = load_and_validate_seed_files()
    if not schemes:
        print("[ERROR] No valid schemes to seed.")
        sys.exit(1)

    print(f"\n[SUMMARY] Successfully validated {len(schemes)} authoritative government schemes.")

    # Attempt database insertion if database connection is online
    try:
        await seed_database(schemes)
    except Exception as e:
        print(f"[NOTE] Database connection unavailable during local offline check: {e}")
        print("[INFO] Seed data files are verified and ready for live container deployment.")

if __name__ == "__main__":
    asyncio.run(main())
