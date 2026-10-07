"""Build point-in-time transaction features from data/transactions.csv."""
from collections import defaultdict

import numpy as np
import pandas as pd

CAT_COLS = ["merchant", "item", "location"]
NUM_COLS = [
    "amount_vs_account_mean", "amount_vs_account_max", "hour", "known_device", "known_location",
    "normal_hour_for_account", "account_transaction_count", "days_since_last_transaction",
    "txn_last_hour", "accounts_per_device", "accounts_per_payout",
]
FEATURES = NUM_COLS + CAT_COLS


def _prior_shared_account_counts(df, key_column):
    """Count distinct accounts seen on each device/payee before each timestamp."""
    counts = np.zeros(len(df), dtype=int)
    seen_accounts = defaultdict(set)
    for _, batch in df.groupby("timestamp", sort=False):
        for row in batch[["account_id", key_column]].itertuples(index=True, name=None):
            index, account_id, key = row
            if pd.notna(key):
                counts[index] = len(seen_accounts[key])
        for account_id, key in batch[["account_id", key_column]].itertuples(index=False, name=None):
            if pd.notna(key):
                seen_accounts[key].add(account_id)
    return counts


def build_features(path="data/transactions.csv"):
    df = pd.read_csv(path, parse_dates=["timestamp"])
    df = df.sort_values(["timestamp", "txn_id"]).reset_index(drop=True)
    df["hour"] = df["timestamp"].dt.hour

    # Each timestamp batch is scored from history strictly before that timestamp.
    history_columns = [
        "amount_ratio", "amount_vs_account_mean", "amount_vs_account_max",
        "new_device", "known_device", "new_location", "known_location",
        "normal_hour_for_account", "account_transaction_count",
        "days_since_last_transaction", "txn_last_hour",
    ]
    for column in history_columns:
        df[column] = 0.0

    hour_ns = 3_600_000_000_000
    for _, account_rows in df.groupby("account_id", sort=False):
        previous_amount_sum = 0.0
        previous_amount_max = 0.0
        previous_count = 0
        previous_devices = set()
        previous_locations = set()
        previous_hours = np.zeros(24, dtype=int)
        previous_timestamps = []
        previous_timestamp = None

        for timestamp, batch in account_rows.groupby("timestamp", sort=False):
            amounts = batch["amount"].to_numpy(dtype=float)
            if previous_count:
                previous_mean = previous_amount_sum / previous_count
                normal_hour_share = None
            else:
                previous_mean = 0.0
                normal_hour_share = 0.0

            for index, row in batch.iterrows():
                amount = float(row["amount"])
                device = row["device_id"]
                location = row["location"]
                hour = int(row["hour"])
                known_device = int(pd.notna(device) and device in previous_devices)
                known_location = int(pd.notna(location) and location in previous_locations)
                if previous_count:
                    nearby_hour_count = sum(
                        previous_hours[(hour + offset) % 24] for offset in (-2, -1, 0, 1, 2)
                    )
                    normal_hour_share = nearby_hour_count / previous_count
                    last_hour_start = np.searchsorted(
                        previous_timestamps, timestamp.value - hour_ns, side="left"
                    )
                    txn_last_hour = len(previous_timestamps) - last_hour_start
                    days_since_last = (timestamp - previous_timestamp).total_seconds() / 86400
                else:
                    txn_last_hour = 0
                    days_since_last = 0.0

                amount_mean_ratio = amount / previous_mean if previous_count and previous_mean > 0 else 1.0
                amount_max_ratio = amount / previous_amount_max if previous_amount_max > 0 else 1.0
                df.at[index, "amount_ratio"] = amount_mean_ratio
                df.at[index, "amount_vs_account_mean"] = amount_mean_ratio
                df.at[index, "amount_vs_account_max"] = amount_max_ratio
                df.at[index, "new_device"] = 1 - known_device
                df.at[index, "known_device"] = known_device
                df.at[index, "new_location"] = 1 - known_location
                df.at[index, "known_location"] = known_location
                df.at[index, "normal_hour_for_account"] = normal_hour_share
                df.at[index, "account_transaction_count"] = previous_count
                df.at[index, "days_since_last_transaction"] = days_since_last
                df.at[index, "txn_last_hour"] = txn_last_hour

            # Update history only after all transactions at this timestamp are featurized.
            previous_amount_sum += float(amounts.sum())
            previous_amount_max = max(previous_amount_max, float(amounts.max()))
            previous_count += len(batch)
            previous_hours += np.bincount(batch["hour"].to_numpy(dtype=int), minlength=24)
            previous_devices.update(batch["device_id"].dropna())
            previous_locations.update(batch["location"].dropna())
            previous_timestamps.extend([timestamp.value] * len(batch))
            previous_timestamp = timestamp

    df["accounts_per_device"] = _prior_shared_account_counts(df, "device_id")
    df["accounts_per_payout"] = _prior_shared_account_counts(df, "payout_account")

    for c in CAT_COLS:
        df[c] = df[c].fillna("unknown").astype(str)
    return df