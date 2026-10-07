"""Generate simulated transactions with a hidden fraud ring, lone fraud, legitimate
high-value decoys and innocent shared devices.
Run: python simulate_data.py
Writes: data/transactions.csv, data/ground_truth.json   (seed fixed => reproducible)
"""
import json
import numpy as np
import pandas as pd

SEED = 42
N_NORMAL = 500            # normal accounts
TXNS_PER_ACCOUNT = (18, 32)
N_DECOYS = 30             # legit high-value purchases (must NOT be flagged)
N_FAMILIES, N_OFFICES = 15, 3   # innocent shared devices
N_LONE_FRAUD = 40         # stolen-card style cases
RING_SIZE, RING_CYCLES = 10, 3
START, DAYS = pd.Timestamp("2026-01-01"), 60

rng = np.random.default_rng(SEED)
CITIES = ["Chennai", "Coimbatore", "Madurai", "Bengaluru", "Hyderabad", "Kochi", "Mumbai", "Delhi"]
# merchant -> (items, price multiplier vs account's usual amount)
MERCHANTS = {"grocery": (["groceries", "vegetables"], .6), "fuel": (["petrol", "diesel"], .8),
             "food": (["restaurant", "delivery"], .4), "pharmacy": (["medicine"], .5),
             "clothing": (["clothes", "shoes"], 1.2), "streaming": (["subscription"], .2),
             "travel": (["bus_ticket", "train_ticket"], 2.0)}
rows = []

def add(acc, ts, amount, merchant, item, device, loc, payout, fraud):
    rows.append(dict(account_id=acc, timestamp=ts, amount=round(float(max(amount, 1)), 2),
                     merchant=merchant, item=item, device_id=device, location=loc,
                     payout_account=payout, is_fraud=fraud))

def rand_ts(day_lo=0, day_hi=DAYS, hour=None):
    day = int(rng.integers(day_lo, day_hi))
    h = hour if hour is not None else int(np.clip(rng.normal(14, 4), 7, 23))
    return START + pd.Timedelta(days=day, hours=h, minutes=int(rng.integers(0, 60)))

# ---------- 1. normal accounts (with innocent shared devices) ----------
acc_info = {}
shared_groups = {}
ids = [f"A{i:04d}" for i in range(N_NORMAL)]
perm = list(rng.permutation(ids))
for k in range(N_FAMILIES):                       # family: 2-4 accounts on one device
    members = [perm.pop() for _ in range(int(rng.integers(2, 5)))]
    shared_groups[f"D_FAM_{k}"] = members
for k in range(N_OFFICES):                        # office wifi: 5-6 accounts on one device
    members = [perm.pop() for _ in range(int(rng.integers(5, 7)))]
    shared_groups[f"D_OFF_{k}"] = members
shared_of = {a: d for d, ms in shared_groups.items() for a in ms}

for a in ids:
    home, away = rng.choice(CITIES, 2, replace=False)
    devices = [f"D_{a}"] if a not in shared_of else [shared_of[a]]
    if a in shared_of and rng.random() < .5: devices.append(f"D_{a}")
    acc_info[a] = dict(base=float(rng.lognormal(4.6, .5)), home=home, away=away, devices=devices,
                       merchants=list(rng.choice(list(MERCHANTS), int(rng.integers(2, 5)), replace=False)),
                       payee=f"PAYEE_{a}")
    for _ in range(int(rng.integers(*TXNS_PER_ACCOUNT))):
        i = acc_info[a]; r = rng.random()
        loc = i["home"] if rng.random() < .9 else i["away"]
        dev = i["devices"][0] if rng.random() < .8 else rng.choice(i["devices"])
        if r < .04:   # normal person-to-person transfer to a personal payee
            add(a, rand_ts(), i["base"] * rng.uniform(.5, 1.5), "transfer", "p2p_transfer", dev, loc, i["payee"], 0)
        elif r < .05:  # occasional harmless gift card, so the item alone is not a fraud signal
            add(a, rand_ts(), rng.uniform(20, 60), "giftcards", "gift_card", dev, loc, None, 0)
        else:
            m = rng.choice(i["merchants"]); items, mult = MERCHANTS[m]
            amt = rng.normal(i["base"] * mult, i["base"] * mult * .25)
            if rng.random() < .05: amt *= rng.uniform(1.5, 2.5)   # natural variation
            add(a, rand_ts(), amt, m, rng.choice(items), dev, loc, None, 0)

