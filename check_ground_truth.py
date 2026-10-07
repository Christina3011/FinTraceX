"""Compare model output with the hidden answer key. Run AFTER train.py."""
import json
import pandas as pd

gt = json.load(open("data/ground_truth.json"))
s = pd.read_csv("outputs/scores.csv")
a = pd.read_csv("outputs/account_scores.csv")
flagged = s[s.flagged]

ring = set(gt["ring_accounts"])
ring_hit = ring & set(flagged.account_id)
decoys = s[s.txn_id.isin(gt["decoy_txn_ids"])]
shared = {x for ms in gt["shared_device_groups"].values() for x in ms}
shared_fp = flagged[flagged.account_id.isin(shared) & (flagged.is_fraud == 0)]

print(f"Ring accounts with >=1 flagged txn : {len(ring_hit)} / {len(ring)}")
print(f"Ring fraud txns flagged            : {int(flagged[flagged.account_id.isin(ring)].is_fraud.sum())} "
      f"/ {int(s[s.account_id.isin(ring)].is_fraud.sum())}")
print(f"Legit high-value decoys flagged    : {int(decoys.flagged.sum())} / {len(decoys)}")
print(f"False flags on shared-device users : {len(shared_fp)}")
print(f"All false positives                : {len(flagged[flagged.is_fraud == 0])} of {int((s.is_fraud == 0).sum())} legit txns")