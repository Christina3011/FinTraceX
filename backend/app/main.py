from __future__ import annotations

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware

from backend.app.routes.transactions import router as transactions_router
from backend.app.services.feature_service import FEATURES
from backend.app.services.fraud_service import FraudService

app = FastAPI(title="FinTraceX Fraud Intelligence API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:8443"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.state.fraud_service = FraudService()
app.include_router(transactions_router)


@app.get("/api/health")
def health() -> dict[str, object]:
    service = getattr(app.state, "fraud_service", None)
    return {"status": "ok", "model_loaded": bool(service is not None and getattr(service, "model", None) is not None)}


@app.get("/api/dashboard/summary")
def dashboard_summary(request: Request) -> dict[str, object]:
    service = request.app.state.fraud_service
    transactions = service.list_transactions()
    total = len(transactions)
    flagged = sum(1 for item in transactions if item.get("is_fraud"))
    avg_risk = round(sum(item.get("risk_score", 0.0) for item in transactions) / total, 2) if total else 0.0
    risk_distribution = {
        level: sum(1 for item in transactions if item.get("risk_level") == level)
        for level in ("LOW", "MEDIUM", "HIGH", "CRITICAL")
    }
    return {
        "total_transactions": total,
        "flagged_transactions": flagged,
        "suspicious_transactions": flagged,
        "high_risk_transactions": sum(1 for item in transactions if item.get("risk_score", 0.0) >= 60),
        "average_risk_score": avg_risk,
        "critical_count": risk_distribution["CRITICAL"],
        "risk_distribution": risk_distribution,
        "active_investigations": len(service.list_investigations()),
        "fraud_rings": len(service.list_fraud_rings()),
    }


@app.get("/api/dashboard/alerts")
def dashboard_alerts(request: Request):
    transactions = request.app.state.fraud_service.list_transactions()
    flagged = [item for item in transactions if item.get("is_fraud")]
    return [
        {
            "transaction_id": item["transaction_id"],
            "account_id": item["account_id"],
            "risk_score": item["risk_score"],
            "risk_level": item["risk_level"],
            "fraud_probability": item["fraud_probability"],
            "reasons": item["reasons"],
            "recommended_action": item["recommended_action"],
        }
        for item in flagged[:10]
    ]


@app.get("/api/dashboard/priority-signals")
def dashboard_priority_signals(request: Request):
    transactions = request.app.state.fraud_service.list_transactions()
    ranked = [
        item for item in sorted(transactions, key=lambda item: item.get("risk_score", 0), reverse=True)
        if item.get("risk_score", 0) >= 30
    ][:5]
    return [
        {
            "transaction_id": item["transaction_id"],
            "account_id": item["account_id"],
            "risk_score": item["risk_score"],
            "risk_level": item["risk_level"],
            "fraud_probability": item["fraud_probability"],
            "reason": item["reasons"][0] if item.get("reasons") else "",
            "recommended_action": item["recommended_action"],
        }
        for item in ranked
    ]


@app.get("/api/model/metrics")
def model_metrics(request: Request):
    service = request.app.state.fraud_service
    return {
        "model_type": "XGBClassifier",
        "threshold": service.threshold,
        "feature_count": len(FEATURES),
        "status": "trained",
    }


@app.get("/api/model/features")
def model_features() -> dict[str, object]:
    return {"features": FEATURES}


@app.get("/api/accounts")
def accounts(request: Request):
    return request.app.state.fraud_service.list_accounts()


@app.get("/api/accounts/{account_id}")
def get_account(account_id: str, request: Request):
    account = request.app.state.fraud_service.get_account(account_id)
    if account is None:
        raise HTTPException(status_code=404, detail="Account not found")
    return account


@app.get("/api/fraud-rings")
def fraud_rings(request: Request):
    return request.app.state.fraud_service.list_fraud_rings()


@app.get("/api/fraud-rings/{ring_id}")
def get_ring(ring_id: str, request: Request):
    ring = request.app.state.fraud_service.get_fraud_ring(ring_id)
    if ring is None:
        raise HTTPException(status_code=404, detail="Ring not found")
    return ring


@app.get("/api/investigations")
def investigations(request: Request):
    return {"investigations": request.app.state.fraud_service.list_investigations()}


@app.get("/api/investigations/{investigation_id}")
def get_investigation(investigation_id: str, request: Request):
    investigation = request.app.state.fraud_service.get_investigation(investigation_id)
    if investigation is None:
        raise HTTPException(status_code=404, detail="Investigation not found")
    return investigation


@app.get("/api/graph/{entity_id}")
def graph_view(entity_id: str, request: Request):
    history = request.app.state.fraud_service.history
    matches = history[history["account_id"].astype(str) == entity_id]
    if matches.empty:
        return {"detail": "Entity not found"}
    return {
        "entity_id": entity_id,
        "connected_accounts": sorted(matches["account_id"].astype(str).unique().tolist()),
        "transactions": int(len(matches)),
    }
