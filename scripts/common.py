"""공용 유틸: 경로, YAML 로드, JSON 저장, 카테고리 추정 등."""
from __future__ import annotations

import json
import os
import re
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import Any

import yaml

KST = timezone(timedelta(hours=9))

# 프로젝트 루트 = 이 파일의 부모의 부모
ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / "data"
PUBLIC_DATA_DIR = ROOT / "public" / "data"


def load_lineup() -> dict[str, Any]:
    with (DATA_DIR / "shinhan_lineup.yaml").open(encoding="utf-8") as f:
        return yaml.safe_load(f) or {}


def save_json(path: Path, obj: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as f:
        json.dump(obj, f, ensure_ascii=False, separators=(",", ":"))


def kst_now_iso() -> str:
    return datetime.now(KST).isoformat(timespec="seconds")


# 카테고리 자동 추정 (이름 기반). 운용사 데이터에 카테고리 필드가 없을 때 fallback.
_CATEGORY_RULES: list[tuple[re.Pattern[str], str]] = [
    (re.compile(r"S&P\s*500|S\&P500|미국S&P", re.I), "us_stock"),
    (re.compile(r"나스닥|NASDAQ|미국빅테크", re.I), "us_stock"),
    (re.compile(r"다우|다우존스", re.I), "us_stock"),
    (re.compile(r"미국|US"), "us_stock"),
    (re.compile(r"KOSPI|코스피|코스닥|KOSDAQ|2[0-9]{2}"), "kr_stock"),
    (re.compile(r"한국"), "kr_stock"),
    (re.compile(r"MSCI|글로벌|선진국|World|EM\b|신흥국", re.I), "global_stock"),
    (re.compile(r"국채|채권|회사채|크레딧|단기채|장기채"), "bond"),
    (re.compile(r"리츠|REIT|인프라", re.I), "reit_infra"),
    (re.compile(r"금|은|원유|구리|원자재"), "commodity"),
    (re.compile(r"TDF|타깃데이트"), "tdf"),
]


def guess_category(name: str) -> str:
    for pat, cat in _CATEGORY_RULES:
        if pat.search(name):
            return cat
    return "global_stock"


def copy_to_public() -> None:
    """data/products.json + prices/holdings/news를 public/data/로 복사.
    Vite는 public/을 자동으로 dist/로 복사하지만, scripts 실행 후 dev 서버에서도
    바로 보이게 하기 위해 public/data/를 동일 구조로 유지."""
    import shutil

    src_files = [
        ("products.json", "products.json"),
    ]
    PUBLIC_DATA_DIR.mkdir(parents=True, exist_ok=True)
    for src_name, dst_name in src_files:
        src = DATA_DIR / src_name
        if src.exists():
            shutil.copy2(src, PUBLIC_DATA_DIR / dst_name)
    for sub in ("prices", "holdings", "news"):
        src_dir = DATA_DIR / sub
        if not src_dir.exists():
            continue
        dst_dir = PUBLIC_DATA_DIR / sub
        dst_dir.mkdir(parents=True, exist_ok=True)
        for f in src_dir.glob("*.json"):
            shutil.copy2(f, dst_dir / f.name)
