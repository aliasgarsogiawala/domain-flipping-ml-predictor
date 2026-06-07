from __future__ import annotations

from pathlib import Path
from typing import Any
import sys

if __package__ in {None, ""}:
    sys.path.append(str(Path(__file__).resolve().parents[1]))

import joblib
import numpy as np
import pandas as pd

from ml.features import extract_domain_features

MODEL_PATH = Path(__file__).resolve().parent / "domain_value_model.pkl"
MAX_REASONABLE_PREDICTION_USD = 10_000_000.0


def _safe_inverse_transform(value: float, transform: str | None) -> float:
    if transform == "log1p":
        clipped = float(np.clip(value, 0.0, np.log1p(MAX_REASONABLE_PREDICTION_USD)))
        result = float(np.expm1(clipped))
    else:
        result = float(value)

    if not np.isfinite(result):
        return 0.0

    return float(np.clip(result, 0.0, MAX_REASONABLE_PREDICTION_USD))


def _confidence_from_tree_dispersion(expected_value: float, tree_predictions: np.ndarray) -> str:
    if expected_value <= 0 or len(tree_predictions) == 0:
        return "Low"

    std_dev = float(np.std(tree_predictions))
    relative_dispersion = std_dev / max(expected_value, 1.0)

    if relative_dispersion <= 0.2:
        return "High"
    if relative_dispersion <= 0.45:
        return "Medium"
    return "Low"


def load_model_bundle(model_path: Path | str = MODEL_PATH) -> dict[str, Any]:
    path = Path(model_path)
    if not path.exists():
        raise FileNotFoundError(
            f"Trained model not found at {path}. Run `python3 ml/train.py` first."
        )
    return joblib.load(path)


def predict_domain_value(domain: str, model_path: Path | str = MODEL_PATH) -> dict[str, Any]:
    bundle = load_model_bundle(model_path)
    pipeline = bundle["pipeline"]
    target_transform = bundle.get("target_transform")

    feature_row = extract_domain_features(domain)
    frame = pd.DataFrame([feature_row.__dict__])

    predicted_value = round(
        _safe_inverse_transform(float(pipeline.predict(frame)[0]), target_transform),
        2,
    )

    preprocessor = pipeline.named_steps["preprocessor"]
    regressor = pipeline.named_steps["regressor"]
    transformed = preprocessor.transform(frame)
    tree_predictions = np.asarray(
        [
            _safe_inverse_transform(float(estimator.predict(transformed)[0]), target_transform)
            for estimator in regressor.estimators_
        ],
        dtype=float,
    )

    return {
        "predictedValueUsd": predicted_value,
        "confidence": _confidence_from_tree_dispersion(predicted_value, tree_predictions),
        "extractedFeatures": {
            "domain": feature_row.domain,
            "tld": feature_row.tld,
            "domainLength": feature_row.domain_length,
            "wordCount": feature_row.word_count,
            "containsNumber": feature_row.contains_number,
            "containsHyphen": feature_row.contains_hyphen,
            "premiumKeywordCount": feature_row.premium_keyword_count,
            "estimatedBrandabilityScore": feature_row.estimated_brandability_score,
            "tldTierScore": feature_row.tld_tier_score,
            "vowelRatio": feature_row.vowel_ratio,
            "uniqueCharRatio": feature_row.unique_char_ratio,
            "startsWithPremiumKeyword": feature_row.starts_with_premium_keyword,
            "endsWithPremiumKeyword": feature_row.ends_with_premium_keyword,
            "exactMatchBias": feature_row.exact_match_bias,
            "pronounceabilityScore": feature_row.pronounceability_score,
            "shortPremiumSignal": feature_row.short_premium_signal,
            "tokenBalanceScore": feature_row.token_balance_score,
            "repeatedCharPenalty": feature_row.repeated_char_penalty,
            "categoryHint": feature_row.category_hint,
        },
    }
