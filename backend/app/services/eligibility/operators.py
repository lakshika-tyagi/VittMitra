"""
Deterministic Rule Operators for Government Scheme Eligibility Evaluation

Implements pure, type-safe comparison functions.
Any type error, unsupported operator, or unresolvable comparison deterministically returns UNVERIFIED.
"""
from typing import Any, Tuple, Optional, List, Set
from app.schemas.eligibility import EligibilityStatus


def _safe_to_number(val: Any) -> Optional[float]:
    """Safely convert numeric or numeric-string to float. Returns None if invalid."""
    if val is None:
        return None
    if isinstance(val, (int, float)):
        # Check for boolean which is a subclass of int in Python
        if isinstance(val, bool):
            return None
        return float(val)
    if isinstance(val, str):
        val_clean = val.strip().replace(",", "")
        try:
            return float(val_clean)
        except ValueError:
            return None
    return None


def _safe_to_bool(val: Any) -> Optional[bool]:
    """Safely parse boolean values or boolean strings."""
    if val is None:
        return None
    if isinstance(val, bool):
        return val
    if isinstance(val, str):
        v = val.strip().lower()
        if v in ("true", "1", "yes", "y"):
            return True
        if v in ("false", "0", "no", "n"):
            return False
    if isinstance(val, (int, float)):
        if val == 1:
            return True
        if val == 0:
            return False
    return None


def _safe_to_str(val: Any) -> Optional[str]:
    """Safely convert categorical value to clean trimmed string."""
    if val is None:
        return None
    if isinstance(val, str):
        s = val.strip()
        return s if s else None
    return str(val).strip()


def format_required_condition(operator: str, expected_value: Any) -> str:
    """Format operator and expected value into human-readable condition text."""
    op_clean = operator.strip().lower()
    if op_clean in (">=", "gte"):
        return f">= {expected_value}"
    if op_clean in (">", "gt"):
        return f"> {expected_value}"
    if op_clean in ("<=", "lte"):
        return f"<= {expected_value}"
    if op_clean in ("<", "lt"):
        return f"< {expected_value}"
    if op_clean in ("==", "=", "eq"):
        return f"== {expected_value}"
    if op_clean in ("!=", "<>", "ne"):
        return f"!= {expected_value}"
    if op_clean in ("in", "is_in"):
        if isinstance(expected_value, (list, tuple, set)):
            return f"in {list(expected_value)}"
        return f"in [{expected_value}]"
    if op_clean in ("not_in", "not in"):
        if isinstance(expected_value, (list, tuple, set)):
            return f"not in {list(expected_value)}"
        return f"not in [{expected_value}]"
    if op_clean in ("contains",):
        return f"contains {expected_value}"
    if op_clean in ("not_contains", "not contains"):
        return f"does not contain {expected_value}"
    if op_clean in ("boolean", "bool"):
        return f"== {expected_value}"
    return f"{operator} {expected_value}"


