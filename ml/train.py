from __future__ import annotations

from pathlib import Path
from typing import Any
import sys

if __package__ in {None, ""}:
    sys.path.append(str(Path(__file__).resolve().parents[1]))

import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestRegressor
from sklearn.impute import SimpleImputer
from sklearn.metrics import mean_absolute_error
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder

from ml.features import build_feature_frame, normalize_domain, split_domain_parts
from ml.model import MODEL_PATH

RAW_DATA_DIR = Path(__file__).resolve().parents[1] / "data" / "raw"

TARGET_COLUMN = "price_usd"
DOMAIN_COLUMN = "domain"

NUMERIC_FEATURES = [
    "domain_length",
    "word_count",
    "contains_number",
    "contains_hyphen",
    "premium_keyword_count",
    "estimated_brandability_score",
    "tld_tier_score",
    "vowel_ratio",
    "unique_char_ratio",
    "starts_with_premium_keyword",
    "ends_with_premium_keyword",
    "exact_match_bias",
    "pronounceability_score",
    "short_premium_signal",
    "token_balance_score",
    "repeated_char_penalty",
]

CATEGORICAL_FEATURES = ["tld", "category_hint"]


def infer_separator(path: Path) -> str:
    return "\t" if path.suffix.lower() == ".tsv" else ","


def read_raw_file(path: Path) -> pd.DataFrame | None:
    separator = infer_separator(path)
    try:
        df = pd.read_csv(path, sep=separator)
    except Exception:
        return None

    lower_columns = {column.lower(): column for column in df.columns}
    if "domain" not in lower_columns:
        return None

    return df


def normalize_dataset(df: pd.DataFrame, source_name: str) -> pd.DataFrame:
    lower_columns = {column.lower(): column for column in df.columns}

    domain_column = lower_columns.get("domain")
    price_column = (
        lower_columns.get("salepriceusd")
        or lower_columns.get("priceusd")
        or lower_columns.get("price")
    )

    if not domain_column or not price_column:
        return pd.DataFrame(columns=[DOMAIN_COLUMN, TARGET_COLUMN])

    normalized = pd.DataFrame(
        {
            DOMAIN_COLUMN: df[domain_column].map(normalize_domain),
            TARGET_COLUMN: pd.to_numeric(df[price_column], errors="coerce"),
            "source_file": source_name,
        }
    )

    if "tld" in lower_columns:
        normalized["tld_hint"] = df[lower_columns["tld"]].astype(str).str.strip().str.lower()

    if "wordcount" in lower_columns:
        normalized["word_count_hint"] = pd.to_numeric(
            df[lower_columns["wordcount"]], errors="coerce"
        )

    if "charlength" in lower_columns:
        normalized["char_length_hint"] = pd.to_numeric(
            df[lower_columns["charlength"]], errors="coerce"
        )

    if "hasnumber" in lower_columns:
        normalized["contains_number_hint"] = pd.to_numeric(
            df[lower_columns["hasnumber"]], errors="coerce"
        )

    if "hashyphen" in lower_columns:
        normalized["contains_hyphen_hint"] = pd.to_numeric(
            df[lower_columns["hashyphen"]], errors="coerce"
        )

    return normalized


def load_training_dataset(raw_data_dir: Path = RAW_DATA_DIR) -> pd.DataFrame:
    frames: list[pd.DataFrame] = []

    for path in sorted(raw_data_dir.iterdir()):
        if not path.is_file() or path.suffix.lower() not in {".csv", ".tsv"}:
            continue

        raw_df = read_raw_file(path)
        if raw_df is None:
            continue

        normalized = normalize_dataset(raw_df, path.name)
        if not normalized.empty:
            frames.append(normalized)

    if not frames:
        raise RuntimeError(f"No valid training rows found under {raw_data_dir}")

    merged = pd.concat(frames, ignore_index=True)
    merged = merged.dropna(subset=[DOMAIN_COLUMN, TARGET_COLUMN])
    merged = merged[merged[DOMAIN_COLUMN].str.contains(r"\.", regex=True, na=False)]
    merged = merged[merged[TARGET_COLUMN] > 0]
    merged = merged.drop_duplicates(subset=[DOMAIN_COLUMN, TARGET_COLUMN, "source_file"])
    merged = merged.reset_index(drop=True)
    return merged


