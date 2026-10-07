from __future__ import annotations

from fastapi import APIRouter, HTTPException, Request

from backend.app.schemas.transaction import TransactionRequest

router = APIRouter()


@router.get("/api/transactions")
def list_transactions(request: Request):
    try:
        return request.app.state.fraud_service.list_transactions()
    except Exception as exc:  # pragma: no cover - defensive
        raise HTTPException(status_code=500, detail=f"Unable to fetch transactions: {exc}") from exc


@router.get("/api/transactions/{transaction_id}")
def get_transaction(transaction_id: str, request: Request):
    result = request.app.state.fraud_service.find_transaction(transaction_id)
    if result is None:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return result


@router.post("/api/transactions")
def create_transaction(payload: TransactionRequest, request: Request):
    try:
        return request.app.state.fraud_service.score_transaction(payload.model_dump())
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:  # pragma: no cover - defensive
        raise HTTPException(status_code=500, detail=f"Unable to process transaction: {exc}") from exc
