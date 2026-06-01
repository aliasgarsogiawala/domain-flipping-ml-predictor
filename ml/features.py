from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Any

import pandas as pd

PREMIUM_KEYWORDS = {
    "ai",
    "agent",
    "agents",
    "app",
    "apps",
    "bet",
    "bio",
    "capital",
    "cash",
    "chat",
    "cloud",
    "crypto",
    "data",
    "dev",
    "fund",
    "game",
    "games",
    "health",
    "hq",
    "labs",
    "loan",
    "market",
    "money",
    "pay",
    "shop",
    "smart",
    "tech",
    "trade",
    "trust",
    "vault",
    "web",
}

TOKEN_SPLIT_RE = re.compile(r"[\W_]+")
CAMEL_SPLIT_RE = re.compile(r"(?<=[a-z])(?=[A-Z])")
VOWELS = set("aeiou")


@dataclass(frozen=True)
class DomainFeatureRow:
    domain: str
    tld: str
    domain_length: int
    word_count: int
    contains_number: int
    contains_hyphen: int
    premium_keyword_count: int
    estimated_brandability_score: float


def normalize_domain(raw_domain: Any) -> str:
    value = str(raw_domain or "").strip().lower()
    value = re.sub(r"^https?://", "", value)
    value = re.sub(r"^www\.", "", value)
    value = value.split("/", 1)[0]
    return value


def split_domain_parts(domain: str) -> tuple[str, str]:
    normalized = normalize_domain(domain)
    if "." not in normalized:
        return normalized, ""

    name, tld = normalized.rsplit(".", 1)
    return name, f".{tld.lower()}"


def tokenize_domain_name(name: str) -> list[str]:
    compact = CAMEL_SPLIT_RE.sub(" ", name.replace("-", " "))
    tokens = [token.lower() for token in TOKEN_SPLIT_RE.split(compact) if token]

    if tokens:
        return tokens

    return [name.lower()] if name else []


def compute_brandability_score(name: str, tokens: list[str] | None = None) -> float:
    tokens = tokens or tokenize_domain_name(name)
    compact = "".join(tokens)
    if not compact:
        return 0.0

    score = 50.0
    length = len(compact)
    unique_ratio = len(set(compact)) / max(length, 1)
    vowel_ratio = sum(1 for char in compact if char in VOWELS) / max(length, 1)

    if 4 <= length <= 12:
        score += 18
    elif 13 <= length <= 16:
        score += 8
    else:
        score -= 10

    if len(tokens) == 1:
        score += 10
    elif len(tokens) == 2:
        score += 5
    else:
        score -= min(12, (len(tokens) - 2) * 4)

    if not any(char.isdigit() for char in compact):
        score += 6
    else:
        score -= 10

    if "-" not in name:
        score += 6
    else:
        score -= 10

    if 0.25 <= vowel_ratio <= 0.6:
        score += 8
    else:
        score -= 4

    if unique_ratio >= 0.55:
        score += 4

    if len(tokens) == 1 and compact.isalpha():
        score += 5

    return round(max(0.0, min(100.0, score)), 2)


def premium_keyword_count(tokens: list[str]) -> int:
    return sum(1 for token in tokens if token in PREMIUM_KEYWORDS)


def extract_domain_features(domain: str) -> DomainFeatureRow:
    normalized = normalize_domain(domain)
    name, tld = split_domain_parts(normalized)
    tokens = tokenize_domain_name(name)

    if not tokens and not tld:
        raise ValueError(f"Invalid domain: {domain}")

    compact_name = "".join(tokens)

    return DomainFeatureRow(
        domain=normalized,
        tld=tld or ".unknown",
        domain_length=len(compact_name),
        word_count=max(1, len(tokens)) if compact_name else 0,
        contains_number=int(any(char.isdigit() for char in normalized)),
        contains_hyphen=int("-" in normalized),
        premium_keyword_count=premium_keyword_count(tokens),
        estimated_brandability_score=compute_brandability_score(name, tokens),
    )


def build_feature_frame(domains: pd.Series) -> pd.DataFrame:
    rows = [extract_domain_features(domain).__dict__ for domain in domains.tolist()]
    return pd.DataFrame(rows)
