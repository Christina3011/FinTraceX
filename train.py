"""Train XGBoost (+ Logistic Regression baseline), pick threshold, explain with SHAP.
Run: python train.py
Writes: outputs/scores.csv, outputs/account_scores.csv, outputs/model.json
"""
import json
from pathlib import Path

import numpy as np
import pandas as pd
import xgboost as xgb
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    average_precision_score,
    confusion_matrix,
    f1_score,
    precision_recall_curve,
    precision_score,
    recall_score,
)
from sklearn.preprocessing import StandardScaler
from features import build_features, FEATURES, CAT_COLS, NUM_COLS

SEED = 42
MIN_PRECISION = 0.90   # false alarms are penalised, so we demand high precision

df = build_features()
for c in CAT_COLS:   # XGBoost reads pandas 'category' columns natively
    df[c] = pd.Categorical(df[c])

# ---- 1. split BY ACCOUNT (an account never appears in two sets) ----
rng = np.random.default_rng(SEED)
accts = rng.permutation(df["account_id"].unique())
n = len(accts)
train_a, val_a = set(accts[: int(.6 * n)]), set(accts[int(.6 * n): int(.8 * n)])
split = df["account_id"].map(lambda a: "train" if a in train_a else "val" if a in val_a else "test")
tr, va, te = (df[split == s] for s in ("train", "val", "test"))
print(f"rows  train={len(tr)} val={len(va)} test={len(te)}  | fraud in test={te.is_fraud.sum()}")

# ---- 2. XGBoost ----
spw = (tr.is_fraud == 0).sum() / max((tr.is_fraud == 1).sum(), 1)   # handles rare fraud
model = xgb.XGBClassifier(n_estimators=300, max_depth=5, learning_rate=0.1, subsample=0.8,
                          colsample_bytree=0.8, scale_pos_weight=spw, tree_method="hist",
                          enable_categorical=True, eval_metric="aucpr",
                          random_state=SEED)   # fixed number of trees: early stopping on a saturated PR-AUC stops too soon and squashes the scores
model.fit(tr[FEATURES], tr.is_fraud, eval_set=[(va[FEATURES], va.is_fraud)], verbose=False)
model.save_model("outputs/model.json")

def cat_score(d):
    return model.predict_proba(d[FEATURES])[:, 1]

# ---- 3. baseline: Logistic Regression (numeric features only) ----
sc = StandardScaler().fit(tr[NUM_COLS])
lr = LogisticRegression(class_weight="balanced", max_iter=1000).fit(sc.transform(tr[NUM_COLS]), tr.is_fraud)
lr_score = lambda d: lr.predict_proba(sc.transform(d[NUM_COLS]))[:, 1]

# ---- 4. threshold chosen on VALIDATION: best recall with precision >= MIN_PRECISION ----
def pick_threshold(y, s):
    p, r, t = precision_recall_curve(y, s)
    ok = np.where(p[:-1] >= MIN_PRECISION)[0]
    if len(ok) == 0:                       # fall back to best F0.5 (favours precision)
        f = 1.25 * p[:-1] * r[:-1] / np.maximum(.25 * p[:-1] + r[:-1], 1e-9)
        return float(t[np.argmax(f)])
    return float(t[ok[np.argmax(r[:-1][ok])]])

def evaluate(name, y, s, thr):
    pred = s >= thr
    matrix = confusion_matrix(y, pred, labels=[0, 1])
    print(
        f"{name:12s} threshold={thr:.6f} precision={precision_score(y, pred, zero_division=0):.3f} "
        f"recall={recall_score(y, pred, zero_division=0):.3f} "
        f"F1={f1_score(y, pred, zero_division=0):.3f} "
        f"accuracy={accuracy_score(y, pred):.3f} "
        f"PR-AUC={average_precision_score(y, s):.3f}\n"
        f"  confusion matrix [[TN, FP], [FN, TP]]: {matrix.tolist()}"
    )

thr = pick_threshold(va.is_fraud, cat_score(va))
thr_lr = pick_threshold(va.is_fraud, lr_score(va))
print("\n--- TEST SET RESULTS ---")
evaluate("XGBoost", te.is_fraud, cat_score(te), thr)
evaluate("LogReg base", te.is_fraud, lr_score(te), thr_lr)

