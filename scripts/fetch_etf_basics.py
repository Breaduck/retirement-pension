"""pykrx로 ETF 기본정보 + 일별 시세를 수집해 data/etf_basics.json, data/prices/<ticker>.json 저장.

- 기본정보: 운용사, 추종지수, 총보수, 순자산, 상장일
- 시세: 최근 3년 일별 OHLCV
- 수익률: 1M/3M/6M/1Y/3Y
"""
from __future__ import annotations

import sys
import time
from datetime import datetime, timedelta
from pathlib import Path

from pykrx import stock
from common import DATA_DIR, load_lineup, save_json, kst_now_iso  # type: ignore


def main() -> int:
    lineup = load_lineup()
    etfs = lineup.get("etf") or []
    if not etfs:
        print("[fetch_etf_basics] no ETF tickers in shinhan_lineup.yaml")
        return 0

    today = datetime.now()
    start = (today - timedelta(days=365 * 3 + 30)).strftime("%Y%m%d")
    end = today.strftime("%Y%m%d")

    basics: dict[str, dict] = {}
    for item in etfs:
        ticker = str(item["ticker"]).zfill(6)
        print(f"[fetch_etf_basics] {ticker} ...", flush=True)

        # 이름 (pykrx는 ETF 이름 조회 함수 있음)
        try:
            name = stock.get_etf_ticker_name(ticker)
        except Exception as e:
            print(f"  ! ticker_name failed: {e}")
            name = ""

        # OHLCV
        try:
            df = stock.get_etf_ohlcv_by_date(start, end, ticker)
        except Exception as e:
            print(f"  ! ohlcv failed: {e}")
            df = None

        series = []
        last_close = None
        daily_change_pct = None
        returns = {}
        if df is not None and len(df) > 0:
            df = df.sort_index()
            for ts, row in df.iterrows():
                series.append(
                    {"date": ts.strftime("%Y-%m-%d"), "close": float(row["종가"])}
                )
            last_close = series[-1]["close"]
            if len(series) >= 2:
                prev = series[-2]["close"]
                daily_change_pct = (last_close - prev) / prev * 100 if prev else None

            def ret(days: int) -> float | None:
                if len(series) <= days:
                    return None
                base = series[-1 - days]["close"]
                if not base:
                    return None
                return (last_close - base) / base * 100

            returns = {
                "return_1m": ret(22),
                "return_3m": ret(66),
                "return_6m": ret(130),
                "return_1y": ret(252),
                "return_3y": ret(252 * 3),
            }

        save_json(
            DATA_DIR / "prices" / f"{ticker}.json",
            {"id": ticker, "ticker": ticker, "series": series},
        )

        basics[ticker] = {
            "ticker": ticker,
            "name": name,
            "last_close": last_close,
            "daily_change_pct": daily_change_pct,
            **returns,
        }

        time.sleep(0.3)  # KRX 부담 줄이기

    save_json(
        DATA_DIR / "etf_basics.json",
        {"updated_at": kst_now_iso(), "items": basics},
    )
    print(f"[fetch_etf_basics] done. {len(basics)} ETFs.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
