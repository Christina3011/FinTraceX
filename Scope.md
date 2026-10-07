# Scope Note: FinTraceX (HNX26PSI04)

This note separates the minimum viable solution we implemented from stretch goals.

## Minimum viable solution (implemented)

| Item | File |
|---|---|
| Simulated transaction data with a fraud ring, lone fraud, legitimate high-value purchases and innocent shared devices | `simulate_data.py` |
| Behaviour and ring-signal features | `features.py` |
| XGBoost risk score for every transaction, with a threshold chosen on validation data to target at least 90% precision | `train.py` |
| Logistic Regression baseline for comparison | `train.py` |
| Plain-English SHAP explanation for flagged transactions | `train.py` |
| Graph of accounts, devices and payout accounts, and ring detection with a false-ring filter | `rings.py` |
| Account risk score, reason and recommended action | `rings.py` |
| Pattern sentence and evidence for each ring | `rings.py`, `outputs/rings.json` |
| Connection diagram | `outputs/ring_graph.html` |
| Frontend | Not included in this repository; owned separately by the frontend team |
| Measurement against generated synthetic ground truth | `check_ground_truth.py` |

## Stretch goals

| Item | Status |
|---|---|
| Connection diagram highlighting the ring | Done |
| Test on a second dataset (PaySim) | Not implemented |
| Isolation Forest for new, unseen fraud patterns | Not done |
| Account behaviour drift (accounts that change behaviour over time) | Not done |
| Reducing false positives on legitimate high-value purchases | Partially addressed by validation-based threshold selection; some decoys may still be flagged |
| Comparison with other models (CatBoost, LightGBM) | Not done, XGBoost chosen as the single main model |

## Known limitations

- All results are on simulated data.
- Ring detection relies on shared devices and shared payout accounts. A ring that avoids sharing them would be missed.
- A few legitimate high-value purchases can still be flagged.
- This is a batch prototype, not a real-time production service; actions such as freezing accounts are recommendations, not executed operations.

## Resources used

- Data: simulated by `simulate_data.py` (seed 42)
- Libraries: pandas, numpy, scikit-learn, xgboost, shap, networkx, pyvis
- AI assistance (Claude) was used for planning and code drafting. The team reviewed and understands all code.

`data/ground_truth.json` is generated alongside the synthetic transactions for evaluation by `check_ground_truth.py`; it is not a production input to the model.