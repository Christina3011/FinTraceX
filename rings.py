"""Detect fraud rings with a graph, explain them, and recommend actions.
Run AFTER train.py:  python rings.py
Reads : data/transactions.csv, outputs/scores.csv
Writes: outputs/rings.json, outputs/accounts_final.csv, outputs/ring_graph.html
"""
import json
from collections import Counter
from pathlib import Path

import networkx as nx
import pandas as pd

MIN_ACCOUNTS = 3     # a ring needs at least this many accounts
MIN_SIGNALS = 2      # ...and at least this many of the 3 signals below (kills false rings)
FLAGGED_SHARE = 0.5  # signal 1: at least half the members have flagged transactions

tx = pd.read_csv("data/transactions.csv", parse_dates=["timestamp"])
sc = pd.read_csv("outputs/scores.csv")
tx = tx.merge(sc[["txn_id", "risk_score", "flagged", "reasons"]], on="txn_id")
tx["reasons"] = tx["reasons"].fillna("")
flagged = tx[tx.flagged].sort_values("timestamp")
acct_max = tx.groupby("account_id")["risk_score"].max()      # account risk = its riskiest transaction

# ---------- 1. graph: accounts, devices, payout accounts ----------
G = nx.Graph()
for r in tx[["account_id", "device_id", "payout_account"]].drop_duplicates().itertuples():
    G.add_edge(f"acc:{r.account_id}", f"dev:{r.device_id}")
    if pd.notna(r.payout_account):
        G.add_edge(f"acc:{r.account_id}", f"pay:{r.payout_account}")

def accounts_in(nodes): return sorted(n[4:] for n in nodes if n.startswith("acc:"))

# ---------- 2. candidate groups -> 3 signals -> keep real rings ----------
rings, ring_of = [], {}
for comp in nx.connected_components(G):
    members = accounts_in(comp)
    n = len(members)
    if n < MIN_ACCOUNTS:
        continue
    f = flagged[flagged.account_id.isin(members)]
    flagged_members = sorted(f.account_id.unique())
    shared_pay = [x[4:] for x in comp if x.startswith("pay:") and len(accounts_in(G[x])) >= MIN_ACCOUNTS]
    shared_dev = [x[4:] for x in comp if x.startswith("dev:") and len(accounts_in(G[x])) >= MIN_ACCOUNTS]
    # signal 3: members follow the same sequence of flagged purchases
    seqs = Counter(tuple(g["item"].tolist()[:4]) for _, g in f.groupby("account_id"))
    seq, seq_n = (seqs.most_common(1)[0] if seqs else ((), 0))

    s1 = len(flagged_members) >= MIN_ACCOUNTS and len(flagged_members) / n >= FLAGGED_SHARE
    s2 = len(shared_pay) > 0
    s3 = seq_n >= MIN_ACCOUNTS and len(seq) >= 2
    signals = int(s1) + int(s2) + int(s3)
    if signals < MIN_SIGNALS:
        continue   # e.g. a family or office sharing one device: NOT a ring

    rid = f"R{len(rings) + 1}"
    for a in members: ring_of[a] = rid
    parts = [f"{n} accounts share {len(shared_dev)} device(s) ({', '.join(sorted(shared_dev))})"]
    if shared_pay: parts.append(f"and payout account {', '.join(sorted(shared_pay))}")
    if s3: parts.append(f"; {seq_n} of {n} follow the same purchase sequence: {' -> '.join(seq)}")
    if s1: parts.append(f"; {len(flagged_members)} of {n} have flagged transactions")
    rings.append(dict(
        ring_id=rid, accounts=members, n_accounts=n, shared_devices=sorted(shared_dev),
        shared_payout_accounts=sorted(shared_pay), common_sequence=list(seq),
        signals=dict(members_flagged=s1, shared_payout=s2, same_sequence=s3),
        pattern=" ".join(parts).replace(" ;", ";"),
        flagged_txns=len(f), flagged_amount=round(float(f.amount.sum()), 2),
        first_flagged=str(f.timestamp.min()), last_flagged=str(f.timestamp.max()),
        ring_score=round(0.5 * float(acct_max[members].mean()) + 0.5 * signals / 3, 3),
        action="FREEZE all member accounts and investigate; block payout account"))

# ---------- 3. accounts: final score, action, reason ----------
flag_thr = tx.loc[tx.flagged, "risk_score"].min() if tx.flagged.any() else 1.0
rows = []
for a, score in acct_max.items():
    fa = flagged[flagged.account_id == a]
    if a in ring_of:
        action, reason = f"FREEZE and investigate (member of {ring_of[a]})", f"member of fraud ring {ring_of[a]}"
    elif score >= 0.9:
        action, reason = "HOLD and verify with customer", "very high-risk transaction"
    elif len(fa):
        action, reason = "MANUAL REVIEW", "flagged transaction"
    elif score >= 0.3:
        action, reason = "MONITOR", "elevated risk score, below flag threshold"
    else:
        action, reason = "NO ACTION", ""
    if len(fa):
        reason += ("; " if reason else "") + fa.sort_values("risk_score", ascending=False).iloc[0]["reasons"]
    rows.append(dict(account_id=a, final_score=round(float(score), 4), flagged_txns=len(fa),
                     ring_id=ring_of.get(a, ""), action=action, reason=reason))
acc = pd.DataFrame(rows).sort_values(["ring_id", "final_score"], ascending=[False, False])
acc.sort_values("final_score", ascending=False).to_csv("outputs/accounts_final.csv", index=False)
json.dump(rings, open("outputs/rings.json", "w"), indent=2)

# ---------- 4. diagram (rings in red, innocent shared groups in grey) ----------
from pyvis.network import Network
net = Network(height="750px", width="100%", bgcolor="#ffffff", cdn_resources="in_line")
for comp in nx.connected_components(G):
    members = accounts_in(comp)
    if len(members) < 2:
        continue
    in_ring = any(a in ring_of for a in members)
    for node in comp:
        kind, name = node.split(":", 1)
        if kind == "acc":
            net.add_node(node, label=name, shape="dot", size=14,
                         color="#d62728" if name in ring_of else "#9aa0a6",
                         title=f"{name}: {acc.set_index('account_id').loc[name, 'action']}")
        elif kind == "dev":
            net.add_node(node, label=name, shape="square", size=16, color="#ff9f1c")
        else:
            net.add_node(node, label=name, shape="diamond", size=20, color="#6f42c1")
    for u, v in G.subgraph(comp).edges():
        net.add_edge(u, v, color="#d62728" if in_ring else "#c8c8c8")
Path("outputs/ring_graph.html").write_text(net.generate_html(), encoding="utf-8")

# ---------- summary ----------
print(f"Detected {len(rings)} ring(s)")
for r in rings:
    print(f"  {r['ring_id']} score={r['ring_score']}: {r['pattern']}")
print(acc.action.str.split(" ").str[0].value_counts().to_string())
print("saved outputs/rings.json, outputs/accounts_final.csv, outputs/ring_graph.html")