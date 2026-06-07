"""FastAPI service that exposes the domain valuation model over HTTP.

The model bundle is loaded once at startup (memoized in ml.model), so each
request is fast. Run locally with:

    ./.venv/bin/uvicorn ml.server:app --host 0.0.0.0 --port 8000

In production (Render), the start command is the same; bind to $PORT.
"""

from __future__ import annotations

import sys
from pathlib import Path

if __package__ in {None, ""}:
    sys.path.append(str(Path(__file__).resolve().parents[1]))

from fastapi import FastAPI
from pydantic import BaseModel

from ml.model import load_model_bundle, predict_domain_value

app = FastAPI(title="DomainFlip ML", version="1.0.0")


class PredictRequest(BaseModel):
    domain: str


@app.on_event("startup")
def _warm_model() -> None:
    # Preload the bundle so the first real request is not slow.
    try:
        load_model_bundle()
    except Exception:
        # Let /health surface the problem instead of crashing the process.
        pass


@app.get("/health")
def health() -> dict[str, object]:
    try:
        load_model_bundle()
        return {"status": "ok", "model": "loaded"}
    except Exception as error:  # noqa: BLE001
        return {"status": "degraded", "error": str(error)}


@app.post("/predict")
def predict(request: PredictRequest) -> dict[str, object]:
    domain = (request.domain or "").strip()
    if not domain:
        return {"error": "Missing domain"}
    try:
        return predict_domain_value(domain)
    except Exception as error:  # noqa: BLE001
        # Mirror predict.py: an error object lets the Node caller fall back cleanly.
        return {"error": str(error)}
