"""PDF -> 페이지별 PNG (고해상도)"""
import fitz  # PyMuPDF
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / ".tmp_pdf_pages"
OUT.mkdir(exist_ok=True)

PDFS = [
    (ROOT / "실적배당상품 pdf.pdf", "fund"),
    (ROOT / "이달의 펀드 pdf.pdf", "month"),
]

ZOOM = 3.0
mat = fitz.Matrix(ZOOM, ZOOM)

for pdf_path, prefix in PDFS:
    if not pdf_path.exists():
        print(f"MISSING: {pdf_path}")
        continue
    doc = fitz.open(pdf_path)
    for i, page in enumerate(doc):
        pix = page.get_pixmap(matrix=mat)
        out = OUT / f"{prefix}_p{i+1:02d}.png"
        pix.save(out)
    print(f"{pdf_path.name}: {len(doc)} pages -> {prefix}_pXX.png")
    doc.close()

print(f"\nTotal files in {OUT}: {len(list(OUT.glob('*.png')))}")
