"""신한 PDF에서 펀드명/수익률 추출 → JSON"""
import pdfplumber
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT_TXT = ROOT / "scripts" / "_pdf_dump.txt"


def dump_pdf(pdf_path: Path, label: str, fh):
    fh.write(f"\n\n========== {label} : {pdf_path.name} ==========\n")
    with pdfplumber.open(pdf_path) as pdf:
        fh.write(f"# pages: {len(pdf.pages)}\n")
        for i, page in enumerate(pdf.pages):
            fh.write(f"\n--- PAGE {i+1} ---\n")
            # 텍스트 그대로
            text = page.extract_text() or ""
            fh.write(text)
            fh.write("\n")
            # 표가 있으면 표도
            try:
                tables = page.extract_tables()
                for ti, t in enumerate(tables):
                    fh.write(f"\n[TABLE {ti+1}]\n")
                    for row in t:
                        fh.write(" | ".join((c or "").strip() for c in row))
                        fh.write("\n")
            except Exception as e:
                fh.write(f"[table error: {e}]\n")


def main():
    pdfs = [
        (ROOT / "실적배당상품 pdf.pdf", "실적배당상품"),
        (ROOT / "이달의 펀드 pdf.pdf", "이달의 펀드"),
    ]
    with open(OUT_TXT, "w", encoding="utf-8") as fh:
        for p, label in pdfs:
            if p.exists():
                dump_pdf(p, label, fh)
                print(f"OK: {p.name}")
            else:
                print(f"MISSING: {p.name}")
    print(f"\nDumped to: {OUT_TXT}")
    print(f"Size: {OUT_TXT.stat().st_size:,} bytes")


if __name__ == "__main__":
    main()
