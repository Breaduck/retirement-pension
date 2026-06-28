"""TDF(Target Date Fund) 정보 수집 — 운용사 펀드 페이지에서 글라이드패스/현재 자산배분/총보수.

운용사 펀드 페이지 구조가 매우 다양해서, 첫 단계는 lineup YAML에 입력된 정보(target_year, name,
asset_manager)만 사용하고, 이후 운용사별 어댑터를 점차 추가.

당장은 '글라이드패스 합성 룰'을 제공: target_year를 기준으로 단순한 사다리꼴을 만들어 placeholder.
실제 운용사 글라이드패스가 들어오면 교체.
"""
from __future__ import annotations

import sys
from pathlib import Path

from common import DATA_DIR, load_lineup, save_json, kst_now_iso  # type: ignore


def synthesize_glide_path(target_year: int) -> list[dict]:
    """target_year를 기준으로 보수적 사다리꼴 글라이드패스 합성.
    실 데이터가 아니므로 UI에서는 '추정' 표기 필요.
    """
    points = []
    # 단순 룰: 은퇴 25년 전 80%, 은퇴 시점 40%, 은퇴 후 20%
    schedule = [
        (target_year - 25, 80),
        (target_year - 15, 65),
        (target_year - 10, 55),
        (target_year - 5, 48),
        (target_year, 40),
        (target_year + 5, 30),
        (target_year + 10, 20),
    ]
    for y, stock_pct in schedule:
        points.append(
            {"year": y, "stock_pct": stock_pct, "bond_pct": 100 - stock_pct}
        )
    return points


def main() -> int:
    lineup = load_lineup()
    tdfs = lineup.get("tdf") or []
    items: dict[str, dict] = {}
    for t in tdfs:
        tid = t["id"]
        target_year = int(t["target_year"])
        gp = synthesize_glide_path(target_year)
        # 현재 시점(2026년 가정)의 비중 = 합성된 패스 보간
        current_year = 2026
        # 가장 가까운 두 점 선형보간
        gp_sorted = sorted(gp, key=lambda p: p["year"])
        cur_stock = gp_sorted[0]["stock_pct"]
        for i in range(len(gp_sorted) - 1):
            a, b = gp_sorted[i], gp_sorted[i + 1]
            if a["year"] <= current_year <= b["year"]:
                if b["year"] == a["year"]:
                    cur_stock = a["stock_pct"]
                else:
                    ratio = (current_year - a["year"]) / (b["year"] - a["year"])
                    cur_stock = a["stock_pct"] + ratio * (b["stock_pct"] - a["stock_pct"])
                break
        else:
            if current_year > gp_sorted[-1]["year"]:
                cur_stock = gp_sorted[-1]["stock_pct"]

        items[tid] = {
            "id": tid,
            "name": t.get("name", tid),
            "asset_manager": t.get("asset_manager"),
            "target_year": target_year,
            "synthesized": True,
            "current_stock_pct": round(cur_stock, 1),
            "current_bond_pct": round(100 - cur_stock, 1),
            "glide_path": gp,
        }
    save_json(
        DATA_DIR / "tdf.json", {"updated_at": kst_now_iso(), "items": items}
    )
    print(f"[tdf] done. {len(items)} TDFs (synthesized glide-path).")
    return 0


if __name__ == "__main__":
    sys.exit(main())