def prepare_training_frame(dataset: pd.DataFrame) -> pd.DataFrame:
    features = build_feature_frame(dataset[DOMAIN_COLUMN]).drop(columns=["domain"])
    prepared = pd.concat([dataset.reset_index(drop=True), features], axis=1)

    if "tld_hint" in prepared.columns:
        prepared["tld"] = prepared["tld_hint"].where(
            prepared["tld_hint"].astype(str).str.startswith("."), prepared["tld"]
        )

    if "word_count_hint" in prepared.columns:
        prepared["word_count"] = prepared["word_count_hint"].fillna(prepared["word_count"])

    if "char_length_hint" in prepared.columns:
        prepared["domain_length"] = prepared["char_length_hint"].fillna(prepared["domain_length"])

    if "contains_number_hint" in prepared.columns:
        prepared["contains_number"] = prepared["contains_number_hint"].fillna(
            prepared["contains_number"]
        )

    if "contains_hyphen_hint" in prepared.columns:
        prepared["contains_hyphen"] = prepared["contains_hyphen_hint"].fillna(
            prepared["contains_hyphen"]
        )

    prepared["tld"] = prepared["domain"].map(lambda domain: split_domain_parts(domain)[1] or ".unknown")
    prepared["word_count"] = prepared["word_count"].astype(float)
    prepared["domain_length"] = prepared["domain_length"].astype(float)
    prepared["contains_number"] = prepared["contains_number"].astype(float)
    prepared["contains_hyphen"] = prepared["contains_hyphen"].astype(float)
    prepared["premium_keyword_count"] = prepared["premium_keyword_count"].astype(float)
    prepared["estimated_brandability_score"] = prepared["estimated_brandability_score"].astype(float)

    return prepared


def build_training_pipeline() -> Pipeline:
    preprocessor = ColumnTransformer(
        transformers=[
            (
                "numeric",
                Pipeline(
                    steps=[
                        ("imputer", SimpleImputer(strategy="median")),
                    ]
                ),
                NUMERIC_FEATURES,
            ),
            (
                "categorical",
                Pipeline(
                    steps=[
                        ("imputer", SimpleImputer(strategy="most_frequent")),
                        ("encoder", OneHotEncoder(handle_unknown="ignore")),
                    ]
                ),
                CATEGORICAL_FEATURES,
            ),
        ]
    )

    regressor = RandomForestRegressor(
        n_estimators=500,
        max_depth=None,
        min_samples_leaf=1,
        min_samples_split=4,
        max_features="sqrt",
        random_state=42,
        n_jobs=-1,
    )

    return Pipeline(
        steps=[
            ("preprocessor", preprocessor),
            ("regressor", regressor),
        ]
    )


def train_model(raw_data_dir: Path = RAW_DATA_DIR, model_path: Path = MODEL_PATH) -> dict[str, Any]:
    dataset = load_training_dataset(raw_data_dir)
    prepared = prepare_training_frame(dataset)

    X = prepared[NUMERIC_FEATURES + CATEGORICAL_FEATURES]
    y = prepared[TARGET_COLUMN].astype(float)
    y_log = np.log1p(y)

    sample_weights = np.ones(len(prepared), dtype=float)
    sample_weights += (prepared["estimated_brandability_score"] >= 75).astype(float) * 0.55
    sample_weights += (prepared["pronounceability_score"] >= 72).astype(float) * 0.35
    sample_weights += (prepared["short_premium_signal"] == 1).astype(float) * 0.8
    sample_weights += (prepared["tld"] == ".com").astype(float) * 0.25
    sample_weights += (prepared["premium_keyword_count"] == 0).astype(float) * 0.15

    (
        X_train,
        X_test,
        y_train_log,
        _y_test_log,
        y_train,
        y_test,
        weight_train,
        _weight_test,
    ) = train_test_split(
        X,
        y_log,
        y,
        sample_weights,
        test_size=0.2,
        random_state=42,
    )

    pipeline = build_training_pipeline()
    pipeline.fit(X_train, y_train_log, regressor__sample_weight=weight_train)

    predictions_log = pipeline.predict(X_test)
    predictions = np.expm1(predictions_log)
    predictions = np.maximum(predictions, 0.0)
    mae = float(mean_absolute_error(y_test, predictions))

    model_path.parent.mkdir(parents=True, exist_ok=True)
    bundle = {
        "pipeline": pipeline,
        "mae": mae,
        "training_rows": int(len(prepared)),
        "feature_columns": NUMERIC_FEATURES + CATEGORICAL_FEATURES,
        "target_transform": "log1p",
    }
    joblib.dump(bundle, model_path)

    return {
        "model_path": str(model_path),
        "rows": int(len(prepared)),
        "train_rows": int(len(X_train)),
        "test_rows": int(len(X_test)),
        "mae": mae,
    }


def main() -> None:
    result = train_model()
    print("Training complete")
    print(f"Rows: {result['rows']}")
    print(f"Train rows: {result['train_rows']}")
    print(f"Test rows: {result['test_rows']}")
    print(f"MAE: ${result['mae']:.2f}")
    print(f"Saved model: {result['model_path']}")


if __name__ == "__main__":
    main()
