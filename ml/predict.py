from __future__ import annotations

import json
import sys
from pathlib import Path

if __package__ in {None, ""}:
    sys.path.append(str(Path(__file__).resolve().parents[1]))

from ml.model import predict_domain_value


def main() -> None:
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Missing domain"}))
        raise SystemExit(1)

    domain = sys.argv[1]
    result = predict_domain_value(domain)
    print(json.dumps(result))


if __name__ == "__main__":
    main()
