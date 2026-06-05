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
STRONG_TLDS = {
    ".com": 1.0,
    ".ai": 0.88,
    ".io": 0.82,
    ".co": 0.78,
    ".app": 0.74,
    ".dev": 0.72,
    ".in": 0.7,
    ".tech": 0.54,
    ".info": 0.42,
}
COMMERCIAL_TERMS = {
    "pay",
    "cash",
    "capital",
    "loan",
    "market",
    "fund",
    "trade",
    "shop",
    "trust",
    "money",
    "cloud",
    "data",
}
TECH_TERMS = {"ai", "agent", "chat", "dev", "app", "cloud", "data", "web", "labs"}
SHORT_GENERIC_WORDS = {"go", "get", "my", "the", "best", "top", "smart", "hq"}


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
    tld_tier_score: float
    vowel_ratio: float
    unique_char_ratio: float
    starts_with_premium_keyword: int
    ends_with_premium_keyword: int
    exact_match_bias: float
    pronounceability_score: float
    short_premium_signal: int
    token_balance_score: float
    repeated_char_penalty: float
    category_hint: str


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
    spaced_name = CAMEL_SPLIT_RE.sub(" ", name.replace("-", " "))
    tokens = [token.lower() for token in TOKEN_SPLIT_RE.split(spaced_name) if token]

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


def compute_pronounceability_score(compact: str) -> float:
    if not compact:
        return 0.0

    score = 50.0
    vowel_ratio = sum(1 for char in compact if char in VOWELS) / max(len(compact), 1)
    consonant_clusters = len(re.findall(r"[^aeiou]{4,}", compact))
    awkward_endings = int(compact.endswith(("xq", "zx", "qz", "jq")))

    if 0.28 <= vowel_ratio <= 0.58:
        score += 18
    else:
        score -= 10

    score -= consonant_clusters * 12
    score -= awkward_endings * 10

    if compact.isalpha():
        score += 8

    return round(max(0.0, min(100.0, score)), 2)


def infer_category_hint(tokens: list[str], compact: str) -> str:
    if not compact:
        return "general"
    if len(compact) <= 4:
        return "short"
    if any(token in COMMERCIAL_TERMS for token in tokens):
        return "commercial"
    if any(token in TECH_TERMS for token in tokens):
        return "tech"
    if len(tokens) == 1 and compact.isalpha() and 5 <= len(compact) <= 10:
        return "brand"
    if len(tokens) >= 3:
        return "exact_match"
    return "general"


def compute_exact_match_bias(tokens: list[str], compact: str) -> float:
    if not tokens:
        return 0.0

    score = 35.0
    if len(tokens) >= 2:
        score += 18
    if any(token in COMMERCIAL_TERMS for token in tokens):
        score += 16
    if any(token in SHORT_GENERIC_WORDS for token in tokens):
        score -= 8
    if len(compact) > 16:
        score -= 10

    return round(max(0.0, min(100.0, score)), 2)


def is_short_premium_candidate(compact_name: str, tokens: list[str]) -> int:
    return int(
        len(compact_name) <= 8
        and compact_name.isalpha()
        and premium_keyword_count(tokens) == 0
        and len(tokens) <= 2
    )


def extract_domain_features(domain: str) -> DomainFeatureRow:
    normalized = normalize_domain(domain)
    name, tld = split_domain_parts(normalized)
    tokens = tokenize_domain_name(name)

    if not tokens and not tld:
        raise ValueError(f"Invalid domain: {domain}")

    compact_name = "".join(tokens)
    vowel_ratio = (
        sum(1 for char in compact_name if char in VOWELS) / max(len(compact_name), 1)
        if compact_name
        else 0.0
    )
    unique_ratio = len(set(compact_name)) / max(len(compact_name), 1) if compact_name else 0.0
    starts_with_premium = int(bool(tokens and tokens[0] in PREMIUM_KEYWORDS))
    ends_with_premium = int(bool(tokens and tokens[-1] in PREMIUM_KEYWORDS))
    pronounceability = compute_pronounceability_score(compact_name)
    exact_match_bias = compute_exact_match_bias(tokens, compact_name)
    token_lengths = [len(token) for token in tokens if token]
    token_balance = 100.0
    if len(token_lengths) >= 2:
        token_balance -= min(60.0, float(max(token_lengths) - min(token_lengths)) * 8.0)
    repeated_char_penalty = float(len(re.findall(r"(.)\1{2,}", compact_name)) * 20.0)

    return DomainFeatureRow(
        domain=normalized,
        tld=tld or ".unknown",
        domain_length=len(compact_name),
        word_count=max(1, len(tokens)) if compact_name else 0,
        contains_number=int(any(char.isdigit() for char in normalized)),
        contains_hyphen=int("-" in normalized),
        premium_keyword_count=premium_keyword_count(tokens),
        estimated_brandability_score=compute_brandability_score(name, tokens),
        tld_tier_score=round(STRONG_TLDS.get(tld or ".unknown", 0.35) * 100.0, 2),
        vowel_ratio=round(vowel_ratio, 4),
        unique_char_ratio=round(unique_ratio, 4),
        starts_with_premium_keyword=starts_with_premium,
        ends_with_premium_keyword=ends_with_premium,
        exact_match_bias=exact_match_bias,
        pronounceability_score=pronounceability,
        short_premium_signal=is_short_premium_candidate(compact_name, tokens),
        token_balance_score=round(max(0.0, min(100.0, token_balance)), 2),
        repeated_char_penalty=round(repeated_char_penalty, 2),
        category_hint=infer_category_hint(tokens, compact_name),
    )


def build_feature_frame(domains: pd.Series) -> pd.DataFrame:
    rows = [extract_domain_features(domain).__dict__ for domain in domains.tolist()]
    return pd.DataFrame(rows)
