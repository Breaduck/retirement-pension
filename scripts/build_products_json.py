"""모든 수집 산출물을 합쳐 data/products.json 생성 + public/data/로 복사.

입력:
- data/shinhan_lineup.yaml
- data/etf_basics.json
- data/tdf.json
- data/holdings/*.json (개수만 카운트, 본체는 SPA가 lazy fetch)
- data/prices/*.json   (200일 MA / RSI / 1Y 분위 계산용)

출력:
- data/products.json (홈/상세에서 사용하는 통합 메타)
- public/data/* 일괄 복사
"""
from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Any

from common import (  # type: ignore
    DATA_DIR,
    load_lineup,
    save_json,
    kst_now_iso,
    guess_category,
    copy_to_public,
)


def load_json(p: Path) -> Any:
    if not p.exists():
        return None
    return json.loads(p.read_text(encoding="utf-8"))


def compute_signals(series: list[dict]) -> dict[str, float | int | None]:
    """MA200 / RSI(14) / 1Y 가격 분위수."""
    closes = [pt["close"] for pt in series]
    out: dict[str, float | int | None] = {
        "ma200_pos_pct": None,
        "rsi14": None,
        "price_percentile_1y": None,
    }
    if not closes:
        return out
    last = closes[-1]
    if len(closes) >= 200:
        ma200 = sum(closes[-200:]) / 200
        out["ma200_pos_pct"] = (last - ma200) / ma200 * 100
    # RSI(14)
    if len(closes) >= 15:
        period = 14
        gain = loss = 0.0
        for i in range(1, period + 1):
            diff = closes[i] - closes[i - 1]
            if diff >= 0:
                gain += diff
            else:
                loss -= diff
        avg_gain = gain / period
        avg_loss = loss / period
        for i in range(period + 1, len(closes)):
            diff = closes[i] - closes[i - 1]
            g = diff if diff > 0 else 0
            l = -diff if diff < 0 else 0
            avg_gain = (avg_gain * (period - 1) + g) / period
            avg_loss = (avg_loss * (period - 1) + l) / period
        if avg_loss == 0:
            out["rsi14"] = 100.0
        else:
            rs = avg_gain / avg_loss
            out["rsi14"] = round(100 - 100 / (1 + rs), 1)
    # 1년 분위수
    one_year = closes[-252:] if len(closes) >= 252 else closes
    sorted_y = sorted(one_year)
    rank = next((i for i, v in enumerate(sorted_y) if v >= last), len(sorted_y))
    out["price_percentile_1y"] = round(rank / len(sorted_y) * 100)
    return out


def compute_risk(series: list[dict], rf_annual: float = 3.5) -> dict[str, float | None]:
    """3년 MDD, 연환산 변동성, Sharpe, 1년 후 P5/P50/P95 시나리오(정규근사)."""
    closes = [pt["close"] for pt in series]
    out: dict[str, float | None] = {
        "mdd_3y_pct": None,
        "annual_vol_pct": None,
        "sharpe_3y": None,
        "scenario_p5": None,
        "scenario_p50": None,
        "scenario_p95": None,
    }
    if len(closes) < 2:
        return out
    # MDD (3년 = 252*3)
    window = closes[-252 * 3 :] if len(closes) >= 252 else closes
    peak = window[0]
    mdd = 0.0
    for c in window:
        if c > peak:
            peak = c
        d = (c - peak) / peak
        if d < mdd:
            mdd = d
    out["mdd_3y_pct"] = round(mdd * 100, 1)

    # 일별 로그수익률
    import math

    log_rets = []
    for i in range(1, len(window)):
        a, b = window[i - 1], window[i]
        if a > 0 and b > 0:
            log_rets.append(math.log(b / a))
    if log_rets:
        mean = sum(log_rets) / len(log_rets)
        var = sum((r - mean) ** 2 for r in log_rets) / max(1, len(log_rets) - 1)
        std = math.sqrt(var)
        annual_vol = std * math.sqrt(252) * 100
        annual_ret = mean * 252 * 100
        out["annual_vol_pct"] = round(annual_vol, 1)
        if annual_vol > 0:
            out["sharpe_3y"] = round((annual_ret - rf_annual) / annual_vol, 2)
        # 1년 후 정규근사
        sigma1y = annual_vol
        mu1y = annual_ret
        out["scenario_p50"] = round(mu1y, 1)
        out["scenario_p5"] = round(mu1y - 1.645 * sigma1y, 1)
        out["scenario_p95"] = round(mu1y + 1.645 * sigma1y, 1)
    return out


