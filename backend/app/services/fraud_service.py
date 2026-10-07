from __future__ import annotations

import json
import math
from pathlib import Path
from typing import Any

import pandas as pd
import xgboost as xgb
import networkx as nx

from backend.app.services.feature_service import CAT_COLS, FEATURES, build_feature_frame, build_transaction_features
from backend.app.services.graph_service import build_graph, get_network_context
from backend.app.services.risk_engine import build_reasons, recommended_action, score_to_risk_level


class FraudService:
    def __init__(self, repo_root: Path | None = None):
        self.repo_root = repo_root or Path(__file__).resolve().parents[3]
        self.model_path = self.repo_root / "outputs" / "model.json"
        self.history_path = self.repo_root / "data" / "transactions.csv"
        self.scores_path = self.repo_root / "outputs" / "scores.csv"
        self.accounts_final_path = self.repo_root / "outputs" / "accounts_final.csv"
        self.rings_path = self.repo_root / "outputs" / "rings.json"
        self.account_scores_path = self.repo_root / "outputs" / "account_scores.csv"
        self.threshold = 0.436
        self.model = xgb.XGBClassifier()
        self.model.load_model(str(self.model_path))
        self.history = self._load_history()
        self.category_vocab = {
            column: self.history[column].astype(str).value_counts().index.tolist()
            for column in CAT_COLS
        }

    def _load_history(self) -> pd.DataFrame:
        history = pd.read_csv(self.history_path, parse_dates=["timestamp"])
        history = build_feature_frame(history)
        history["txn_id"] = history["txn_id"].astype(str)
        if self.scores_path.exists():
            scores = pd.read_csv(self.scores_path, dtype={"txn_id": str})
            score_columns = ["txn_id", "risk_score", "flagged", "reasons"]
            history = history.drop(columns=["risk_score"], errors="ignore").merge(
                scores[score_columns], on="txn_id", how="left", validate="one_to_one"
            )
            history["fraud_probability"] = pd.to_numeric(history["risk_score"], errors="coerce").fillna(0.0)
            history["risk_score"] = history["fraud_probability"] * 100
            history["is_fraud"] = history["flagged"].fillna(False).astype(bool)
            history["reasons"] = history["reasons"].fillna("")
        else:
            history["risk_score"] = 0.0
            history["fraud_probability"] = 0.0
            history["is_fraud"] = False
            history["reasons"] = ""
        history["risk_level"] = history["risk_score"].map(score_to_risk_level)
        history["recommended_action"] = history.apply(
            lambda row: recommended_action(
                float(row["fraud_probability"]), float(row["risk_score"]), None
            ),
            axis=1,
        )
        if self.accounts_final_path.exists():
            final_accounts = pd.read_csv(self.accounts_final_path, dtype={"account_id": str})
            account_actions = final_accounts.set_index("account_id")["action"].to_dict()
            flagged_rows = history["is_fraud"].astype(bool)
            history.loc[flagged_rows, "recommended_action"] = history.loc[flagged_rows, "account_id"].astype(str).map(account_actions).fillna(
                history.loc[flagged_rows, "recommended_action"]
            )
        return history.sort_values(["timestamp", "txn_id"]).reset_index(drop=True)

    def _next_transaction_id(self) -> str:
        existing_ids = [str(value) for value in self.history.get("txn_id", []).dropna().tolist() if str(value).startswith("TXN")]
        if not existing_ids:
            return "TXN-LIVE-00001"
        numbers = []
        for item in existing_ids:
            try:
                numbers.append(int(item.rsplit("-", 1)[-1]))
            except ValueError:
                continue
        next_index = max(numbers, default=0) + 1
        return f"TXN-LIVE-{next_index:05d}"

    def list_transactions(self) -> list[dict[str, Any]]:
        records = self.history.fillna("unknown").to_dict(orient="records")
        return [self._serialize_record(record) for record in records]

    @staticmethod
    def _sanitize_value(value: Any) -> Any:
        if value is None:
            return None
        if isinstance(value, pd.Timestamp):
            return value.isoformat()
        if isinstance(value, float) and math.isnan(value):
            return None
        if isinstance(value, str):
            cleaned = value.strip()
            return cleaned if cleaned else None
        if isinstance(value, list):
            return [FraudService._sanitize_value(item) for item in value]
        if isinstance(value, dict):
            return {key: FraudService._sanitize_value(item) for key, item in value.items()}
        return value

    def _serialize_record(self, record: dict[str, Any]) -> dict[str, Any]:
        sanitized = {key: self._sanitize_value(value) for key, value in record.items()}
        timestamp = sanitized.get("timestamp")
        if hasattr(timestamp, "isoformat"):
            timestamp_value = timestamp.isoformat()
        elif timestamp is None:
            timestamp_value = None
        else:
            timestamp_value = str(timestamp)
        reasons = sanitized.get("reasons")
        if reasons is None:
            reasons_list = []
        elif isinstance(reasons, str):
            reasons_list = [item.strip() for item in reasons.split(";") if item.strip()]
        else:
            reasons_list = [str(item).strip() for item in reasons if str(item).strip()]
        return {
            "transaction_id": sanitized.get("txn_id"),
            "account_id": sanitized.get("account_id"),
            "merchant": sanitized.get("merchant"),
            "item": sanitized.get("item"),
            "location": sanitized.get("location"),
            "device_id": sanitized.get("device_id"),
            "timestamp": timestamp_value,
            "amount": float(sanitized.get("amount") or 0.0),
            "risk_score": float(sanitized.get("risk_score") or 0.0),
            "risk_level": sanitized.get("risk_level") or "LOW",
            "fraud_probability": float(sanitized.get("fraud_probability") or 0.0),
            "is_fraud": bool(sanitized.get("is_fraud", False)),
            "reasons": reasons_list,
            "recommended_action": sanitized.get("recommended_action") or "NO ACTION",
            "payout_account": sanitized.get("payout_account"),
        }

    def find_transaction(self, transaction_id: str) -> dict[str, Any] | None:
        for record in self.history.to_dict(orient="records"):
            if str(record.get("txn_id")) == transaction_id:
                transaction = self._serialize_record(record)
                graph_context = get_network_context(self.history, record)
                graph_context["fraud_ring"] = self._saved_ring_context(str(record.get("account_id", "")))
                transaction.update({
                    "connected_accounts": graph_context.get("connected_accounts", []),
                    "shared_devices": graph_context.get("shared_devices", []),
                    "shared_payout_accounts": graph_context.get("shared_payout_accounts", []),
                    "fraud_ring": graph_context.get("fraud_ring"),
                })
                return transaction
        return None

    def list_accounts(self) -> list[dict[str, Any]]:
        account_rows = self.history.groupby("account_id", dropna=False).agg(
            transaction_count=("txn_id", "count"),
            risk_score=("risk_score", "max"),
            flagged_events=("is_fraud", "sum"),
            latest_timestamp=("timestamp", "max"),
        ).reset_index()

        ring_map = {}
        if self.rings_path.exists():
            rings = json.loads(self.rings_path.read_text())
            for ring in rings:
                for member in ring.get("accounts", []):
                    ring_map[str(member)] = ring["ring_id"]

        score_map = {}
        if self.account_scores_path.exists():
            scores = pd.read_csv(self.account_scores_path)
            for row in scores.to_dict(orient="records"):
                score_map[str(row["account_id"])] = {
                    "account_score": float(row.get("account_score", 0.0)),
                    "flagged_txns": int(row.get("flagged_txns", 0)),
                }
        action_map = {}
        if self.accounts_final_path.exists():
            final_accounts = pd.read_csv(self.accounts_final_path)
            for row in final_accounts.to_dict(orient="records"):
                action_map[str(row["account_id"])] = {
                    "action": str(row.get("action", "MONITOR")),
                    "final_score": float(row.get("final_score", 0.0)),
                    "reason": str(row.get("reason", "")),
                }

        graph = build_graph(self.history)
        graph_context: dict[str, dict[str, list[str]]] = {}
        for account_id in account_rows["account_id"].astype(str):
            account_node = f"acc:{account_id}"
            if account_node not in graph:
                graph_context[account_id] = {"connected_accounts": [], "devices": [], "payout_accounts": []}
                continue
            direct_entities = set(graph.neighbors(account_node))
            connected_accounts = {
                neighbor
                for entity in direct_entities
                for neighbor in graph.neighbors(entity)
                if neighbor.startswith("acc:") and neighbor != account_node
            }
            graph_context[account_id] = {
                "connected_accounts": sorted(node[4:] for node in connected_accounts),
                "devices": sorted(node[4:] for node in direct_entities if node.startswith("dev:")),
                "payout_accounts": sorted(node[4:] for node in direct_entities if node.startswith("pay:")),
            }

        accounts = []
        for row in account_rows.to_dict(orient="records"):
            account_id = str(row["account_id"])
            score = score_map.get(account_id, {})
            final = action_map.get(account_id, {})
            flagged = int(row["flagged_events"])
            risk_score = float(row["risk_score"] or 0.0)
            account_risk = max(risk_score, float(score.get("account_score", 0.0)) * 100, float(final.get("final_score", 0.0)) * 100)
            action = final.get("action")
            status = "FROZEN" if ring_map.get(account_id) else (action or ("UNDER INVESTIGATION" if flagged > 0 else "MONITORING"))
            relationships = graph_context.get(account_id, {})
            accounts.append({
                "account_id": account_id,
                "risk_score": round(account_risk, 2),
                "risk_level": score_to_risk_level(account_risk),
                "transaction_count": int(row["transaction_count"]),
                "high_risk_transactions": max(flagged, int(score.get("flagged_txns", 0))),
                "flagged_events": max(flagged, int(score.get("flagged_txns", 0))),
                "status": status,
                "recommended_action": action or status,
                "reason": final.get("reason", ""),
                "ring_id": ring_map.get(account_id),
                "connected_accounts": relationships.get("connected_accounts", []),
                "connected_devices": relationships.get("devices", []),
                "payout_accounts": relationships.get("payout_accounts", []),
                "latest_timestamp": row["latest_timestamp"].isoformat() if pd.notna(row.get("latest_timestamp")) else None,
            })
        return sorted(accounts, key=lambda item: (item["risk_score"], item["transaction_count"]), reverse=True)

    def get_account(self, account_id: str) -> dict[str, Any] | None:
        for account in self.list_accounts():
            if account["account_id"] == account_id:
                return self._account_detail(account)
        return None

    def _account_detail(self, account: dict[str, Any]) -> dict[str, Any]:
        account_id = account["account_id"]
        account_rows = self.history[self.history["account_id"].astype(str) == account_id].sort_values("timestamp")
        return {
            **account,
            "flagged_events": account["high_risk_transactions"],
            "connections": {
                "connected_accounts": account["connected_accounts"],
                "devices": account["connected_devices"],
                "payout_accounts": account["payout_accounts"],
            },
            "recent_transactions": [self._serialize_record(row) for row in account_rows.tail(10).to_dict(orient="records")],
        }

    def list_fraud_rings(self) -> list[dict[str, Any]]:
        if not self.rings_path.exists():
            return []
        rings = json.loads(self.rings_path.read_text())
        for ring in rings:
            ring["member_count"] = len(ring.get("accounts", []))
            ring["account_ids"] = [str(item) for item in ring.get("accounts", [])]
        return rings

    def _saved_ring_context(self, account_id: str) -> dict[str, Any] | None:
        for ring in self.list_fraud_rings():
            if account_id in ring.get("account_ids", []):
                signals = ring.get("signals", {})
                return {
                    "ring_id": ring["ring_id"],
                    "members": ring.get("account_ids", []),
                    "shared_devices": ring.get("shared_devices", []),
                    "shared_payout_accounts": ring.get("shared_payout_accounts", []),
                    "signal_count": sum(bool(value) for value in signals.values()),
                    "pattern": ring.get("pattern", ""),
                    "ring_score": ring.get("ring_score", 0.0),
                    "action": ring.get("action", ""),
                }
        return None

    def get_fraud_ring(self, ring_id: str) -> dict[str, Any] | None:
        for ring in self.list_fraud_rings():
            if str(ring.get("ring_id")) == str(ring_id):
                accounts_by_id = {account["account_id"]: account for account in self.list_accounts()}
                return {
                    **ring,
                    "member_accounts": [
                        self._account_detail(accounts_by_id[member])
                        for member in ring["account_ids"]
                        if member in accounts_by_id
                    ],
                }
        return None

    def list_investigations(self) -> list[dict[str, Any]]:
        investigations = []
        for account in self.list_accounts():
            if account["flagged_events"] == 0 and not account["ring_id"]:
                continue
            account_id = account["account_id"]
            account_rows = self.history[self.history["account_id"].astype(str) == account_id].sort_values("risk_score", ascending=False)
            top_txn = account_rows.iloc[0].to_dict() if not account_rows.empty else {}
            top_reason = top_txn.get("reasons") or ""
            investigation_id = f"INV-{account_id}"
            transactions = account_rows[account_rows["is_fraud"].astype(bool)]
            if transactions.empty:
                transactions = account_rows.head(1)
            lead_transaction = transactions.sort_values("risk_score", ascending=False).iloc[0] if not transactions.empty else top_txn
            investigations.append({
                "investigation_id": investigation_id,
                "account_id": account_id,
                "transaction_id": str(lead_transaction.get("txn_id", "")),
                "ring_id": account["ring_id"],
                "risk_score": float(account["risk_score"]),
                "status": account["status"],
                "flagged_transactions": int(account["flagged_events"]),
                "top_reason": top_reason,
                "recommended_action": account["recommended_action"],
                "last_activity": account["latest_timestamp"],
            })
        return sorted(investigations, key=lambda item: item["risk_score"], reverse=True)

    def get_investigation(self, investigation_id: str) -> dict[str, Any] | None:
        for investigation in self.list_investigations():
            if investigation["investigation_id"] == investigation_id:
                account_id = investigation["account_id"]
                account = self.get_account(account_id)
                if account is None:
                    return None
                account_transactions = self.history[self.history["account_id"].astype(str) == account_id]
                flagged = account_transactions[account_transactions["is_fraud"].astype(bool)].sort_values("timestamp")
                if flagged.empty:
                    flagged = account_transactions.sort_values("timestamp").tail(1)
                timeline = [
                    {
                        "timestamp": row["timestamp"].isoformat(),
                        "transaction_id": str(row["txn_id"]),
                        "event": "Model threshold crossed" if bool(row["is_fraud"]) else "Highest-risk transaction",
                        "risk_score": float(row["risk_score"]),
                        "description": str(row["reasons"] or row["recommended_action"]),
                    }
                    for row in flagged.tail(20).to_dict(orient="records")
                ]
                return {
                    **investigation,
                    "account": account,
                    "connected_entities": account["connections"],
                    "recommendation": account["recommended_action"],
                    "timeline": timeline,
                    "transactions": [self._serialize_record(row) for row in account_transactions[account_transactions["is_fraud"].astype(bool)].sort_values("risk_score", ascending=False).head(10).to_dict(orient="records")],
                }
        return None

    def score_transaction(self, payload: dict[str, Any]) -> dict[str, Any]:
        payload = dict(payload)
        payload["timestamp"] = pd.to_datetime(payload["timestamp"], utc=True).tz_localize(None)
        payload["transaction_type"] = payload.get("transaction_type") or "payment"
        payload["merchant"] = str(payload.get("merchant") or "unknown")
        payload["location"] = str(payload.get("location") or "unknown")
        payload["device_id"] = str(payload.get("device_id") or "unknown")
        payload["account_id"] = str(payload.get("account_id") or "unknown")
        payload["item"] = str(payload.get("item") or "misc")
        if payload.get("payout_account") is None or str(payload.get("payout_account")).strip() == "":
            payload["payout_account"] = None

        feature_frame = build_transaction_features(self.history, payload, self.category_vocab)
        probability = float(self.model.predict_proba(feature_frame)[0, 1])
        risk_score = round(probability * 100, 2)
        is_fraud = bool(probability >= self.threshold)
        contribution_values = self.model.get_booster().predict(xgb.DMatrix(feature_frame[FEATURES], enable_categorical=True), pred_contribs=True)[:, :-1][0]
        reasons = build_reasons(feature_frame.iloc[0].to_dict(), contribution_values, FEATURES)

        transaction_id = self._next_transaction_id()
        timestamp = pd.to_datetime(payload["timestamp"])
        candidate = {
            "txn_id": transaction_id,
            "account_id": payload["account_id"],
            "amount": float(payload["amount"]),
            "merchant": payload["merchant"],
            "item": payload["item"],
            "location": payload["location"],
            "device_id": payload["device_id"],
            "payout_account": payload.get("payout_account"),
            "timestamp": timestamp,
            "amount_ratio": float(feature_frame["amount_ratio"].iloc[0]),
            "hour": int(feature_frame["hour"].iloc[0]),
            "new_device": int(feature_frame["new_device"].iloc[0]),
            "new_location": int(feature_frame["new_location"].iloc[0]),
            "txn_last_hour": int(feature_frame["txn_last_hour"].iloc[0]),
            "accounts_per_device": int(feature_frame["accounts_per_device"].iloc[0]),
            "accounts_per_payout": int(feature_frame["accounts_per_payout"].iloc[0]),
            "risk_score": risk_score,
            "fraud_probability": probability,
            "is_fraud": is_fraud,
            "reasons": "; ".join(reasons),
            "recommended_action": "NO ACTION",
            "risk_level": score_to_risk_level(risk_score),
            "transaction_type": payload["transaction_type"],
        }

        graph_context = get_network_context(self.history, candidate)
        graph_context["fraud_ring"] = self._saved_ring_context(payload["account_id"])
        ring = graph_context.get("fraud_ring")
        action = recommended_action(probability, risk_score, ring)
        candidate["recommended_action"] = action
        candidate["risk_level"] = score_to_risk_level(risk_score)

        self.history = pd.concat([self.history, pd.DataFrame([candidate])], ignore_index=True)
        self.history = self.history.sort_values(["timestamp", "txn_id"]).reset_index(drop=True)
        self.category_vocab = {
            column: self.history[column].astype(str).value_counts().index.tolist()
            for column in CAT_COLS
        }

        response = {
            "transaction_id": transaction_id,
            "account_id": payload["account_id"],
            "amount": float(payload["amount"]),
            "merchant": payload["merchant"],
            "item": payload["item"],
            "location": payload["location"],
            "device_id": payload["device_id"],
            "timestamp": timestamp.isoformat(),
            "risk_score": risk_score,
            "risk_level": score_to_risk_level(risk_score),
            "fraud_probability": probability,
            "is_fraud": is_fraud,
            "reasons": reasons,
            "recommended_action": action,
            "connected_accounts": graph_context.get("connected_accounts", []),
            "shared_devices": graph_context.get("shared_devices", []),
            "shared_payout_accounts": graph_context.get("shared_payout_accounts", []),
            "fraud_ring": ring,
        }
        return response
