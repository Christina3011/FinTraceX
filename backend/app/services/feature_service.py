from __future__ import annotations

from typing import Any

import numpy as np
import pandas as pd

CAT_COLS = ["merchant", "item", "location"]
NUM_COLS = [
    "amount",
    "amount_ratio",
    "hour",
    "new_device",
    "new_location",
    "txn_last_hour",
    "accounts_per_device",
    "accounts_per_payout",
]
FEATURES = NUM_COLS + CAT_COLS


def _normalize_text(value: Any) -> str:
    if value is None:
        return "unknown"
    text = str(value).strip()
    return text if text else "unknown"


def _prepare_categorical_columns(frame: pd.DataFrame) -> pd.DataFrame:
    out = frame.copy()
    for column in CAT_COLS:
        out[column] = out[column].map(_normalize_text)
    return out


def _category_values(values: list[str] | None) -> list[str]:
    cleaned = [str(v).strip() for v in (values or []) if v is not None and str(v).strip()]
    unique = []
    for value in cleaned:
        if value not in unique:
            unique.append(value)
    return unique or ["unknown"]


def build_feature_frame(frame: pd.DataFrame) -> pd.DataFrame:
    frame = frame.copy()
    frame.sort_values(["timestamp", "txn_id"], kind="mergesort", inplace=True)
    frame = _prepare_categorical_columns(frame)
    if "account_id" not in frame.columns:
        return frame

    grouped = frame.groupby("account_id")
    prev_mean = grouped["amount"].transform(lambda s: s.expanding().mean().shift(1))
    frame["amount_ratio"] = (frame["amount"] / prev_mean).replace([np.inf], np.nan).fillna(1.0)
    frame["hour"] = frame["timestamp"].dt.hour
    frame["new_device"] = (frame.groupby(["account_id", "device_id"]).cumcount() == 0).astype(int)
    frame["new_location"] = (frame.groupby(["account_id", "location"]).cumcount() == 0).astype(int)

    def last_hour(ts: pd.Series) -> pd.Series:
        values = ts.values.astype("datetime64[ns]").astype("int64")
        start = np.searchsorted(values, values - 3_600_000_000_000, side="left")
        return pd.Series(np.arange(len(ts)) - start, index=ts.index)

    frame["txn_last_hour"] = grouped["timestamp"].apply(last_hour).reset_index(level=0, drop=True)
    frame["accounts_per_device"] = frame.groupby("device_id")["account_id"].transform("nunique")
    frame["accounts_per_payout"] = (
        frame.groupby("payout_account")["account_id"].transform("nunique").fillna(0).astype(int)
    )
    return frame


def build_transaction_features(history: pd.DataFrame, payload: dict, category_vocab: dict[str, list[str]] | None = None) -> pd.DataFrame:
    record = {"amount": float(payload["amount"]), "account_id": str(payload["account_id"]), "merchant": _normalize_text(payload.get("merchant")), "item": _normalize_text(payload.get("item", "misc")), "location": _normalize_text(payload.get("location")), "device_id": _normalize_text(payload.get("device_id")), "payout_account": _normalize_text(payload.get("payout_account")) if payload.get("payout_account") else "unknown", "timestamp": pd.to_datetime(payload["timestamp"])}
    row_df = pd.DataFrame([record])
    account_history = history[history["account_id"] == record["account_id"]].copy()
    if not account_history.empty:
        prior_mean = float(account_history["amount"].mean())
        ratio = (record["amount"] / prior_mean) if prior_mean and prior_mean != 0 else 1.0
    else:
        ratio = 1.0

    row_df["amount_ratio"] = ratio
    row_df["hour"] = row_df["timestamp"].dt.hour
    row_df["new_device"] = int(record["device_id"] not in set(account_history["device_id"].astype(str)))
    row_df["new_location"] = int(record["location"] not in set(account_history["location"].astype(str)))

    relevant_recent = account_history[(account_history["timestamp"] >= (row_df["timestamp"].iloc[0] - pd.Timedelta(hours=1))) & (account_history["timestamp"] <= row_df["timestamp"].iloc[0])]
    row_df["txn_last_hour"] = int(len(relevant_recent))

    device_accounts = set(history[history["device_id"].astype(str) == record["device_id"]]["account_id"].astype(str))
    device_accounts.add(record["account_id"])
    row_df["accounts_per_device"] = int(len(device_accounts))

    payout_accounts = set(history[history["payout_account"].astype(str) == record["payout_account"]]["account_id"].astype(str)) if record["payout_account"] != "unknown" else set()
    payout_accounts.add(record["account_id"]) if record["payout_account"] != "unknown" else None
    row_df["accounts_per_payout"] = int(len(payout_accounts)) if record["payout_account"] != "unknown" else 0

    model_input = row_df[["amount", "amount_ratio", "hour", "new_device", "new_location", "txn_last_hour", "accounts_per_device", "accounts_per_payout", "merchant", "item", "location"]].copy()
    for column in CAT_COLS:
        model_input[column] = model_input[column].map(_normalize_text)
    if category_vocab:
        for column in CAT_COLS:
            categories = _category_values(category_vocab.get(column, ["unknown"]))
            fallback = categories[0] if categories else "unknown"
            value = model_input[column].iloc[0]
            model_input[column] = value if value in categories else fallback
            model_input[column] = pd.Categorical(model_input[column], categories=categories)
    else:
        for column in CAT_COLS:
            model_input[column] = pd.Categorical(model_input[column])
    return model_input[FEATURES]
