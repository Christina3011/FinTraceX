"""Application boundary for transaction analysis.

The frontend/API can depend on this module without embedding model or graph
logic in a UI handler. Production adapters can be supplied for the existing
XGBoost/SHAP and NetworkX pipeline.
"""
from collections.abc import Callable, Mapping
from datetime import datetime
from typing import Any

REQUIRED_FIELDS = (
    "txn_id", "account_id", "timestamp", "amount", "merchant",
    "item", "device_id", "location", "payout_account",
)


class ModelNotConnectedError(RuntimeError):
    """Raised when an analysis is requested before a model adapter is wired."""


def validate_transaction(transaction: Mapping[str, Any]) -> dict[str, str]:
    errors: dict[str, str] = {}
    for field in REQUIRED_FIELDS:
        if not str(transaction.get(field, "")).strip():
            errors[field] = "This field is required."
    if "amount" not in errors:
        try:
            if float(transaction["amount"]) <= 0:
                errors["amount"] = "Amount must be greater than 0."
        except (TypeError, ValueError):
            errors["amount"] = "Amount must be numeric."
    if "timestamp" not in errors:
        try:
            datetime.fromisoformat(str(transaction["timestamp"]).replace(" ", "T"))
        except ValueError:
            errors["timestamp"] = "Timestamp must be valid."
    return errors


def prepare_transaction(transaction: Mapping[str, Any]) -> dict[str, Any]:
    """Normalize a validated UI payload into the pipeline's internal format."""
    errors = validate_transaction(transaction)
    if errors:
        raise ValueError(errors)
    return {
        "txn_id": str(transaction["txn_id"]).strip(),
        "account_id": str(transaction["account_id"]).strip(),
        "timestamp": str(transaction["timestamp"]).strip(),
        "amount": float(transaction["amount"]),
        "merchant": str(transaction["merchant"]).strip(),
        "item": str(transaction["item"]).strip(),
        "device_id": str(transaction["device_id"]).strip(),
        "location": str(transaction["location"]).strip(),
        "payout_account": str(transaction["payout_account"]).strip(),
    }


def analyze_transaction(
    transaction: Mapping[str, Any],
    *,
    predict_risk: Callable[[dict[str, Any]], Mapping[str, Any]] | None = None,
    generate_explanation: Callable[[dict[str, Any], Mapping[str, Any]], Any] | None = None,
    analyze_network: Callable[[dict[str, Any]], Any] | None = None,
    detect_fraud_ring: Callable[[dict[str, Any], Any], Any] | None = None,
) -> dict[str, Any]:
    """Run the complete analysis contract using explicit production adapters.

    No fallback score is generated: an API must wire ``predict_risk`` before
    exposing this operation to analysts.
    """
    prepared = prepare_transaction(transaction)
    if not all((predict_risk, generate_explanation, analyze_network, detect_fraud_ring)):
        raise ModelNotConnectedError(
            "Transaction analysis adapters are not connected to the model pipeline."
        )
    prediction = dict(predict_risk(prepared))
    network = analyze_network(prepared)
    return {
        "transaction": prepared,
        "prediction": prediction,
        "explanation": generate_explanation(prepared, prediction),
        "network": network,
        "fraud_ring": detect_fraud_ring(prepared, network),
    }