def compute_timing(
    signals: dict, risk: dict, series: list[dict]
) -> dict | None:
    """5개 축 + 종합 신호.
    각 축은 0~100 (높을수록 매수 적합).
    """
    if not series:
        return None

    # 추세: ma200_pos_pct를 0~100으로. -10% 이하 = 0, +20% 이상 = 100 (위 아래 모두 너무 멀면 감점)
    pos = signals.get("ma200_pos_pct")
    if pos is None:
        trend = 50
    else:
        trend = max(0, min(100, 50 + pos * 2.5))  # +20% → 100, -20% → 0
        # 너무 멀리 떨어진 +값은 과열 → 살짝 감점
        if pos > 15:
            trend -= (pos - 15) * 1.5

    # 모멘텀: RSI 50이 가장 좋음(중립), 70+/30- 둘 다 안 좋음 → 종 모양
    rsi = signals.get("rsi14")
    if rsi is None:
        momentum = 50
    else:
        # 거리 = abs(rsi - 45) — 살짝 매수 우호적으로 45 중심
        momentum = max(0, 100 - abs(rsi - 45) * 3)

    # 가격위치: percentile 낮을수록 좋음 (싸게 살 수 있음)
    pct = signals.get("price_percentile_1y")
    if pct is None:
        position = 50
    else:
        position = max(0, 100 - pct)

    # 변동성(=안정성): 낮을수록 좋음. 10% → 80, 25% → 30
    vol = risk.get("annual_vol_pct")
    if vol is None:
        volatility = 50
    else:
        volatility = max(0, min(100, 100 - (vol - 5) * 3))

    # 유동성: 거래량 데이터 부족 → 시리즈 길이/마지막 거래일 기준 단순화. 일단 80 고정.
    liquidity = 80

    score = round(
        trend * 0.30 + momentum * 0.20 + position * 0.25 + volatility * 0.15 + liquidity * 0.10
    )

    if score >= 65:
        signal = "green"
        headline = "매수 가능 구간 — 점진 매수 검토"
    elif score >= 45:
        signal = "yellow"
        headline = "관망 / 분할매수 권장"
    else:
        signal = "red"
        headline = "비싼 구간 / 진입 자제"

    reasons = []
    if pos is not None:
        if pos > 5:
            reasons.append(f"200일 이평선 위 +{pos:.1f}% (상승 추세)")
        elif pos < -5:
            reasons.append(f"200일 이평선 아래 {pos:.1f}% (조정 구간)")
        else:
            reasons.append(f"200일 이평선 근방 ({pos:+.1f}%)")
    if rsi is not None:
        if rsi >= 70:
            reasons.append(f"RSI {rsi:.0f} — 과열")
        elif rsi <= 30:
            reasons.append(f"RSI {rsi:.0f} — 과매도(반등 가능)")
        else:
            reasons.append(f"RSI {rsi:.0f} — 중립")
    if pct is not None:
        if pct >= 80:
            reasons.append(f"1년 가격대 상위 {100 - pct}% — 비싼 편")
        elif pct <= 20:
            reasons.append(f"1년 가격대 하위 {pct}% — 싼 편")
        else:
            reasons.append(f"1년 가격대 중간 ({pct}%)")
    if vol is not None:
        if vol < 12:
            reasons.append(f"변동성 낮음 (연 {vol:.1f}%)")
        elif vol > 22:
            reasons.append(f"변동성 큼 (연 {vol:.1f}%)")

    return {
        "signal": signal,
        "headline": headline,
        "score": score,
        "axes": {
            "trend": round(trend),
            "momentum": round(momentum),
            "position": round(position),
            "volatility": round(volatility),
            "liquidity": liquidity,
        },
        "reasons": reasons,
    }


def main() -> int:
    lineup = load_lineup()
    basics = (load_json(DATA_DIR / "etf_basics.json") or {}).get("items", {})
    tdf_data = (load_json(DATA_DIR / "tdf.json") or {}).get("items", {})

    products: list[dict] = []

    # ETF
    for item in lineup.get("etf") or []:
        ticker = str(item["ticker"]).zfill(6)
        b = basics.get(ticker, {})
        prices_file = load_json(DATA_DIR / "prices" / f"{ticker}.json") or {}
        series = prices_file.get("series", [])
        signals = compute_signals(series)
        risk = compute_risk(series)
        timing = compute_timing(signals, risk, series)
        scenario = None
        if risk.get("scenario_p50") is not None:
            scenario = {
                "p5": risk["scenario_p5"],
                "p50": risk["scenario_p50"],
                "p95": risk["scenario_p95"],
            }
        name = b.get("name") or item.get("name") or ticker
        prod = {
            "id": ticker,
            "kind": "etf",
            "ticker": ticker,
            "name": name,
            "nickname": item.get("nickname"),
            "one_line": item.get("one_line"),
            "category": item.get("category") or guess_category(name),
            "asset_manager": item.get("asset_manager"),
            "benchmark": item.get("benchmark"),
            "benchmark_explainer": item.get("benchmark_explainer"),
            "expense_ratio": item.get("expense_ratio"),
            "aum": item.get("aum"),
            "last_price": b.get("last_close"),
            "daily_change_pct": b.get("daily_change_pct"),
            "return_1m": b.get("return_1m"),
            "return_3m": b.get("return_3m"),
            "return_1y": b.get("return_1y"),
            "return_3y": b.get("return_3y"),
            **{k: v for k, v in signals.items() if v is not None},
            "mdd_3y_pct": risk.get("mdd_3y_pct"),
            "annual_vol_pct": risk.get("annual_vol_pct"),
            "sharpe_3y": risk.get("sharpe_3y"),
            "scenario_1y": scenario,
            "timing": timing,
        }
        products.append({k: v for k, v in prod.items() if v is not None})

    # TDF
    for t in lineup.get("tdf") or []:
        tid = t["id"]
        meta = tdf_data.get(tid, {})
        prod = {
            "id": tid,
            "kind": "tdf",
            "name": t.get("name", tid),
            "nickname": t.get("nickname"),
            "one_line": t.get("one_line"),
            "category": "tdf",
            "asset_manager": t.get("asset_manager"),
            "expense_ratio": t.get("expense_ratio"),
            "tdf": {
                "target_year": int(t["target_year"]),
                "current_stock_pct": meta.get("current_stock_pct"),
                "current_bond_pct": meta.get("current_bond_pct"),
                "glide_path": meta.get("glide_path"),
            },
        }
        products.append({k: v for k, v in prod.items() if v is not None})

    out = {
        "updated_at": kst_now_iso(),
        "source_note": "KRX 공식 시세 + 운용사 사이트 자료. 일부 TDF 글라이드패스는 합성치(추정).",
        "products": products,
    }
    save_json(DATA_DIR / "products.json", out)

    copy_to_public()
    print(f"[build] products.json done — {len(products)} products.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
