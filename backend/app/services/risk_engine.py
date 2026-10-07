from __future__ import annotations

import numpy as np


RISK_LEVELS = [
    (80, "CRITICAL"),
    (60, "HIGH"),
    (30, "MEDIUM"),
    (0, "LOW"),
]

REASON_TEXT = {
    "amount_ratio": lambda row: f"amount is {row['amount_ratio']:.1f}x this account's normal",
    "amount": lambda row: f"large amount ({row['amount']:.0f})",
    "hour": lambda row: f"unusual hour ({int(row['hour']):02d}:00)",
    "new_device": lambda row: "new device for this account",
    "new_location": lambda row: "new location for this account",
    "txn_last_hour": lambda row: f"{int(row['txn_last_hour'])} other transactions in the last hour",
    "accounts_per_device": lambda row: f"device shared by {int(row['accounts_per_device'])} accounts",
    "accounts_per_payout": lambda row: f"payout account shared by {int(row['accounts_per_payout'])} accounts",
    "merchant": lambda row: f"unusual merchant ({row['merchant']})",
    "item": lambda row: f"unusual item ({row['item']})",
    "location": lambda row: f"unusual location ({row['location']})",
}


def score_to_risk_level(score: float) -> str:
    for threshold, label in RISK_LEVELS:
        if score >= threshold:
            return label
    return "LOW"


def recommended_action(probability: float, risk_score: float, ring: dict | None) -> str:
    if ring is not None and risk_score >= 80:
        return "FREEZE & INVESTIGATE"
    if probability >= 0.85 or risk_score >= 90:
        return "HOLD & VERIFY"
    if probability >= 0.55 or risk_score >= 60:
        return "MANUAL REVIEW"
    if probability >= 0.30 or risk_score >= 30:
        return "MONITOR"
    return "NO ACTION"


def build_reasons(feature_values: dict, contribution_values: np.ndarray, feature_names: list[str]) -> list[str]:
    ranked = sorted(
        enumerate(feature_names),
        key=lambda item: contribution_values[item[0]],
        reverse=True,
    )
    reasons: list[str] = []
    for idx, name in ranked:
        value = contribution_values[idx]
        if value <= 0:
            continue
        reasons.append(REASON_TEXT.get(name, lambda row: name)(feature_values))
        if len(reasons) >= 3:
            break
    return reasons or ["transaction behavior is within a normal range"]
