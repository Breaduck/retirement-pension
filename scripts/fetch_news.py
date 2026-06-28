"""NAVER 뉴스 검색 RSS로 종목별 뉴스 캐시.

NAVER 뉴스 검색 RSS: https://rss.naver.com/news/section.xml (전체)
종목별은 일반 검색 결과를 파싱. RSS가 없는 경우 검색 페이지를 BS4로 파싱.

윤리/안정성:
- 검색당 1초 sleep
- 최신 10개만
- 실패 시 빈 리스트
"""
from __future__ import annotations

import sys
import time
from urllib.parse import quote
from pathlib import Path

import requests
from bs4 import BeautifulSoup

from common import DATA_DIR, load_lineup, save_json  # type: ignore

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/121.0 Safari/537.36"
    ),
    "Accept-Language": "ko-KR,ko;q=0.9",
}


def search_news(query: str, limit: int = 10) -> list[dict]:
    """NAVER 뉴스 검색 결과 파싱.
    URL: https://search.naver.com/search.naver?where=news&query=...
    """
    url = (
        "https://search.naver.com/search.naver?where=news&sort=1&query="
        + quote(query)
    )
    try:
        r = requests.get(url, headers=HEADERS, timeout=15)
        if r.status_code != 200:
            return []
        soup = BeautifulSoup(r.text, "lxml")
        items: list[dict] = []
        for a in soup.select("a.news_tit"):
            if len(items) >= limit:
                break
            title = a.get("title") or a.get_text(strip=True)
            href = a.get("href") or ""
            # 같은 카드의 언론사 추정
            card = a.find_parent("div", class_="news_area")
            publisher = ""
            published_at = ""
            if card:
                pub = card.select_one("a.info.press")
                if pub:
                    publisher = pub.get_text(strip=True).replace("언론사 선정", "").strip()
                date_span = card.select_one("span.info")
                if date_span:
                    published_at = date_span.get_text(strip=True)
            items.append(
                {
                    "title": title,
                    "publisher": publisher,
                    "url": href,
                    "published_at": published_at,
                }
            )
        return items
    except Exception as e:
        print(f"  ! search failed for {query}: {e}")
        return []


def main() -> int:
    lineup = load_lineup()
    targets: list[tuple[str, str]] = []  # (id, query)
    for item in lineup.get("etf") or []:
        ticker = str(item["ticker"]).zfill(6)
        # 검색어: 닉네임 + 운용사 약자 우선, 없으면 티커
        q = item.get("search_query") or item.get("nickname") or ticker
        targets.append((ticker, q))
    for item in lineup.get("tdf") or []:
        tid = item["id"]
        q = item.get("search_query") or item.get("name") or item.get("id")
        targets.append((tid, q))

    for tid, q in targets:
        print(f"[news] {tid} <- '{q}'", flush=True)
        items = search_news(q, limit=10)
        save_json(DATA_DIR / "news" / f"{tid}.json", {"id": tid, "items": items})
        time.sleep(1.0)

    print(f"[news] done. {len(targets)} targets.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
