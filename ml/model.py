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

    feature_row = extract_domain_features(domain)
    frame = pd.DataFrame([feature_row.__dict__])

    predicted_value = float(pipeline.predict(frame)[0])
    predicted_value = round(max(predicted_value, 0.0), 2)

    preprocessor = pipeline.named_steps["preprocessor"]
    regressor = pipeline.named_steps["regressor"]
    transformed = preprocessor.transform(frame)
    tree_predictions = np.asarray(
        [estimator.predict(transformed)[0] for estimator in regressor.estimators_],
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
        },
    }
