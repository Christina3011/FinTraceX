"""Build per-transaction features. Input: data/transactions.csv"""
import numpy as np
import pandas as pd

CAT_COLS = ["merchant", "item", "location"]
NUM_COLS = ["amount", "amount_ratio", "hour", "new_device", "new_location",
            "txn_last_hour", "accounts_per_device", "accounts_per_payout"]
FEATURES = NUM_COLS + CAT_COLS


def build_features(path="data/transactions.csv"):
    df = pd.read_csv(path, parse_dates=["timestamp"])
    df = df.sort_values(["timestamp", "txn_id"]).reset_index(drop=True)
    g = df.groupby("account_id")

    # amount vs the account's PREVIOUS average (no leakage from the future)
    prev_mean = g["amount"].transform(lambda s: s.expanding().mean().shift(1))
    df["amount_ratio"] = (df["amount"] / prev_mean).replace([np.inf], np.nan).fillna(1.0)

    df["hour"] = df["timestamp"].dt.hour

    # first time this account uses this device / location
    df["new_device"] = (df.groupby(["account_id", "device_id"]).cumcount() == 0).astype(int)
    df["new_location"] = (df.groupby(["account_id", "location"]).cumcount() == 0).astype(int)

    # number of this account's transactions in the previous hour
    def last_hour(ts):
        t = ts.values.astype("datetime64[ns]").astype("int64")
        start = np.searchsorted(t, t - 3_600_000_000_000, side="left")
        return pd.Series(np.arange(len(t)) - start, index=ts.index)
    df["txn_last_hour"] = g["timestamp"].apply(last_hour).reset_index(level=0, drop=True)

    # ring signals: how many different accounts share this device / payout account
    df["accounts_per_device"] = df.groupby("device_id")["account_id"].transform("nunique")
    df["accounts_per_payout"] = (df.groupby("payout_account")["account_id"]
                                 .transform("nunique").fillna(0).astype(int))

    for c in CAT_COLS:
        df[c] = df[c].fillna("unknown").astype(str)
    return df