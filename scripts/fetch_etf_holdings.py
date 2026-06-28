"""ETF 보유종목(PDF: 자산구성 내역) 스크랩.

운용사별로 페이지 구조가 다르므로 어댑터 패턴으로 분기.
첫 단계는 KODEX(삼성), TIGER(미래에셋) 지원.
나머지(KBSTAR/ARIRANG/SOL/RISE/HANARO 등)는 운용사 사이트 확인 후 점진 추가.

실패는 그냥 스킵 (사이트 구조 자주 바뀜 → 데이터 없을 때 UI는 graceful fallback).
"""
from __future__ import annotations

import sys
import time
import re
from pathlib import Path

import requests
from bs4 import BeautifulSoup

from common import DATA_DIR, load_lineup, save_json, kst_now_iso  # type: ignore


HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/121.0 Safari/537.36"
    ),
    "Accept-Language": "ko-KR,ko;q=0.9,en;q=0.8",
}


def fetch_kodex(ticker: str) -> list[dict] | None:
    """KODEX (삼성자산운용) PDP 페이지에서 상위 보유종목 추출.
    URL 패턴: https://www.samsungfund.com/etf/product/view.do?id=2ETF<ticker>
    실제로는 운용사가 페이지 구조를 바꾸면 깨질 수 있어, 운용사가 제공하는 PDP CSV/엑셀이 있으면
    그쪽이 더 안정적임. 현재는 단순 HTML 파싱 시도.
    """
    url = f"https://www.samsungfund.com/etf/product/view.do?id=2ETF{ticker}"
    try:
        r = requests.get(url, headers=HEADERS, timeout=15)
        if r.status_code != 200:
            return None
        soup = BeautifulSoup(r.text, "lxml")
        # 보유종목 테이블 추측: <table> 안에 "종목명"/"비중(%)" 헤더가 있는 것
        for tbl in soup.find_all("table"):
            text = tbl.get_text(" ", strip=True)
            if "종목명" in text and ("비중" in text or "보유" in text):
                rows = []
                for tr in tbl.find_all("tr"):
                    cells = [c.get_text(strip=True) for c in tr.find_all(["td", "th"])]
                    if len(cells) >= 2:
                        rows.append(cells)
                holdings: list[dict] = []
                for cells in rows[1:]:
                    name = cells[0]
                    pct = None
                    for c in cells[1:]:
                        m = re.search(r"([\d.]+)\s*%?", c.replace(",", ""))
                        if m:
                            try:
                                pct = float(m.group(1))
                                break
                            except ValueError:
                                pass
                    if name and pct is not None:
                        holdings.append({"name": name, "weight_pct": pct})
                if holdings:
                    return holdings
    except Exception as e:
        print(f"  ! kodex fetch failed for {ticker}: {e}")
    return None


def fetch_tiger(ticker: str) -> list[dict] | None:
    """TIGER (미래에셋자산운용) ETF 상세 페이지.
    URL 패턴: https://www.tigeretf.com/ko/product/search/detail/index.do?ksdFund=KR<ticker>
    페이지가 JS 렌더링이 많아 단순 fetch로 안 되는 경우 있음. 1차에는 시도만.
    """
    url = (
        "https://www.tigeretf.com/ko/product/search/detail/index.do?"
        f"ksdFund=KR{ticker}"
    )
    try:
        r = requests.get(url, headers=HEADERS, timeout=15)
        if r.status_code != 200:
            return None
        soup = BeautifulSoup(r.text, "lxml")
        for tbl in soup.find_all("table"):
            text = tbl.get_text(" ", strip=True)
            if ("구성종목" in text or "보유종목" in text) and "비중" in text:
                holdings: list[dict] = []
                for tr in tbl.find_all("tr"):
                    cells = [c.get_text(strip=True) for c in tr.find_all(["td", "th"])]
                    if len(cells) < 2:
                        continue
                    name = cells[0]
                    pct = None
                    for c in cells[1:]:
                        m = re.search(r"([\d.]+)\s*%?", c.replace(",", ""))
                        if m:
                            try:
                                pct = float(m.group(1))
                                break
                            except ValueError:
                                pass
                    if name and pct is not None and "%" not in name:
                        holdings.append({"name": name, "weight_pct": pct})
                if holdings:
                    return holdings
    except Exception as e:
        print(f"  ! tiger fetch failed for {ticker}: {e}")
    return None


PROVIDER_PREFIX = {
    "KODEX": fetch_kodex,
    "TIGER": fetch_tiger,
    # 추후 확장: "KBSTAR", "ARIRANG", "SOL", "RISE", "HANARO", "ACE"
}


def main() -> int:
    lineup = load_lineup()
    etfs = lineup.get("etf") or []

    # 사전 작업: ETF 이름 사전 로드 (data/etf_basics.json) — provider prefix 판별용
    basics_file = DATA_DIR / "etf_basics.json"
    name_map: dict[str, str] = {}
    if basics_file.exists():
        import json

        data = json.loads(basics_file.read_text(encoding="utf-8"))
        for t, info in data.get("items", {}).items():
            name_map[t] = info.get("name", "") or ""

    count_ok = 0
    for item in etfs:
        ticker = str(item["ticker"]).zfill(6)
        name = name_map.get(ticker, "")
        provider = next(
            (k for k in PROVIDER_PREFIX if name.upper().startswith(k)),
            None,
        )
        if not provider:
            print(f"[holdings] {ticker} ({name}) — unsupported provider, skip")
            continue
        print(f"[holdings] {ticker} ({name}) via {provider} ...", flush=True)
        holdings = PROVIDER_PREFIX[provider](ticker)
        if holdings:
            # 비중 합이 100%를 크게 넘으면 노이즈 — 상위만 추리고 기타 묶음
            holdings = sorted(holdings, key=lambda x: x["weight_pct"], reverse=True)
            save_json(
                DATA_DIR / "holdings" / f"{ticker}.json",
                {
                    "id": ticker,
                    "as_of": kst_now_iso()[:10],
                    "holdings": holdings,
                },
            )
            count_ok += 1
        time.sleep(0.5)

    print(f"[holdings] done. {count_ok}/{len(etfs)} ETFs collected.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
