# 아빠 퇴직연금 — 신한투자증권 ETF/TDF 분석

신한투자증권 퇴직연금에서 **실제 매수 가능한** ETF/TDF만 토스증권 스타일로 보여주는
정적 SPA. 어려운 종목명을 한 줄로 풀어주고, 추종 지수·보유종목·수수료·시세·가격 상태·뉴스를
한 화면에서 본다.

> **이 사이트는 투자 판단 참고용입니다. 매수 추천이 아니며, 실제 매매는 신한투자증권
> MTS에서 본인 판단으로 진행하세요.**

## 스택

- **Vite + React 19 + TypeScript + TailwindCSS** — 정적 SPA
- **Recharts** — 차트
- **Python (pykrx + BS4)** — KRX/운용사/뉴스 데이터 수집
- **GitHub Actions** — 평일 KST 18시 자동 데이터 갱신 → 자동 커밋
- **Cloudflare Pages** — 정적 호스팅 (Next.js 안 씀)

## 디렉토리

```
src/                React SPA
scripts/            Python 데이터 수집 스크립트
data/               빌드 산출물 (수집 직후)
public/data/        SPA가 fetch하는 경로 (data/ 미러)
.github/workflows/  cron 데이터 갱신
```

## 진실의 원천: `data/shinhan_lineup.yaml`

신한 사이트는 비로그인으로 운용상품 목록을 보여주지 않는다. 따라서 아빠 MTS에서 매수 가능한
종목을 **수기로 한 번 입력**해 두면, 이후 모든 자동 수집·표시가 이 파일을 기반으로 동작한다.

```yaml
etf:
  - ticker: "069500"     # KRX 6자리
    nickname: "한국 대형주 200개 통째로"
tdf:
  - id: TDF2030_MIRAE
    name: "미래에셋전략배분TDF2030혼합자산자투자신탁"
    asset_manager: "미래에셋자산운용"
    target_year: 2030
```

> **여기 없는 종목은 사이트에 표시되지 않는다.** "실제 못 사는 걸 보여주지 말자"는 원칙.

## 로컬 개발

```bash
npm install
npm run dev         # http://localhost:5173
```

데이터 갱신(로컬):
```bash
cd scripts
pip install -r requirements.txt
python fetch_etf_basics.py        # KRX 시세/이름/수익률
python fetch_etf_holdings.py      # 운용사 사이트 보유종목 (best-effort)
python fetch_tdf.py               # TDF 글라이드패스 (합성)
python fetch_news.py              # NAVER 뉴스
python build_products_json.py     # 합쳐서 public/data/로 복사
```

## 배포 (Cloudflare Pages)

1. GitHub에 푸시
2. Cloudflare 대시보드 → Pages → "Connect to Git" → 이 레포 선택
3. 빌드 설정
   - **Framework preset**: None
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Node version**: 20 이상
4. `public/_redirects`가 SPA 라우팅 처리 (`/* /index.html 200`)
5. GitHub Actions가 평일 18시(KST) 데이터 커밋 → Cloudflare가 자동 재배포

## 화면

- `/` — 카테고리 칩 + 정렬(수익률/보수/자산) + 카드 그리드
- `/p/:id` — 한 줄 설명, 차트, 기간별 수익률, 현재 가격 상태(MA200·RSI·분위), 수수료 비교, 보유 도넛, 뉴스
- `/compare` — 최대 4종 비교 테이블

## 면책

매수/매도 추천이 아닙니다. "현재 가격이 200일선 위/아래", "1년 가격대 어디 위치" 같이
**사실만** 보여줍니다. TDF 글라이드패스의 일부는 운용사 공시가 들어오기 전까지 **합성 추정치**이며
실제와 다를 수 있습니다.

## 데이터 출처

- 시세·기본정보: 한국거래소(KRX) 정보데이터시스템 (`pykrx`)
- 보유종목: 각 운용사 공식 페이지 (KODEX / TIGER 등)
- TDF: 운용사 펀드 상세 페이지 (점진 확장)
- 뉴스: NAVER 뉴스 검색
