from __future__ import annotations

from typing import Any

import networkx as nx
import pandas as pd


def build_graph(frame: pd.DataFrame) -> nx.Graph:
    graph = nx.Graph()
    for row in frame[["account_id", "device_id", "payout_account"]].drop_duplicates().itertuples(index=False):
        if pd.notna(row.account_id) and pd.notna(row.device_id):
            graph.add_edge(f"acc:{row.account_id}", f"dev:{row.device_id}")
        if pd.notna(row.account_id) and pd.notna(row.payout_account):
            graph.add_edge(f"acc:{row.account_id}", f"pay:{row.payout_account}")
    return graph


def _accounts_in(nodes: set[str]) -> list[str]:
    return sorted(node[4:] for node in nodes if node.startswith("acc:"))


def _node_ids(component: set[str]) -> dict[str, list[str]]:
    return {
        "accounts": _accounts_in(component),
        "devices": sorted(node[4:] for node in component if node.startswith("dev:")),
        "payouts": sorted(node[4:] for node in component if node.startswith("pay:")),
    }


def get_network_context(history: pd.DataFrame, candidate: dict[str, Any] | None = None) -> dict[str, Any]:
    working = history.copy()
    if candidate is not None:
        working = pd.concat([working, pd.DataFrame([candidate])], ignore_index=True)
    graph = build_graph(working)
    account_id = candidate.get("account_id") if candidate else None
    if not account_id:
        return {"connected_accounts": [], "shared_devices": [], "shared_payout_accounts": [], "fraud_ring": None}

    account_key = f"acc:{account_id}"
    if account_key not in graph:
        return {"connected_accounts": [], "shared_devices": [], "shared_payout_accounts": [], "fraud_ring": None}

    component = graph.subgraph(nx.node_connected_component(graph, account_key)).copy()
    nodes = _node_ids(set(component.nodes()))
    connected_accounts = sorted({account for account in nodes["accounts"] if account != account_id})
    ring = detect_ring(working, account_id)
    return {
        "connected_accounts": connected_accounts,
        "shared_devices": nodes["devices"],
        "shared_payout_accounts": nodes["payouts"],
        "fraud_ring": ring,
    }


def detect_ring(history: pd.DataFrame, account_id: str) -> dict[str, Any] | None:
    if account_id is None or account_id == "":
        return None
    graph = build_graph(history)
    account_key = f"acc:{account_id}"
    if account_key not in graph:
        return None
    component = graph.subgraph(nx.node_connected_component(graph, account_key)).copy()
    members = _accounts_in(set(component.nodes()))
    if len(members) < 3:
        return None
    flagged = history[history["account_id"].astype(str).isin(members)]
    flagged_members = sorted(flagged[flagged.get("is_fraud", False) if "is_fraud" in flagged.columns else False].account_id.astype(str).unique()) if not flagged.empty else []
    if "is_fraud" not in flagged.columns:
        flagged_members = []
    s1 = len(flagged_members) >= 3 and (len(flagged_members) / len(members)) >= 0.5
    shared_payouts = [node[4:] for node in component.nodes() if node.startswith("pay:") and any(n.startswith("acc:") for n in component.neighbors(node))]
    s2 = bool(shared_payouts)
    shared_devices = [node[4:] for node in component.nodes() if node.startswith("dev:") and any(n.startswith("acc:") for n in component.neighbors(node))]
    s3 = len(shared_devices) >= 2
    signals = int(s1) + int(s2) + int(s3)
    if signals < 2:
        return None
    ring_id = f"R-{len(history['account_id'].dropna().unique()) % 100 + 1:02d}"
    return {
        "ring_id": ring_id,
        "members": members,
        "shared_devices": sorted(set(shared_devices)),
        "shared_payout_accounts": sorted(set(shared_payouts)),
        "signal_count": signals,
        "pattern": "shared device and payout convergence",
    }
