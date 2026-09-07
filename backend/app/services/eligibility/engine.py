"""
Deterministic Eligibility Engine Core Service

Evaluates entrepreneur profile inputs against authoritative scheme eligibility rules retrieved from
the database. Enforces strict three-state outcomes (MATCHED, FAILED, UNVERIFIED), source linking,
and deterministic explainability with ZERO AI / LLM involvement.
"""
from typing import Any, Dict, List, Optional, Union
from datetime import datetime, timezone
from app.models.scheme import Scheme, SchemeEligibilityRule, SchemeSource
from app.schemas.eligibility import (
    EligibilityStatus,
    CriterionResult,
    EligibilitySummary,
    EligibilityCheckResponse,
    EntrepreneurProfileInput,
)
from app.services.eligibility.operators import evaluate_operator, format_required_condition
from app.services.eligibility.resolver import resolve_field_value
from app.services.eligibility.explainer import generate_criterion_explanation


class EligibilityEngine:
    """
    Authoritative, deterministic, and explainable rule evaluation engine.
    """

    @classmethod
    def evaluate_rule(
        cls,
        rule: SchemeEligibilityRule,
        profile: Union[EntrepreneurProfileInput, Dict[str, Any]],
        sources_map: Optional[Dict[int, SchemeSource]] = None
    ) -> CriterionResult:
        """
        Evaluates a single active scheme rule against user profile inputs.
        """
        user_value = resolve_field_value(rule.field_name, profile)
        status, condition_str = evaluate_operator(
            operator=rule.operator,
            user_value=user_value,
            expected_value=rule.expected_value
        )

        explanation = generate_criterion_explanation(
            field_name=rule.field_name,
            operator=rule.operator,
            expected_value=rule.expected_value,
            user_value=user_value,
            status=status,
            rule_description=rule.description
        )

        # Resolve source information for strict auditability and traceability
        source_name: Optional[str] = None
        source_url: Optional[str] = None

        if hasattr(rule, "source") and rule.source is not None:
            source_name = rule.source.source_name
            source_url = rule.source.official_url
        elif sources_map and rule.source_id and rule.source_id in sources_map:
            src = sources_map[rule.source_id]
            source_name = src.source_name
            source_url = src.official_url

        is_mandatory = getattr(rule, "is_mandatory", True)

        return CriterionResult(
            rule_id=rule.id,
            rule_code=rule.rule_code,
            criterion=rule.field_name,
            status=status,
            user_value=user_value,
            required_condition=condition_str,
            explanation=explanation,
            is_mandatory=is_mandatory,
            source_id=rule.source_id,
            source_name=source_name,
            source_url=source_url,
            rule_version=rule.rule_version or "1.0",
        )

    @classmethod
    def evaluate_scheme(
        cls,
        scheme: Scheme,
        profile: Union[EntrepreneurProfileInput, Dict[str, Any]]
    ) -> EligibilityCheckResponse:
        """
        Evaluates all active rules belonging to a scheme against the entrepreneur profile.
        Aggregates criterion outcomes into a deterministic overall status.
        """
        # Map source records for quick lookup
        sources_map: Dict[int, SchemeSource] = {}
        if scheme.sources:
            for s in scheme.sources:
                if s.id is not None:
                    sources_map[s.id] = s

        # Filter active rules and preserve database ordering
        active_rules = [r for r in scheme.eligibility_rules if r.is_active]

        criteria: List[CriterionResult] = []
        for rule in active_rules:
            crit_res = cls.evaluate_rule(rule=rule, profile=profile, sources_map=sources_map)
            criteria.append(crit_res)

        # Calculate summary metrics
        matched_count = sum(1 for c in criteria if c.status == EligibilityStatus.MATCHED)
        failed_count = sum(1 for c in criteria if c.status == EligibilityStatus.FAILED)
        unverified_count = sum(1 for c in criteria if c.status == EligibilityStatus.UNVERIFIED)

        # Deterministic Aggregation Logic:
        # 1. If any mandatory rule has FAILED -> Overall FAILED
        # 2. If no mandatory rule has FAILED but any mandatory rule is UNVERIFIED -> Overall UNVERIFIED
        # 3. If all mandatory rules are MATCHED -> Overall MATCHED
        mandatory_criteria = [c for c in criteria if c.is_mandatory]

        if not mandatory_criteria:
            # If no rules exist or all are optional, determine status from available criteria or MATCHED
            if failed_count > 0:
                overall_status = EligibilityStatus.FAILED
            elif unverified_count > 0:
                overall_status = EligibilityStatus.UNVERIFIED
            else:
                overall_status = EligibilityStatus.MATCHED
        else:
            has_mandatory_fail = any(c.status == EligibilityStatus.FAILED for c in mandatory_criteria)
            has_mandatory_unverified = any(c.status == EligibilityStatus.UNVERIFIED for c in mandatory_criteria)

            if has_mandatory_fail:
                overall_status = EligibilityStatus.FAILED
            elif has_mandatory_unverified:
                overall_status = EligibilityStatus.UNVERIFIED
            else:
                overall_status = EligibilityStatus.MATCHED

        return EligibilityCheckResponse(
            scheme_id=scheme.id,
            scheme_code=scheme.scheme_code,
            scheme_name=scheme.scheme_name,
            overall_status=overall_status,
            evaluated_at=datetime.now(timezone.utc),
            summary=EligibilitySummary(
                total_rules=len(criteria),
                matched_count=matched_count,
                failed_count=failed_count,
                unverified_count=unverified_count,
            ),
            criteria=criteria,
        )
