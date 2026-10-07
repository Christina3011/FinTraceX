from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, Field


class TransactionRequest(BaseModel):
    amount: float = Field(..., gt=0)
    account_id: str = Field(..., min_length=1)
    merchant: str = Field(..., min_length=1)
    item: str = Field(default="misc")
    location: str = Field(..., min_length=1)
    device_id: str = Field(..., min_length=1)
    timestamp: str = Field(..., min_length=1)
    transaction_type: Optional[str] = "payment"
    payout_account: Optional[str] = None

    @property
    def normalized_merchant(self) -> str:
        return self.merchant.strip() or "unknown"

    @property
    def normalized_location(self) -> str:
        return self.location.strip() or "unknown"


class TransactionResponse(BaseModel):
    transaction_id: str
    account_id: str
    amount: float
    merchant: str
    item: str
    location: str
    device_id: str
    timestamp: str
    risk_score: float
    risk_level: str
    fraud_probability: float
    is_fraud: bool
    reasons: list[str]
    recommended_action: str
    connected_accounts: list[str]
    shared_devices: list[str]
    shared_payout_accounts: list[str]
    fraud_ring: Optional[dict] = None