# ---------- 2. legitimate high-value decoys (NOT fraud) ----------
decoy_accts = list(rng.choice(ids, N_DECOYS, replace=False))
decoy_idx = []
for a in decoy_accts:
    i = acc_info[a]
    decoy_idx.append(len(rows))
    add(a, rand_ts(hour=int(rng.integers(10, 20))), i["base"] * rng.uniform(8, 20), "electronics",
        rng.choice(["laptop", "phone", "television"]), i["devices"][0], i["home"], None, 0)

# ---------- 3. lone fraud (stolen card): big, new device, new city, 1-4 AM ----------
lone_accts = list(rng.choice([a for a in ids if a not in decoy_accts], N_LONE_FRAUD, replace=False))
for n, a in enumerate(lone_accts):
    i = acc_info[a]
    city = rng.choice([c for c in CITIES if c not in (i["home"], i["away"])])
    ts0 = rand_ts(10, DAYS, hour=int(rng.integers(1, 5)))
    for k in range(int(rng.integers(1, 4))):
        add(a, ts0 + pd.Timedelta(minutes=12 * k), i["base"] * rng.uniform(6, 15),
            rng.choice(["electronics", "giftcards", "travel"]), rng.choice(["phone", "gift_card", "flight_ticket"]),
            f"D_STOLEN_{n}", city, None, 1)

# ---------- 4. THE FRAUD RING ----------
ring_accts = [f"R{i:03d}" for i in range(RING_SIZE)]
ring_devices = ["D_RING_1", "D_RING_2", "D_RING_3"]
ring_payout = "PAYOUT_X"
SEQ = [("giftcards", "gift_card"), ("prepaid", "prepaid_card"), ("digital_goods", "game_credits")]
for a in ring_accts:
    city = rng.choice(CITIES); base = float(rng.uniform(60, 160))
    my_dev = list(rng.choice(ring_devices, 2, replace=False))
    for _ in range(12):   # normal-looking history on a personal device
        m = rng.choice(list(MERCHANTS)); items, mult = MERCHANTS[m]
        add(a, rand_ts(0, 15), rng.normal(base * mult, base * mult * .2), m, rng.choice(items), f"D_{a}", city, None, 0)
    for c in range(RING_CYCLES):   # same item sequence, then money moved to the same place
        ts0 = rand_ts(15 + c * 14, 29 + c * 14, hour=int(rng.integers(9, 23)))
        for k, (m, it) in enumerate(SEQ):
            add(a, ts0 + pd.Timedelta(minutes=7 * k), base * rng.uniform(.8, 1.8), m, it, rng.choice(my_dev), city, None, 1)
        add(a, ts0 + pd.Timedelta(minutes=30), base * rng.uniform(2, 3.5), "transfer", "p2p_transfer",
            rng.choice(my_dev), city, ring_payout, 1)

# ---------- save ----------
df = pd.DataFrame(rows)
df["_decoy"] = False; df.loc[decoy_idx, "_decoy"] = True
df = df.sort_values("timestamp").reset_index(drop=True)
df.insert(0, "txn_id", [f"T{i:06d}" for i in range(len(df))])
truth = dict(ring_accounts=ring_accts, ring_devices=ring_devices, ring_payout=ring_payout,
             lone_fraud_accounts=lone_accts, decoy_txn_ids=df.loc[df._decoy, "txn_id"].tolist(),
             shared_device_groups=shared_groups)
df.drop(columns="_decoy").to_csv("data/transactions.csv", index=False)
json.dump(truth, open("data/ground_truth.json", "w"), indent=2)

print(f"rows={len(df)} accounts={df.account_id.nunique()} fraud rows={df.is_fraud.sum()} "
      f"({100*df.is_fraud.mean():.2f}%)")
print(f"ring: {RING_SIZE} accounts | lone fraud accounts: {N_LONE_FRAUD} | decoys: {N_DECOYS} | "
      f"shared-device groups: {len(shared_groups)}")