"""Compare model and ring outputs with synthetic ground truth. Run AFTER rings.py."""
import json
from pathlib import Path

import pandas as pd

gt = json.loads(Path("data/ground_truth.json").read_text(encoding="utf-8"))
s = pd.read_csv("outputs/scores.csv")
final_accounts = pd.read_csv("outputs/accounts_final.csv")
rings = json.loads(Path("outputs/rings.json").read_text(encoding="utf-8"))
flagged = s[s.flagged]

ring = set(gt["ring_accounts"])
ring_hit = ring & set(flagged.account_id)
decoys = s[s.txn_id.isin(gt["decoy_txn_ids"])]
shared = {x for ms in gt["shared_device_groups"].values() for x in ms}
shared_fp = flagged[flagged.account_id.isin(shared) & (flagged.is_fraud == 0)]
detected_ring_accounts = {
    account for detected_ring in rings for account in detected_ring["accounts"]
}
ring_fraud = s[s.account_id.isin(ring) & (s.is_fraud == 1)]
innocent_frozen = final_accounts[
    final_accounts.account_id.isin(shared)
    & final_accounts.action.str.startswith("FREEZE")
]

print(f"Ring accounts with >=1 flagged txn : {len(ring_hit)} / {len(ring)}")
print(f"Ring accounts detected             : {len(ring & detected_ring_accounts)} / {len(ring)}")
print(f"Ring fraud txns flagged            : {int(ring_fraud.flagged.sum())} / {len(ring_fraud)}")
print(f"Legit high-value decoys correct    : {int((~decoys.flagged).sum())} / {len(decoys)}")
print(f"Legit high-value decoys flagged    : {int(decoys.flagged.sum())} / {len(decoys)} "
      f"(FPR={decoys.flagged.mean():.3f})")
print(f"False flags on shared-device users : {len(shared_fp)}")
print(f"Innocent shared-device accts frozen: {len(innocent_frozen)}")
print(f"All false positives                : {len(flagged[flagged.is_fraud == 0])} of {int((s.is_fraud == 0).sum())} legit txns")