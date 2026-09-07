"""
Deterministic Business & Location Signal Generator

Evaluates structured profile and location attributes across 6 transparent dimensions:
1. Location & Spatial Cluster Proximity
2. Sector & Sub-sector Compatibility
3. Business Stage & Maturity Readiness
4. Financial Feasibility & Equity Structure (Reusing Step 5 Engine)
5. Data Completeness & Critical Gaps
6. Risk Flags & Constraints
"""
from typing import List, Optional, Dict, Any, Tuple
from decimal import Decimal
from math import radians, cos, sin, asin, sqrt

from app.schemas.feasibility import (
    SignalCategory,
    DataConfidenceStatus,
    BusinessSignal,
    FeasibilityInputContext,
)
from app.services.finance.engine import FinancialEngine
from app.schemas.finance import FinancialCalculationRequest


def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculates great-circle distance between two spatial points in kilometers."""
    r = 6371.0 # Earth's radius in km
    dlat = radians(lat2 - lat1)
    dlon = radians(lon2 - lon1)
    a = sin(dlat / 2)**2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon / 2)**2
    c = 2 * asin(sqrt(a))
    return round(r * c, 2)


class SignalGenerator:
    """Generates explainable, deterministic signals from business, location, and financial context."""

    @staticmethod
    def generate_location_signals(
        context: FeasibilityInputContext,
        district_ecosystem: Optional[Any] = None,
        nearby_clusters: Optional[List[Any]] = None,
    ) -> List[BusinessSignal]:
        signals: List[BusinessSignal] = []

        # 1. Basic District & State Check
        if not context.state or not context.district:
            signals.append(
                BusinessSignal(
                    signal_type=SignalCategory.LOCATION_SIGNAL,
                    signal_code="LOC_MISSING_DISTRICT",
                    title="Location Incomplete",
                    status=DataConfidenceStatus.INSUFFICIENT_DATA,
                    is_positive=False,
                    interpretation="Geographic location (State & District) is not specified.",
                    explanation="Without district details, local MSME ecosystem strengths, industrial clusters, and DIC support cannot be evaluated.",
                    source_name="VittMitra Location Engine",
                )
            )
            return signals

        # 2. District Ecosystem Match
        if district_ecosystem:
            prominent = district_ecosystem.prominent_sectors or []
            sector_matches = context.sector and (context.sector.lower() in [s.lower() for s in prominent])
            
            raw_mat = getattr(district_ecosystem, "raw_material_availability", "INSUFFICIENT_DATA")
            mkt_conn = getattr(district_ecosystem, "market_connectivity", "INSUFFICIENT_DATA")
            dic_addr = getattr(district_ecosystem, "dic_office_address", None)

            if sector_matches:
                signals.append(
                    BusinessSignal(
                        signal_type=SignalCategory.LOCATION_SIGNAL,
                        signal_code="LOC_DISTRICT_SECTOR_ALIGNED",
                        title=f"Established MSME Hub in {context.district}",
                        status=DataConfidenceStatus.VERIFIED,
                        is_positive=True,
                        interpretation=f"{context.district} has an established ecosystem for '{context.sector}'.",
                        explanation=f"Official district industrial data confirms '{context.sector}' as a prominent sector with {district_ecosystem.industrial_areas_count} active industrial areas and {raw_mat.lower()} raw material availability.",
                        source_name=district_ecosystem.source_name,
                        source_url=district_ecosystem.source_url,
                        raw_metric={
                            "district": context.district,
                            "state": context.state,
                            "industrial_areas_count": district_ecosystem.industrial_areas_count,
                            "lead_bank": district_ecosystem.lead_bank_name,
                            "raw_material_availability": raw_mat,
                            "market_connectivity": mkt_conn,
                        }
                    )
                )
            else:
                signals.append(
                    BusinessSignal(
                        signal_type=SignalCategory.LOCATION_SIGNAL,
                        signal_code="LOC_DISTRICT_REGISTERED",
                        title=f"District Infrastructure in {context.district}",
                        status=DataConfidenceStatus.VERIFIED,
                        is_positive=True,
                        interpretation=f"Industrial infrastructure and DIC presence registered in {context.district}.",
                        explanation=f"{context.district} has {district_ecosystem.industrial_areas_count} industrial zones, {mkt_conn.lower()} market connectivity, and dedicated DIC office ({dic_addr or 'Shivajinagar'}).",
                        source_name=district_ecosystem.source_name,
                        source_url=district_ecosystem.source_url,
                    )
                )
        else:
            signals.append(
                BusinessSignal(
                    signal_type=SignalCategory.LOCATION_SIGNAL,
                    signal_code="LOC_NO_DISTRICT_PROFILE",
                    title="District Profile Limited",
                    status=DataConfidenceStatus.INSUFFICIENT_DATA,
                    is_positive=False,
                    interpretation=f"Granular industrial cluster profile not yet verified for {context.district}, {context.state}.",
                    explanation=f"Baseline state jurisdiction verified, but localized supply chain data is currently unavailable. Entrepreneur should independently inspect local industrial premises.",
                    source_name="Ministry of MSME Open Data",
                )
            )

        # 3. Spatial Cluster Proximity (PostGIS / Coordinates)
        if nearby_clusters and len(nearby_clusters) > 0:
            top_cluster = nearby_clusters[0]
            dist_km = getattr(top_cluster, "distance_km", None)
            
            cluster_name = getattr(top_cluster, "cluster_name", "Nearby Industrial Cluster")
            cluster_sec = getattr(top_cluster, "sector", "")
            cfcs = getattr(top_cluster, "common_facility_centers", []) or []

            is_sector_match = context.sector and (context.sector.lower() == cluster_sec.lower())
            
            if dist_km is not None and dist_km <= 50.0:
                signals.append(
                    BusinessSignal(
                        signal_type=SignalCategory.LOCATION_SIGNAL,
                        signal_code="LOC_CLUSTER_PROXIMITY",
                        title=f"Proximity to {cluster_name}",
                        status=DataConfidenceStatus.VERIFIED,
                        is_positive=True,
                        interpretation=f"Located within {dist_km:.1f} km of an active MSME cluster.",
                        explanation=f"Proximity to {cluster_name} ({dist_km:.1f} km away) offers access to common facility centers ({', '.join(cfcs) if cfcs else 'Testing / Packaging'}) and localized raw material suppliers.",
                        source_name=getattr(top_cluster, "source_name", "MSE-CDP"),
                        source_url=getattr(top_cluster, "source_url", None),
                        raw_metric={"cluster_code": getattr(top_cluster, "cluster_code", ""), "distance_km": dist_km}
                    )
                )

        return signals

    @staticmethod
    def generate_sector_signals(context: FeasibilityInputContext) -> List[BusinessSignal]:
        signals: List[BusinessSignal] = []

        if not context.sector:
            signals.append(
                BusinessSignal(
                    signal_type=SignalCategory.SECTOR_SIGNAL,
                    signal_code="SEC_MISSING",
                    title="Sector Not Specified",
                    status=DataConfidenceStatus.INSUFFICIENT_DATA,
                    is_positive=False,
                    interpretation="Business sector is missing.",
                    explanation="Specifying your sector (e.g. Manufacturing, Services, Trading, Handicrafts) is required to assess capital intensity, asset requirements, and scheme alignment.",
                    source_name="VittMitra Taxonomy",
                )
            )
            return signals

        sec = context.sector.lower()
        sub = (context.sub_sector or "").lower()

        if sec == "manufacturing":
            signals.append(
                BusinessSignal(
                    signal_type=SignalCategory.SECTOR_SIGNAL,
                    signal_code="SEC_MANUFACTURING_CONTEXT",
                    title="Manufacturing & Value-Addition Sector",
                    status=DataConfidenceStatus.VERIFIED,
                    is_positive=True,
                    interpretation="Eligible for high capital subsidy ceilings under PMEGP and Mudra.",
                    explanation=f"Manufacturing enterprises ({sub or 'general processing'}) qualify for up to ₹50 Lakhs project limit under PMEGP with 15–35% capital subsidy, requiring plant machinery and industrial power.",
                    source_name="Ministry of MSME Guidelines",
                )
            )
        elif sec == "services":
            signals.append(
                BusinessSignal(
                    signal_type=SignalCategory.SECTOR_SIGNAL,
                    signal_code="SEC_SERVICES_CONTEXT",
                    title="Services & Commercial Trade",
                    status=DataConfidenceStatus.VERIFIED,
                    is_positive=True,
                    interpretation="Lower fixed asset requirements and rapid cash cycle.",
                    explanation="Service enterprises typically require lower initial machinery setup (qualify up to ₹20 Lakhs under PMEGP) and depend primarily on footfall, digital connectivity, and working capital.",
                    source_name="Ministry of MSME Guidelines",
                )
            )
        elif sec in ["handicrafts", "artisans"]:
            signals.append(
                BusinessSignal(
                    signal_type=SignalCategory.SECTOR_SIGNAL,
                    signal_code="SEC_HANDICRAFTS_CONTEXT",
                    title="Traditional Crafts & Artisan Ecosystem",
                    status=DataConfidenceStatus.VERIFIED,
                    is_positive=True,
                    interpretation="Eligible for specialized 5% collateral-free credit under PM Vishwakarma.",
                    explanation="Artisanal and craft enterprises qualify for toolkit incentive grants (₹15,000) and concessional credit tranches with skill training stipends.",
                    source_name="Ministry of MSME - PM Vishwakarma Guidelines",
                )
            )
        elif sec == "agro_allied":
            signals.append(
                BusinessSignal(
                    signal_type=SignalCategory.SECTOR_SIGNAL,
                    signal_code="SEC_AGRO_CONTEXT",
                    title="Agro-Allied & Rural Micro-Enterprise",
                    status=DataConfidenceStatus.VERIFIED,
                    is_positive=True,
                    interpretation="Strong raw material availability in rural/semi-urban belts.",
                    explanation="Agro-allied value addition benefits from priority sector lending norms and higher rural subsidy percentages (up to 35%).",
                    source_name="NABARD & MSME Policy",
                )
            )
        else:
            signals.append(
                BusinessSignal(
                    signal_type=SignalCategory.SECTOR_SIGNAL,
                    signal_code="SEC_GENERAL_CONTEXT",
                    title=f"{context.sector.capitalize()} Sector",
                    status=DataConfidenceStatus.ESTIMATED,
                    is_positive=True,
                    interpretation=f"Standard commercial viability guidelines apply for {context.sector}.",
                    explanation="Standard micro-enterprise norms apply. Ensure clear product pricing and vendor margins.",
                    source_name="VittMitra Analysis Engine",
                )
            )

        return signals

    @staticmethod
    def generate_stage_signals(context: FeasibilityInputContext) -> List[BusinessSignal]:
        signals: List[BusinessSignal] = []

        if not context.business_stage:
            signals.append(
                BusinessSignal(
                    signal_type=SignalCategory.BUSINESS_STAGE_SIGNAL,
                    signal_code="STAGE_MISSING",
                    title="Business Stage Not Specified",
                    status=DataConfidenceStatus.INSUFFICIENT_DATA,
                    is_positive=False,
                    interpretation="Business maturity phase is missing.",
                    explanation="Specify whether your enterprise is at Idea, New Setup (Greenfield), or Expansion stage.",
                    source_name="VittMitra Baseline",
                )
            )
            return signals

        stg = context.business_stage.lower()

        if stg in ["new_enterprise", "greenfield"]:
            signals.append(
                BusinessSignal(
                    signal_type=SignalCategory.BUSINESS_STAGE_SIGNAL,
                    signal_code="STAGE_GREENFIELD_READY",
                    title="First-Time Greenfield Enterprise",
                    status=DataConfidenceStatus.VERIFIED,
                    is_positive=True,
                    interpretation="High eligibility across national entrepreneurship schemes.",
                    explanation="New greenfield units are the primary focus of PMEGP and Stand-Up India subsidies. Ensure formal quotation for machinery and lease/ownership agreement for premises.",
                    source_name="PMEGP & Stand-Up India Operational Rules",
                )
            )
        elif stg in ["expansion", "existing"]:
            vintage = context.existing_business_vintage_years
            vintage_text = f"with {vintage} years operating vintage" if vintage else "with existing operations"
            signals.append(
                BusinessSignal(
                    signal_type=SignalCategory.BUSINESS_STAGE_SIGNAL,
                    signal_code="STAGE_EXPANSION_READY",
                    title=f"Existing Enterprise Expansion ({vintage_text})",
                    status=DataConfidenceStatus.VERIFIED,
                    is_positive=True,
                    interpretation="Existing operational track record supports higher credit appraisal.",
                    explanation="Existing units qualify for MUDRA Tarun / Kishore loans and PMEGP 2nd-tier expansion subsidies (up to ₹1 Crore for manufacturing units maintaining profitability).",
                    source_name="Ministry of MSME 2nd Loan Scheme Guidelines",
                )
            )
        elif stg == "idea":
            signals.append(
                BusinessSignal(
                    signal_type=SignalCategory.BUSINESS_STAGE_SIGNAL,
                    signal_code="STAGE_IDEA_CAUTION",
                    title="Idea / Pre-Inception Phase",
                    status=DataConfidenceStatus.ESTIMATED,
                    is_positive=False,
                    interpretation="Requires detailed project report (DPR) and trade finalization.",
                    explanation="Idea-stage initiatives must establish specific itemized costs, equipment supplier quotes, and clear location before bank credit appraisal.",
                    source_name="SIDBI Project Feasibility Guidelines",
                )
            )

        return signals

    @staticmethod
    def generate_financial_signals(context: FeasibilityInputContext) -> List[BusinessSignal]:
        signals: List[BusinessSignal] = []

        cost = context.project_cost
        own = context.own_contribution or Decimal("0.00")
        loan = context.loan_requirement
        income = context.monthly_income

        if not cost or cost <= Decimal("0.00"):
            signals.append(
                BusinessSignal(
                    signal_type=SignalCategory.FINANCIAL_FEASIBILITY_SIGNAL,
                    signal_code="FIN_NO_PROJECT_COST",
                    title="Project Cost Not Specified",
                    status=DataConfidenceStatus.INSUFFICIENT_DATA,
                    is_positive=False,
                    interpretation="Estimated total project cost is missing.",
                    explanation="Financial feasibility requires total investment cost (machinery + working capital) to assess loan quantum and repayment capability.",
                    source_name="VittMitra Financial Engine",
                )
            )
            return signals

        # 1. Equity Contribution Ratio
        equity_pct = (own / cost) * Decimal("100.00")
        
        if equity_pct >= Decimal("15.00"):
            signals.append(
                BusinessSignal(
                    signal_type=SignalCategory.FINANCIAL_FEASIBILITY_SIGNAL,
                    signal_code="FIN_HEALTHY_EQUITY",
                    title=f"Strong Promoter Contribution ({equity_pct:.1f}%)",
                    status=DataConfidenceStatus.VERIFIED,
                    is_positive=True,
                    interpretation=f"Own contribution of ₹{own:,.2f} represents {equity_pct:.1f}% of project cost.",
                    explanation=f"A promoter equity stake of {equity_pct:.1f}% exceeds standard mandatory margin requirements (5–10% for special category, 10–15% for general), demonstrating financial commitment and reducing borrowing burden.",
                    source_name="Reserve Bank of India MSME Lending Norms",
                    raw_metric={"project_cost": float(cost), "own_contribution": float(own), "equity_pct": float(equity_pct)}
                )
            )
        elif equity_pct >= Decimal("5.00"):
            signals.append(
                BusinessSignal(
                    signal_type=SignalCategory.FINANCIAL_FEASIBILITY_SIGNAL,
                    signal_code="FIN_MODERATE_EQUITY",
                    title=f"Moderate Promoter Contribution ({equity_pct:.1f}%)",
                    status=DataConfidenceStatus.VERIFIED,
                    is_positive=True,
                    interpretation=f"Own contribution of ₹{own:,.2f} meets minimum margin norms.",
                    explanation=f"Contribution of {equity_pct:.1f}% meets base scheme threshold, but increasing equity towards 15–20% will lower monthly EMI debt obligations.",
                    source_name="PMEGP Margin Money Guidelines",
                    raw_metric={"project_cost": float(cost), "own_contribution": float(own), "equity_pct": float(equity_pct)}
                )
            )
        else:
            signals.append(
                BusinessSignal(
                    signal_type=SignalCategory.FINANCIAL_FEASIBILITY_SIGNAL,
                    signal_code="FIN_LOW_EQUITY_RISK",
                    title=f"Very Low Equity Contribution ({equity_pct:.1f}%)",
                    status=DataConfidenceStatus.VERIFIED,
                    is_positive=False,
                    interpretation=f"Own contribution of {equity_pct:.1f}% is below typical bank margin expectations.",
                    explanation="Most credit schemes require a minimum 5% (SC/ST/Women/OBC) or 10% (General) own contribution. Banks may hesitate to sanction 95%+ debt without promoter margin.",
                    source_name="MSME Credit Policy",
                    raw_metric={"project_cost": float(cost), "own_contribution": float(own), "equity_pct": float(equity_pct)}
                )
            )

        # 2. Step 5 Deterministic Repayment & Affordability Check
        effective_loan = loan if (loan and loan > 0) else (cost - own)
        if effective_loan > Decimal("0.00"):
            fin_req = FinancialCalculationRequest(
                project_cost=cost,
                own_contribution=own,
                loan_amount=effective_loan,
                annual_interest_rate=Decimal("10.00"),
                tenure_months=60,
                monthly_income=income,
            )
            fin_res = FinancialEngine.calculate_financial_structure(fin_req)
            emi = fin_res.loan.estimated_emi

            if income and income > Decimal("0.00"):
                dti = (emi / income) * Decimal("100.00")
                if dti <= Decimal("40.00"):
                    signals.append(
                        BusinessSignal(
                            signal_type=SignalCategory.FINANCIAL_FEASIBILITY_SIGNAL,
                            signal_code="FIN_DTI_HEALTHY",
                            title=f"Comfortable Debt Service Coverage (DTI {dti:.1f}%)",
                            status=DataConfidenceStatus.VERIFIED,
                            is_positive=True,
                            interpretation=f"Estimated EMI of ₹{emi:,.2f}/mo is {dti:.1f}% of reported monthly income.",
                            explanation=f"A debt-to-income ratio of {dti:.1f}% is within the healthy threshold (<= 40%), leaving sufficient operating liquidity for business inventory and household expenses.",
                            source_name="Banking Credit Appraisal Standard (Step 5 Engine)",
                            raw_metric={"estimated_emi": float(emi), "monthly_income": float(income), "dti_pct": float(dti)}
                        )
                    )
                elif dti <= Decimal("60.00"):
                    signals.append(
                        BusinessSignal(
                            signal_type=SignalCategory.FINANCIAL_FEASIBILITY_SIGNAL,
                            signal_code="FIN_DTI_MODERATE",
                            title=f"Moderate Debt Burden (DTI {dti:.1f}%)",
                            status=DataConfidenceStatus.VERIFIED,
                            is_positive=False,
                            interpretation=f"Estimated EMI of ₹{emi:,.2f}/mo accounts for {dti:.1f}% of income.",
                            explanation=f"Monthly EMI obligation of {dti:.1f}% is manageable with consistent sales, but leaves lower buffer for unforeseen business slumps. Consider choosing a 7-year tenure to ease cash flow.",
                            source_name="Banking Credit Appraisal Standard (Step 5 Engine)",
                            raw_metric={"estimated_emi": float(emi), "monthly_income": float(income), "dti_pct": float(dti)}
                        )
                    )
                else:
                    signals.append(
                        BusinessSignal(
                            signal_type=SignalCategory.FINANCIAL_FEASIBILITY_SIGNAL,
                            signal_code="FIN_DTI_HIGH_RISK",
                            title=f"High Debt Burden (DTI {dti:.1f}%)",
                            status=DataConfidenceStatus.VERIFIED,
                            is_positive=False,
                            interpretation=f"Estimated EMI of ₹{emi:,.2f}/mo exceeds 60% of current monthly income.",
                            explanation=f"At {dti:.1f}% DTI, loan repayment presents substantial cash flow risk unless enterprise revenue rapidly expands upon deployment. Recommend downsizing initial project scope or raising equity.",
                            source_name="Banking Credit Appraisal Standard (Step 5 Engine)",
                            raw_metric={"estimated_emi": float(emi), "monthly_income": float(income), "dti_pct": float(dti)}
                        )
                    )
            else:
                signals.append(
                    BusinessSignal(
                        signal_type=SignalCategory.FINANCIAL_FEASIBILITY_SIGNAL,
                        signal_code="FIN_INCOME_UNVERIFIED",
                        title="Cash Flow Affordability Unverified",
                        status=DataConfidenceStatus.INSUFFICIENT_DATA,
                        is_positive=False,
                        interpretation="Monthly income not provided; estimated EMI cannot be benchmarked against cash flow.",
                        explanation=f"For a loan of ₹{effective_loan:,.2f}, estimated monthly EMI is ₹{emi:,.2f} (5 years @ 10%). Providing monthly income will verify cash flow affordability.",
                        source_name="VittMitra Step 5 Engine",
                        raw_metric={"estimated_emi": float(emi), "loan_amount": float(effective_loan)}
                    )
                )

        return signals

    @staticmethod
    def generate_risk_signals(context: FeasibilityInputContext) -> List[BusinessSignal]:
        signals: List[BusinessSignal] = []

        # 1. Defaulter Flag
        if context.is_defaulter is True:
            signals.append(
                BusinessSignal(
                    signal_type=SignalCategory.RISK_SIGNAL,
                    signal_code="RISK_PAST_DEFAULT",
                    title="Past Credit Default Reported",
                    status=DataConfidenceStatus.VERIFIED,
                    is_positive=False,
                    interpretation="Reported past default will impede formal credit underwriting.",
                    explanation="Reported past credit default will impede formal credit underwriting. Institutional lenders and credit guarantee trust funds (CGTMSE / CGFMU) mandate a clean credit history. Past non-performing default accounts require settlement/NOC before fresh loan sanctions.",
                    source_name="Credit Information Bureau / RBI MSME Framework",
                )
            )

        # 2. Very High Financing Gap relative to Equity
        cost = context.project_cost or Decimal("0.00")
        own = context.own_contribution or Decimal("0.00")
        if cost > Decimal("2000000.00") and own < Decimal("100000.00"):
            signals.append(
                BusinessSignal(
                    signal_type=SignalCategory.RISK_SIGNAL,
                    signal_code="RISK_HIGH_LEVERAGE",
                    title="High Capital Leverage Risk",
                    status=DataConfidenceStatus.ESTIMATED,
                    is_positive=False,
                    interpretation="Large project investment scale with minimal promoter equity.",
                    explanation=f"Project cost of ₹{cost:,.2f} with under ₹1 Lakh own equity creates high financial vulnerability during initial pre-revenue gestation months.",
                    source_name="Financial Prudence Norms",
                )
            )

        return signals

    @staticmethod
    def generate_completeness_signals(context: FeasibilityInputContext) -> Tuple[List[BusinessSignal], List[str]]:
        signals: List[BusinessSignal] = []
        missing_fields: List[str] = []

        if not context.sector:
            missing_fields.append("Business Sector")
        if not context.business_stage:
            missing_fields.append("Business Stage")
        if not context.state or not context.district:
            missing_fields.append("Location (State & District)")
        if not context.project_cost or context.project_cost <= 0:
            missing_fields.append("Project Cost")
        if context.monthly_income is None or context.monthly_income <= 0:
            missing_fields.append("Monthly Income / Cash Flow")

        if len(missing_fields) == 0:
            signals.append(
                BusinessSignal(
                    signal_type=SignalCategory.DATA_COMPLETENESS_SIGNAL,
                    signal_code="COMPLETENESS_HIGH",
                    title="Profile Fully Specified",
                    status=DataConfidenceStatus.VERIFIED,
                    is_positive=True,
                    interpretation="All primary business, geographic, and financial parameters are available.",
                    explanation="Complete baseline allows a comprehensive, high-confidence multi-dimensional feasibility evaluation.",
                    source_name="VittMitra Baseline Validator",
                )
            )
        elif len(missing_fields) <= 2:
            signals.append(
                BusinessSignal(
                    signal_type=SignalCategory.DATA_COMPLETENESS_SIGNAL,
                    signal_code="COMPLETENESS_PARTIAL",
                    title="Partially Complete Profile",
                    status=DataConfidenceStatus.UNVERIFIED,
                    is_positive=False,
                    interpretation=f"Missing {len(missing_fields)} key parameter(s): {', '.join(missing_fields)}.",
                    explanation="Providing the missing parameters will enhance the precision of the location and debt affordability analysis.",
                    source_name="VittMitra Baseline Validator",
                )
            )
        else:
            signals.append(
                BusinessSignal(
                    signal_type=SignalCategory.DATA_COMPLETENESS_SIGNAL,
                    signal_code="COMPLETENESS_LOW",
                    title="Baseline Profile Incomplete",
                    status=DataConfidenceStatus.INSUFFICIENT_DATA,
                    is_positive=False,
                    interpretation=f"Multiple critical parameters are missing: {', '.join(missing_fields)}.",
                    explanation="Complete these profile fields to unlock a thorough feasibility assessment.",
                    source_name="VittMitra Baseline Validator",
                )
            )

        return signals, missing_fields