def evaluate_operator(
    operator: str,
    user_value: Any,
    expected_value: Any
) -> Tuple[EligibilityStatus, str]:
    """
    Evaluates a user value against an expected value using the specified operator.
    
    Returns:
        Tuple of (EligibilityStatus: MATCHED | FAILED | UNVERIFIED, required_condition_str)
    """
    condition_str = format_required_condition(operator, expected_value)

    # Missing user value is always UNVERIFIED
    if user_value is None:
        return EligibilityStatus.UNVERIFIED, condition_str

    op = operator.strip().lower()

    # 1. Numeric Comparison Operators: >=, >, <=, <
    if op in (">=", "gte", ">", "gt", "<=", "lte", "<", "lt"):
        user_num = _safe_to_number(user_value)
        exp_num = _safe_to_number(expected_value)

        if user_num is None or exp_num is None:
            return EligibilityStatus.UNVERIFIED, condition_str

        if op in (">=", "gte"):
            return (EligibilityStatus.MATCHED if user_num >= exp_num else EligibilityStatus.FAILED), condition_str
        elif op in (">", "gt"):
            return (EligibilityStatus.MATCHED if user_num > exp_num else EligibilityStatus.FAILED), condition_str
        elif op in ("<=", "lte"):
            return (EligibilityStatus.MATCHED if user_num <= exp_num else EligibilityStatus.FAILED), condition_str
        elif op in ("<", "lt"):
            return (EligibilityStatus.MATCHED if user_num < exp_num else EligibilityStatus.FAILED), condition_str

    # 2. Equality Operator: ==, =
    elif op in ("==", "=", "eq"):
        # Check boolean comparison
        if isinstance(expected_value, bool) or (isinstance(expected_value, str) and expected_value.lower() in ("true", "false")):
            user_b = _safe_to_bool(user_value)
            exp_b = _safe_to_bool(expected_value)
            if user_b is None or exp_b is None:
                return EligibilityStatus.UNVERIFIED, condition_str
            return (EligibilityStatus.MATCHED if user_b == exp_b else EligibilityStatus.FAILED), condition_str

        # Check numeric comparison
        user_num = _safe_to_number(user_value)
        exp_num = _safe_to_number(expected_value)
        if user_num is not None and exp_num is not None:
            return (EligibilityStatus.MATCHED if user_num == exp_num else EligibilityStatus.FAILED), condition_str

        # Categorical / string comparison (case-insensitive)
        user_str = _safe_to_str(user_value)
        exp_str = _safe_to_str(expected_value)
        if user_str is None or exp_str is None:
            return EligibilityStatus.UNVERIFIED, condition_str
        return (EligibilityStatus.MATCHED if user_str.lower() == exp_str.lower() else EligibilityStatus.FAILED), condition_str

    # 3. Inequality Operator: !=, <>
    elif op in ("!=", "<>", "ne"):
        # Check boolean
        if isinstance(expected_value, bool) or (isinstance(expected_value, str) and expected_value.lower() in ("true", "false")):
            user_b = _safe_to_bool(user_value)
            exp_b = _safe_to_bool(expected_value)
            if user_b is None or exp_b is None:
                return EligibilityStatus.UNVERIFIED, condition_str
            return (EligibilityStatus.MATCHED if user_b != exp_b else EligibilityStatus.FAILED), condition_str

        user_num = _safe_to_number(user_value)
        exp_num = _safe_to_number(expected_value)
        if user_num is not None and exp_num is not None:
            return (EligibilityStatus.MATCHED if user_num != exp_num else EligibilityStatus.FAILED), condition_str

        user_str = _safe_to_str(user_value)
        exp_str = _safe_to_str(expected_value)
        if user_str is None or exp_str is None:
            return EligibilityStatus.UNVERIFIED, condition_str
        return (EligibilityStatus.MATCHED if user_str.lower() != exp_str.lower() else EligibilityStatus.FAILED), condition_str

    # 4. Membership Operator: IN
    elif op in ("in", "is_in"):
        if not isinstance(expected_value, (list, tuple, set)):
            # If expected value is scalar string or number, treat as single-element set
            expected_list = [expected_value]
        else:
            expected_list = list(expected_value)

        # If user_value is a list (e.g. user selected multiple sectors/categories), check if any element intersects
        if isinstance(user_value, (list, tuple, set)):
            user_items = {_safe_to_str(x).lower() for x in user_value if _safe_to_str(x) is not None}
            exp_items = {_safe_to_str(x).lower() for x in expected_list if _safe_to_str(x) is not None}
            if not user_items:
                return EligibilityStatus.UNVERIFIED, condition_str
            return (EligibilityStatus.MATCHED if bool(user_items & exp_items) else EligibilityStatus.FAILED), condition_str

        user_str = _safe_to_str(user_value)
        if user_str is None:
            return EligibilityStatus.UNVERIFIED, condition_str

        exp_items = {_safe_to_str(x).lower() for x in expected_list if _safe_to_str(x) is not None}
        return (EligibilityStatus.MATCHED if user_str.lower() in exp_items else EligibilityStatus.FAILED), condition_str

    # 5. Non-Membership Operator: NOT_IN
    elif op in ("not_in", "not in"):
        if not isinstance(expected_value, (list, tuple, set)):
            expected_list = [expected_value]
        else:
            expected_list = list(expected_value)

        if isinstance(user_value, (list, tuple, set)):
            user_items = {_safe_to_str(x).lower() for x in user_value if _safe_to_str(x) is not None}
            exp_items = {_safe_to_str(x).lower() for x in expected_list if _safe_to_str(x) is not None}
            if not user_items:
                return EligibilityStatus.UNVERIFIED, condition_str
            return (EligibilityStatus.MATCHED if not bool(user_items & exp_items) else EligibilityStatus.FAILED), condition_str

        user_str = _safe_to_str(user_value)
        if user_str is None:
            return EligibilityStatus.UNVERIFIED, condition_str

        exp_items = {_safe_to_str(x).lower() for x in expected_list if _safe_to_str(x) is not None}
        return (EligibilityStatus.MATCHED if user_str.lower() not in exp_items else EligibilityStatus.FAILED), condition_str

    # 6. Contains Operator: CONTAINS
    elif op in ("contains",):
        # User value is container (list/str) and expected_value is element
        if isinstance(user_value, (list, tuple, set)):
            exp_str = _safe_to_str(expected_value)
            if exp_str is None:
                return EligibilityStatus.UNVERIFIED, condition_str
            user_items = {_safe_to_str(x).lower() for x in user_value if _safe_to_str(x) is not None}
            return (EligibilityStatus.MATCHED if exp_str.lower() in user_items else EligibilityStatus.FAILED), condition_str

        user_str = _safe_to_str(user_value)
        exp_str = _safe_to_str(expected_value)
        if user_str is None or exp_str is None:
            return EligibilityStatus.UNVERIFIED, condition_str
        return (EligibilityStatus.MATCHED if exp_str.lower() in user_str.lower() else EligibilityStatus.FAILED), condition_str

    # 7. Not Contains Operator: NOT_CONTAINS
    elif op in ("not_contains", "not contains"):
        if isinstance(user_value, (list, tuple, set)):
            exp_str = _safe_to_str(expected_value)
            if exp_str is None:
                return EligibilityStatus.UNVERIFIED, condition_str
            user_items = {_safe_to_str(x).lower() for x in user_value if _safe_to_str(x) is not None}
            return (EligibilityStatus.MATCHED if exp_str.lower() not in user_items else EligibilityStatus.FAILED), condition_str

        user_str = _safe_to_str(user_value)
        exp_str = _safe_to_str(expected_value)
        if user_str is None or exp_str is None:
            return EligibilityStatus.UNVERIFIED, condition_str
        return (EligibilityStatus.MATCHED if exp_str.lower() not in user_str.lower() else EligibilityStatus.FAILED), condition_str

    # 8. Boolean Operator: BOOLEAN, BOOL
    elif op in ("boolean", "bool"):
        user_b = _safe_to_bool(user_value)
        exp_b = _safe_to_bool(expected_value)
        if user_b is None or exp_b is None:
            return EligibilityStatus.UNVERIFIED, condition_str
        return (EligibilityStatus.MATCHED if user_b == exp_b else EligibilityStatus.FAILED), condition_str

    # Unsupported or unknown operator -> UNVERIFIED
    return EligibilityStatus.UNVERIFIED, condition_str
