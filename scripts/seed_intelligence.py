"""
VittMitra Location & Business Intelligence Seeding Script

Loads, validates, and populates verified district MSME ecosystems and industrial clusters
into PostgreSQL with PostGIS spatial point geometries.
"""
import sys
import json
import asyncio
from pathlib import Path
from typing import List, Dict, Any

# Add backend directory to sys.path
root_dir = Path(__file__).resolve().parent.parent
backend_dir = root_dir / "backend"
sys.path.insert(0, str(backend_dir))

from sqlalchemy import select
from geoalchemy2.elements import WKTElement
from app.db.session import async_session_factory
from app.models.intelligence import DistrictMSMEEcosystem, MSMECluster

SEED_FILE = root_dir / "data" / "intelligence" / "clusters_seed.json"


async def seed_intelligence_data():
    """Reads clusters_seed.json and populates district ecosystems and MSME clusters."""
    if not SEED_FILE.is_file():
        print(f"[ERROR] Seed file not found at: {SEED_FILE}")
        return

    with open(SEED_FILE, "r", encoding="utf-8") as fp:
        seed_data = json.load(fp)

    districts = seed_data.get("district_ecosystems", [])
    clusters = seed_data.get("msme_clusters", [])

    print(f"\n[INFO] Seeding {len(districts)} district ecosystems and {len(clusters)} MSME clusters...")

    async with async_session_factory() as session:
        # Seed District Ecosystems
        for d in districts:
            query = select(DistrictMSMEEcosystem).where(
                DistrictMSMEEcosystem.state == d["state"],
                DistrictMSMEEcosystem.district == d["district"],
            )
            res = await session.execute(query)
            existing = res.scalars().first()

            lat = float(d["latitude"]) if d.get("latitude") is not None else None
            lng = float(d["longitude"]) if d.get("longitude") is not None else None
            loc_geom = WKTElement(f"POINT({lng} {lat})", srid=4326) if lat and lng else None

            if existing:
                existing.prominent_sectors = d["prominent_sectors"]
                existing.industrial_areas_count = d.get("industrial_areas_count", 0)
                existing.lead_bank_name = d.get("lead_bank_name")
                existing.dic_office_address = d.get("dic_office_address")
                existing.raw_material_availability = d.get("raw_material_availability", "INSUFFICIENT_DATA")
                existing.market_connectivity = d.get("market_connectivity", "INSUFFICIENT_DATA")
                existing.power_infrastructure = d.get("power_infrastructure", "INSUFFICIENT_DATA")
                existing.labor_availability = d.get("labor_availability", "INSUFFICIENT_DATA")
                existing.latitude = lat
                existing.longitude = lng
                existing.location = loc_geom
                existing.data_status = d.get("data_status", "VERIFIED")
                existing.source_name = d.get("source_name", "Ministry of MSME")
                existing.source_url = d.get("source_url")
                existing.is_active = d.get("is_active", True)
                print(f"  [UPDATED] District Ecosystem: {d['district']}, {d['state']}")
            else:
                new_district = DistrictMSMEEcosystem(
                    state=d["state"],
                    district=d["district"],
                    state_code=d.get("state_code"),
                    district_code=d.get("district_code"),
                    prominent_sectors=d["prominent_sectors"],
                    industrial_areas_count=d.get("industrial_areas_count", 0),
                    lead_bank_name=d.get("lead_bank_name"),
                    dic_office_address=d.get("dic_office_address"),
                    raw_material_availability=d.get("raw_material_availability", "INSUFFICIENT_DATA"),
                    market_connectivity=d.get("market_connectivity", "INSUFFICIENT_DATA"),
                    power_infrastructure=d.get("power_infrastructure", "INSUFFICIENT_DATA"),
                    labor_availability=d.get("labor_availability", "INSUFFICIENT_DATA"),
                    latitude=lat,
                    longitude=lng,
                    location=loc_geom,
                    data_status=d.get("data_status", "VERIFIED"),
                    source_name=d.get("source_name", "Ministry of MSME"),
                    source_url=d.get("source_url"),
                    is_active=d.get("is_active", True),
                )
                session.add(new_district)
                print(f"  [CREATED] District Ecosystem: {d['district']}, {d['state']}")

        # Seed MSME Clusters
        for c in clusters:
            query = select(MSMECluster).where(MSMECluster.cluster_code == c["cluster_code"])
            res = await session.execute(query)
            existing = res.scalars().first()

            lat = float(c["latitude"])
            lng = float(c["longitude"])
            loc_geom = WKTElement(f"POINT({lng} {lat})", srid=4326)

            if existing:
                existing.cluster_name = c["cluster_name"]
                existing.state = c["state"]
                existing.district = c["district"]
                existing.sector = c["sector"]
                existing.sub_sector = c.get("sub_sector")
                existing.specialization = c["specialization"]
                existing.key_products = c["key_products"]
                existing.common_facility_centers = c.get("common_facility_centers", [])
                existing.latitude = lat
                existing.longitude = lng
                existing.location = loc_geom
                existing.raw_material_access = c.get("raw_material_access", "HIGH")
                existing.market_linkage = c.get("market_linkage", "HIGH")
                existing.data_status = c.get("data_status", "VERIFIED")
                existing.source_name = c.get("source_name", "Ministry of MSME")
                existing.source_url = c.get("source_url")
                existing.is_active = c.get("is_active", True)
                print(f"  [UPDATED] MSME Cluster: {c['cluster_code']} ({c['cluster_name']})")
            else:
                new_cluster = MSMECluster(
                    cluster_code=c["cluster_code"],
                    cluster_name=c["cluster_name"],
                    state=c["state"],
                    district=c["district"],
                    sector=c["sector"],
                    sub_sector=c.get("sub_sector"),
                    specialization=c["specialization"],
                    key_products=c["key_products"],
                    common_facility_centers=c.get("common_facility_centers", []),
                    latitude=lat,
                    longitude=lng,
                    location=loc_geom,
                    raw_material_access=c.get("raw_material_access", "HIGH"),
                    market_linkage=c.get("market_linkage", "HIGH"),
                    data_status=c.get("data_status", "VERIFIED"),
                    source_name=c.get("source_name", "Ministry of MSME"),
                    source_url=c.get("source_url"),
                    is_active=c.get("is_active", True),
                )
                session.add(new_cluster)
                print(f"  [CREATED] MSME Cluster: {c['cluster_code']} ({c['cluster_name']})")

        await session.commit()
        print("\n[SUCCESS] Location & Business Intelligence seeding completed successfully.")


if __name__ == "__main__":
    asyncio.run(seed_intelligence_data())
