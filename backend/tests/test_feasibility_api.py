"""
Integration Tests for Business & Location Feasibility API Endpoints (Step 9)
"""
import pytest
from decimal import Decimal
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker

from sqlalchemy import event
from app.main import app
from app.db.session import get_db
from app.models.profile import Entrepreneur, BusinessProfile, FinancialProfile
from app.models.intelligence import DistrictMSMEEcosystem, MSMECluster
from app.schemas.feasibility import FeasibilityOutcome


@pytest.fixture
def in_memory_db():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False)

    @event.listens_for(engine.sync_engine, "connect")
    def register_sqlite_functions(dbapi_connection, connection_record):
        dbapi_connection.create_function("RecoverGeometryColumn", 5, lambda a, b, c, d, e: 1)
        dbapi_connection.create_function("InitSpatialMetaData", 0, lambda: 1)
        dbapi_connection.create_function("InitSpatialMetaData", 1, lambda a: 1)
        dbapi_connection.create_function("DiscardGeometryColumn", 2, lambda a, b: 1)
        dbapi_connection.create_function("AddGeometryColumn", 5, lambda a, b, c, d, e: 1)
        dbapi_connection.create_function("AddGeometryColumn", 6, lambda a, b, c, d, e, f: 1)
        dbapi_connection.create_function("CreateSpatialIndex", 2, lambda a, b: 1)
        dbapi_connection.create_function("DisableSpatialIndex", 2, lambda a, b: 1)
        dbapi_connection.create_function("CheckSpatialIndex", 2, lambda a, b: 1)
        dbapi_connection.create_function("GeomFromEWKT", 1, lambda a: a)
        dbapi_connection.create_function("ST_GeomFromEWKT", 1, lambda a: a)
        dbapi_connection.create_function("AsEWKB", 1, lambda a: a)
        dbapi_connection.create_function("AsBinary", 1, lambda a: a)
        dbapi_connection.create_function("ST_AsBinary", 1, lambda a: a)

    session_factory = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)
    return engine, session_factory