# ---- 5. SHAP explanations -> plain English ----
def reason_text(f, row, lower_risk=False):
    def account_count(key):
        count = int(row[key])
        return f"{count} account{'s' if count != 1 else ''}"

    return {
        "amount_ratio": f"amount is {row['amount_ratio']:.1f}x this account's previous average",
        "amount_vs_account_mean": (
            f"amount is {row['amount_vs_account_mean']:.1f}x this account's previous average"
        ),
        "amount_vs_account_max": (
            f"amount is {row['amount_vs_account_max']:.1f}x this account's previous maximum"
        ),
        "amount": f"large amount ({row['amount']:.0f})",
        "hour": f"transaction at {int(row['hour']):02d}:00",
        "new_device": "new device for this account",
        "known_device": "device previously used by this account",
        "new_location": "new location for this account",
        "known_location": "location previously used by this account",
        "normal_hour_for_account": (
            f"transaction hour matches {row['normal_hour_for_account']:.0%} "
            "of this account's previous activity within two hours"
        ),
        "account_transaction_count": (
            f"{int(row['account_transaction_count'])} previous transactions for this account"
        ),
        "days_since_last_transaction": (
            f"{row['days_since_last_transaction']:.1f} days since this account's last transaction"
        ),
        "txn_last_hour": f"{int(row['txn_last_hour'])} other transactions in the last hour",
        "accounts_per_device": (
            f"device previously seen on {account_count('accounts_per_device')}"
            if lower_risk
            else f"device shared by {account_count('accounts_per_device')}"
        ),
        "accounts_per_payout": (
            f"payout account previously seen on {account_count('accounts_per_payout')}"
            if lower_risk
            else f"payout account shared by {account_count('accounts_per_payout')}"
        ),
        "merchant": (
            f"merchant category ({row['merchant']})"
            if lower_risk
            else f"unusual merchant ({row['merchant']})"
        ),
        "item": (
            f"item category ({row['item']})"
            if lower_risk
            else f"unusual item ({row['item']})"
        ),
        "location": (
            f"location ({row['location']})"
            if lower_risk
            else f"unusual location ({row['location']})"
        ),
    }[f]

df["risk_score"] = cat_score(df)
df["flagged"] = df["risk_score"] >= thr
dm = xgb.DMatrix(df[FEATURES], enable_categorical=True)
shap = model.get_booster().predict(dm, pred_contribs=True)[:, :-1]  # drop bias column

reasons = []
for i in range(len(df)):
    row = df.iloc[i]
    if df["flagged"].iat[i]:
        top = [j for j in np.argsort(-shap[i])[:3] if shap[i][j] > 0]
        reasons.append("; ".join(reason_text(FEATURES[j], row) for j in top))
    else:
        top = [j for j in np.argsort(shap[i])[:3] if shap[i][j] < 0]
        evidence = "; ".join(reason_text(FEATURES[j], row, lower_risk=True) for j in top)
        reasons.append(f"Lower-risk evidence: {evidence}" if evidence else "")
df["reasons"] = reasons

# Decoy IDs are used only for a separate evaluation report, never for features or fitting.
ground_truth = json.loads(Path("data/ground_truth.json").read_text(encoding="utf-8"))
decoys = df[df["txn_id"].isin(ground_truth["decoy_txn_ids"])]
decoy_flags = decoys["risk_score"] >= thr
print(
    f"\nLegitimate high-value decoys (all {len(decoys)}): "
    f"correctly unflagged={int((~decoy_flags).sum())}, "
    f"incorrectly flagged={int(decoy_flags.sum())}, "
    f"false-positive rate={decoy_flags.mean():.3f}"
)
test_decoys = df[
    (split == "test") & df["txn_id"].isin(ground_truth["decoy_txn_ids"])
]
if len(test_decoys):
    test_decoy_flags = test_decoys["risk_score"] >= thr
    print(
        f"  Test-split decoys ({len(test_decoys)}): "
        f"incorrectly flagged={int(test_decoy_flags.sum())}, "
        f"false-positive rate={test_decoy_flags.mean():.3f}"
    )

# ---- 6. account score = mean of the account's top-3 transaction scores ----
acc = (df.groupby("account_id")["risk_score"]
         .apply(lambda s: s.nlargest(3).mean()).rename("account_score").reset_index())
acc["flagged_txns"] = acc["account_id"].map(df.groupby("account_id")["flagged"].sum())

df[["txn_id", "account_id", "timestamp", "amount", "device_id", "payout_account",
    "is_fraud", "risk_score", "flagged", "reasons"]].sort_values("risk_score", ascending=False)\
    .to_csv("outputs/scores.csv", index=False)
acc.sort_values("account_score", ascending=False).to_csv("outputs/account_scores.csv", index=False)
print(f"\nthreshold={thr:.3f} | flagged {int(df.flagged.sum())} of {len(df)} transactions")
print("saved outputs/scores.csv, outputs/account_scores.csv, outputs/model.json")