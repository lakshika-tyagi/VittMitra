"""
Deterministic Business Feasibility Engine

Synthesizes multi-dimensional signals into an explainable, decision-support feasibility evaluation.
Computes overall status (FAVOURABLE, CAUTION, HIGH_RISK, INSUFFICIENT_DATA), positive drivers,
risk signals, missing information, and actionable next-step recommendations.
"""
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from decimal import Decimal

from app.schemas.feasibility import (
    SignalCategory,
    DataConfidenceStatus,
    FeasibilityOutcome,
    BusinessSignal,
    FeasibilityInputContext,
    FeasibilityAnalysisResponse,
)
from app.services.feasibility.signals import SignalGenerator


class FeasibilityEngine:
    """Core evaluation engine for business and location feasibility."""

    @classmethod
    def evaluate_feasibility(
        cls,
        context: FeasibilityInputContext,
        district_ecosystem: Optional[Any] = None,
        nearby_clusters: Optional[List[Any]] = None,
    ) -> FeasibilityAnalysisResponse:
        """
        Executes end-to-end feasibility analysis over structured inputs.
        Zero AI / LLM participation; 100% deterministic rules and metrics.
        """
        all_signals: List[BusinessSignal] = []

        # 1. Generate Signals
        loc_signals = SignalGenerator.generate_location_signals(
            context=context,
            district_ecosystem=district_ecosystem,
            nearby_clusters=nearby_clusters,
        )
        sec_signals = SignalGenerator.generate_sector_signals(context=context)
        stg_signals = SignalGenerator.generate_stage_signals(context=context)
        fin_signals = SignalGenerator.generate_financial_signals(context=context)
        risk_signals = SignalGenerator.generate_risk_signals(context=context)
        comp_signals, missing_fields = SignalGenerator.generate_completeness_signals(context=context)

        all_signals.extend(loc_signals)
        all_signals.extend(sec_signals)
        all_signals.extend(stg_signals)
        all_signals.extend(fin_signals)
        all_signals.extend(risk_signals)
        all_signals.extend(comp_signals)

        # 2. Extract Positive & Risk Signals Text
        positive_texts: List[str] = [s.explanation for s in all_signals if s.is_positive]
        risk_texts: List[str] = [s.explanation for s in all_signals if not s.is_positive]

        # 3. Determine Overall Feasibility Status
        has_default = context.is_defaulter is True
        has_severe_dti = any(s.signal_code == "FIN_DTI_HIGH_RISK" for s in all_signals)
        has_critical_missing = len(missing_fields) >= 3

        if has_default or has_severe_dti:
            overall_status = FeasibilityOutcome.HIGH_RISK
            headline = "High Feasibility Risk Detected"
            summary_notes = (
                "Critical risk flags identified (past credit default or severe debt burden relative to income). "
                "Immediate debt restructuring, NOC clearance, or equity infusion is required before institutional credit applications."
            )
        elif has_critical_missing or (not context.sector and not context.project_cost):
            overall_status = FeasibilityOutcome.INSUFFICIENT_DATA
            headline = "Insufficient Data for Feasibility Assessment"
            summary_notes = (
                "Baseline enterprise information is incomplete. Please provide business sector, location, "
                "and estimated project cost to generate a reliable feasibility evaluation."
            )
        elif len(risk_texts) > 0 or len(missing_fields) > 0 or any(s.signal_code in ["FIN_LOW_EQUITY_RISK", "STAGE_IDEA_CAUTION", "LOC_NO_DISTRICT_PROFILE"] for s in all_signals):
            overall_status = FeasibilityOutcome.CAUTION
            headline = "Feasible with Specific Cautionary Factors"
            summary_notes = (
                "The business activity has promising alignment, but specific parameters (such as low promoter equity, "
                "pre-inception stage, or unverified localized supply chains) warrant proactive mitigation."
            )
        else:
            overall_status = FeasibilityOutcome.FAVOURABLE
            headline = "Favourable Business & Location Feasibility"
            summary_notes = (
                "Strong multi-dimensional alignment observed across geographic ecosystem, sector demand, "
                "promoter equity contribution, and manageable debt coverage."
            )

        # 4. Generate Actionable Next-Step Recommendations
        recommendations: List[str] = []
        if context.sector and context.district:
            recommendations.append(
                f"Engage with District Industries Centre (DIC) in {context.district} for local MSME cluster linkage and PMEGP subsidy application."
            )
        if context.project_cost and context.project_cost > 0:
            recommendations.append(
                "Prepare formal supplier quotations for plant machinery and raw materials to support loan documentation."
            )
        if any(s.signal_code in ["FIN_LOW_EQUITY_RISK", "FIN_MODERATE_EQUITY"] for s in all_signals):
            recommendations.append(
                "Consider increasing promoter equity contribution to 15–20% to minimize monthly EMI obligation and improve bank appraisal."
            )
        if context.business_stage == "idea":
            recommendations.append(
                "Draft a structured Detailed Project Report (DPR) establishing unit economics, monthly operating costs, and breakeven volume."
            )
        if not context.monthly_income:
            recommendations.append(
                "Record baseline household/business monthly cash flows to verify debt-service coverage before applying."
            )
        recommendations.append(
            "Explore matched central government credit subsidy schemes (e.g. PMEGP, Mudra, PM Vishwakarma) in the Schemes Discovery module."
        )

        # 5. Build Profile Summary Context
        profile_summary = {
            "business_name": context.business_name or "Proposed Enterprise",
            "sector": context.sector or "Unspecified",
            "sub_sector": context.sub_sector or "N/A",
            "business_stage": context.business_stage or "Unspecified",
            "location": f"{context.district or 'District N/A'}, {context.state or 'State N/A'}",
            "area_type": context.area_type or "N/A",
            "project_cost": float(context.project_cost) if context.project_cost else None,
            "own_contribution": float(context.own_contribution) if context.own_contribution else None,
            "loan_requirement": float(context.loan_requirement) if context.loan_requirement else None,
        }

        return FeasibilityAnalysisResponse(
            overall_status=overall_status,
            headline=headline,
            summary_notes=summary_notes,
            evaluated_at=datetime.now(timezone.utc),
            profile_summary=profile_summary,
            signals=all_signals,
            positive_signals=positive_texts,
            risk_signals=risk_texts,
            missing_information=missing_fields,
            recommendations=recommendations,
        )