@pytest.fixture
def client_with_mock_db(in_memory_db):
    engine, session_factory = in_memory_db

    async def override_get_db():
        async with session_factory() as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db
    client = TestClient(app)
    yield client, session_factory, engine
    app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_feasibility_analyze_payload_api(client_with_mock_db):
    client, session_factory, engine = client_with_mock_db

    tables = [
        Entrepreneur.__table__, BusinessProfile.__table__, FinancialProfile.__table__,
        DistrictMSMEEcosystem.__table__, MSMECluster.__table__
    ]
    async with engine.begin() as conn:
        for t in tables:
            await conn.run_sync(t.create)

    # Seed a district ecosystem and cluster in mock DB
    async with session_factory() as session:
        district_pune = DistrictMSMEEcosystem(
            id=1,
            state="Maharashtra",
            district="Pune",
            prominent_sectors=["manufacturing", "services", "agro_allied"],
            industrial_areas_count=14,
            raw_material_availability="HIGH",
            market_connectivity="HIGH",
            data_status="VERIFIED",
            source_name="Ministry of MSME",
        )
        cluster_pune = MSMECluster(
            id=1,
            cluster_code="PUNE_FOOD",
            cluster_name="Pune Food Processing Cluster",
            state="Maharashtra",
            district="Pune",
            sector="manufacturing",
            sub_sector="food_processing",
            specialization="Fruit and spice processing",
            key_products=["Spices", "Snacks"],
            common_facility_centers=["Testing Lab"],
            latitude=18.5204,
            longitude=73.8567,
            raw_material_access="HIGH",
            market_linkage="HIGH",
            data_status="VERIFIED",
            source_name="Ministry of MSME MSE-CDP",
        )
        session.add(district_pune)
        session.add(cluster_pune)
        await session.commit()

    # 1. Test POST /api/v1/feasibility/analyze with standalone payload
    payload = {
        "context": {
            "business_name": "Priya Spice Mill",
            "sector": "manufacturing",
            "sub_sector": "food_processing",
            "business_stage": "new_enterprise",
            "state": "Maharashtra",
            "district": "Pune",
            "latitude": 18.5204,
            "longitude": 73.8567,
            "project_cost": 1500000,
            "own_contribution": 300000,
            "loan_requirement": 1200000,
            "monthly_income": 75000,
            "is_defaulter": False
        }
    }
    resp = client.post("/api/v1/feasibility/analyze", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["overall_status"] == FeasibilityOutcome.FAVOURABLE.value
    assert len(data["signals"]) >= 4
    assert len(data["positive_signals"]) > 0
    assert len(data["recommendations"]) > 0
    assert "disclaimer" in data

    # 2. Test root shortcut POST /feasibility/analyze
    resp_shortcut = client.post("/feasibility/analyze", json=payload)
    assert resp_shortcut.status_code == 200
    assert resp_shortcut.json()["overall_status"] == FeasibilityOutcome.FAVOURABLE.value


@pytest.mark.asyncio
async def test_get_profile_feasibility_api(client_with_mock_db):
    client, session_factory, engine = client_with_mock_db

    tables = [
        Entrepreneur.__table__, BusinessProfile.__table__, FinancialProfile.__table__,
        DistrictMSMEEcosystem.__table__, MSMECluster.__table__
    ]
    async with engine.begin() as conn:
        for t in tables:
            await conn.run_sync(t.create)

    # Seed district
    async with session_factory() as session:
        session.add(DistrictMSMEEcosystem(
            id=1,
            state="Maharashtra",
            district="Pune",
            prominent_sectors=["manufacturing"],
            industrial_areas_count=10,
            raw_material_availability="HIGH",
            market_connectivity="HIGH",
            data_status="VERIFIED",
            source_name="Ministry of MSME",
        ))
        await session.commit()

    # Create profile via API
    profile_payload = {
        "entrepreneur": {
            "full_name": "Rohan Deshmukh",
            "age": 30,
            "gender": "male",
            "category": "General",
            "state": "Maharashtra",
            "district": "Pune",
            "area_type": "urban"
        },
        "business": {
            "business_name": "Deshmukh Precision Tools",
            "sector": "manufacturing",
            "business_stage": "new_enterprise",
            "is_greenfield": True,
            "is_defaulter": False
        },
        "financial": {
            "project_cost": 2000000,
            "own_contribution": 400000,
            "loan_requirement": 1600000,
            "monthly_income": 90000
        }
    }
    create_resp = client.post("/api/v1/profiles", json=profile_payload)
    assert create_resp.status_code == 201
    profile_id = create_resp.json()["entrepreneur"]["id"]

    # Test GET /api/v1/profiles/{profile_id}/feasibility
    resp_feas = client.get(f"/api/v1/profiles/{profile_id}/feasibility")
    assert resp_feas.status_code == 200
    feas_data = resp_feas.json()
    assert feas_data["overall_status"] in [FeasibilityOutcome.FAVOURABLE.value, FeasibilityOutcome.CAUTION.value]
    assert len(feas_data["signals"]) > 0
    assert feas_data["profile_summary"]["business_name"] == "Deshmukh Precision Tools"
    assert feas_data["profile_summary"]["project_cost"] == 2000000.0


@pytest.mark.asyncio
async def test_locations_intelligence_and_nearby_clusters_api(client_with_mock_db):
    client, session_factory, engine = client_with_mock_db

    tables = [
        DistrictMSMEEcosystem.__table__, MSMECluster.__table__
    ]
    async with engine.begin() as conn:
        for t in tables:
            await conn.run_sync(t.create)

    async with session_factory() as session:
        session.add(DistrictMSMEEcosystem(
            id=1,
            state="Maharashtra",
            district="Pune",
            prominent_sectors=["manufacturing", "services"],
            industrial_areas_count=14,
            lead_bank_name="Bank of Maharashtra",
            raw_material_availability="HIGH",
            market_connectivity="HIGH",
            power_infrastructure="HIGH",
            labor_availability="HIGH",
            data_status="VERIFIED",
            source_name="Ministry of MSME",
        ))
        session.add(MSMECluster(
            id=1,
            cluster_code="PUNE_AUTO",
            cluster_name="Pune Auto Cluster",
            state="Maharashtra",
            district="Pune",
            sector="manufacturing",
            sub_sector="engineering",
            specialization="Auto parts",
            key_products=["Components"],
            common_facility_centers=["Tool Room"],
            latitude=18.6298,
            longitude=73.7997,
            raw_material_access="HIGH",
            market_linkage="HIGH",
            data_status="VERIFIED",
            source_name="MSE-CDP",
        ))
        await session.commit()

    # 1. Test GET /api/v1/locations/intelligence
    res_loc = client.get("/api/v1/locations/intelligence?state=Maharashtra&district=Pune")
    assert res_loc.status_code == 200
    loc_list = res_loc.json()
    assert len(loc_list) == 1
    assert loc_list[0]["district"] == "Pune"
    assert "manufacturing" in loc_list[0]["prominent_sectors"]

    # 2. Test GET /api/v1/locations/nearby-clusters
    res_clusters = client.get("/api/v1/locations/nearby-clusters?latitude=18.5204&longitude=73.8567&radius_km=30")
    assert res_clusters.status_code == 200
    cluster_list = res_clusters.json()
    assert len(cluster_list) == 1
    assert cluster_list[0]["cluster_code"] == "PUNE_AUTO"
    assert cluster_list[0]["distance_km"] is not None
    assert cluster_list[0]["distance_km"] <= 30.0
