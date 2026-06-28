# -*- coding: utf-8 -*-
"""
Parse Shinhan Securities retirement pension fund data from the raw text file.
Strategy: Process line by line, match fund names (with [주식]/[채권] brackets),
then associate with the preceding risk/subtype context and numbers.
"""
import json
import re
import sys

# Read the raw fund data
with open(r'C:\Users\hiyoo\코딩\money\public\data\raw_fund_data.txt', 'r', encoding='utf-8') as f:
    lines = f.readlines()

RISK_LEVELS = ['매우높은위험', '높은위험', '다소높은위험', '보통위험', '낮은위험', '매우낮은위험']
SUBTYPES = ['해외선진', '해외이머징', '국내주식', '국내채권', '해외채권', '대안투자', '구조화상품']
SUBTYPE_VARIANTS = {
    '해외이머장': '해외이머징',
    '해외이머짐': '해외이머징',
    '해외이머정': '해외이머징',
    '해외이머 ': '해외이머징',
}

SKIP_LINES = [
    '선택', '신한투자증권 |', '나의 자산 현황', '상품조회/매매', '이달의 펀드',
    '상품명', '상품구분', '상품유형', '위험도 해당없음', '비교하기', '나의투자성향',
    '펀드명', '수익률(%)', 'Q 검색', '기준', '설정일', '설정액', '(억원)', '주문',
    '1개월 3개월 6개월 1년 3년 이후', 'f b σ', 'W', '말로하는', '24시간',
    '확인하세요', 'COPYRIGHT', '개인정보', '고객지원센터', '총보수', '판매정보',
    '과거의 운용', '투자자는', '금융투자상품', '세율', '집합투자증권', '이벤트 전용',
    '야간국내파생', '해외사용자', 'WEB AWARD', '이게 실제 실적배당상품', 'Shinhan',
    '서울특별시', '인증센터', '82-2', '1588-', '02-37', 'Family Site', '대표이사',
    'Breaduck', '출근초단기', '사이트맵', '자산조회', '실적배당상품\n',
]

NOISE_TOKENS = {'매수', '☐', 'Π', '□', '☆', 'Q', '♡', 'α', 'a', '이', '①',
                '수수료미징구', '수수료선취', '수수료미정구', '수수료미칭구', '수수료이징',
                '수수료미', '온라인', '퇴직연금', '계열사펀드', '실적배당상품',
                '온라인:', '수수료'}


def should_skip(line):
    line = line.strip()
    if not line:
        return True
    for s in SKIP_LINES:
        if s in line:
            return True
    # Skip lines that are only noise tokens
    tokens = set(line.split())
    if tokens.issubset(NOISE_TOKENS | {'', 'Π', '☐'}):
        return True
    return False


def get_risk(line):
    for r in RISK_LEVELS:
        if r in line:
            return r
    return None


def get_subtype(line):
    for s in SUBTYPES:
        if s in line:
            return s
    for k, v in SUBTYPE_VARIANTS.items():
        if k in line:
            return v
    return None


def get_category(name, subtype):
    n = name
    # TDF
    if 'TDF' in n or 'tdf' in n.lower():
        return 'tdf'
    # 리츠/인프라
    if any(x in n for x in ['리츠', 'REITS', 'REITs', 'MLP', 'K리츠', '인프라', '부동산자투자신탁', '부동산자투자회사']):
        return 'reit_infra'
    if '부동산' in n and '채권' not in n and '주식' not in n:
        return 'reit_infra'
    # 원자재
    if any(x in n for x in ['골드', '광업주', '천연자원', 'iM에셋월드골드', 'iM에셋월드에너지']):
        return 'commodity'
    # 구조화상품 -> bond
    if subtype == '구조화상품':
        return 'bond'
    # 대안투자
    if subtype == '대안투자':
        if any(x in n for x in ['리츠', '부동산', '인프라']):
            return 'reit_infra'
        if any(x in n for x in ['골드', '광업', '원자재', '에너지', '금-재간접']):
            return 'commodity'
        return 'reit_infra'
    # 해외 주식
    if subtype in ('해외선진', '해외이머징'):
        # If it has bond indicators and no 주식 type
        if any(x in n for x in ['채권혼합', '국공채', '하이일드', '회사채', '단기채', '달러채권',
                                  '달러표시', '달러우량', '글로벌투자등급', '글로벌인컴', '인컴채권',
                                  '뱅크론', '인디아채권', '달러채']):
            return 'bond'
        return 'global_stock'
    # 국내주식
    if subtype == '국내주식':
        return 'kr_stock'
    # 채권류
    if subtype in ('국내채권', '해외채권'):
        return 'bond'
    # Infer from name
    if any(x in n for x in ['채권혼합', '채권혼합형', '국공채', '단기채', '하이일드', '크레딧',
                              '달러채권', '회사채', '달러표시', '뱅크론']):
        if '주식' not in n:
            return 'bond'
    if '[채권]' in n or '[채권혼합]' in n or '[채권 재간접형]' in n:
        return 'bond'
    if '[주식]' in n or '[주식혼합]' in n or '[주식 재간접형]' in n or '[주식혼합재간접형]' in n:
        # Check for overseas indicators
        if any(x in n for x in ['글로벌', '미국', '중국', '인도', '베트남', '아시아', '일본',
                                  '유럽', '아세안', '브라질', '이머징', '선진국', 'S&P', '나스닥',
                                  'NASDAQ', 'ChatAI', 'ChatAl', '픽테', '피델리티', '웰링턴',
                                  'AB셀렉트', 'AB미국', 'NH-Amundi글로벌', '해외', '재팬', '인도네시아',
                                  '차이나', '코리아리더스', '코리아', '코스피', 'KOSPI', 'KRX', 'KRX300',
                                  'KOSDAQ', '코스닥']):
            if any(x in n for x in ['코리아', '코스피', 'KOSPI', 'KRX', 'KOSDAQ', '코스닥',
                                     '한국', '국내', '삼성코리아', '한국밸류', 'KB코리아', '한국투자퇴직연금']):
                return 'kr_stock'
            return 'global_stock'
        # Default for mixed - if has Korea related terms
        if any(x in n for x in ['코리아', '코스피', 'KOSPI', 'KRX', '한국', '대한민국', '국내']):
            return 'kr_stock'
        return 'global_stock'
    # Mixed type (TDF-like,혼합)
    if '[혼합' in n or '혼합재간접형' in n or '혼합자산' in n:
        if 'TDF' in n:
            return 'tdf'
        return 'bond'
    return 'global_stock'


def parse_numbers(text):
    """Extract a sequence of return numbers and AUM from text."""
    # Match numbers like: -1.82, 27.74, 42.84, 88.27, etc.
    # Also handle comma-for-decimal like 232,97
    num_re = re.compile(r'-?\d{1,4}(?:[.,]\d{1,2})?')
    tokens = text.split()
    nums = []
    for tok in tokens:
        # Clean token
        tok_clean = re.sub(r'^[^-\d]*', '', tok)
        tok_clean = re.sub(r'[^-\d.,]*$', '', tok_clean)
        if not tok_clean:
            continue
        tok_clean = tok_clean.replace(',', '.')
        try:
            v = float(tok_clean)
            # Skip year-like values
            if 2000 <= v <= 2100:
                continue
            # Skip very large numbers (likely not returns or AUM in 억원)
            if abs(v) > 50000:
                continue
            nums.append(v)
        except:
            pass
    return nums


# ─── MAIN PARSING LOGIC ───────────────────────────────────────────────────────
# We'll process lines and build "contexts" containing:
#   - current_risk: most recently seen risk level
#   - current_subtype: most recently seen subtype
#   - pending_numbers: numbers seen before/after a fund name
#   - fund name (lines with [주식/채권/etc.])

# Fund name detection: line contains [주식] or similar bracket type
BRACKET_TYPES = ['주식', '채권', '혼합자산', '채권혼합', '주식혼합', 'REITS', '리츠',
                 '인프라', '금', '대출채권', '혼합', '재간접형']
BRACKET_RE = re.compile(r'\[(' + '|'.join(BRACKET_TYPES) + r')[^\]]*\]')

# Fund name characters: Korean, alphanumeric, special chars, but NOT random numbers
FUND_NAME_RE = re.compile(
    r'[가-힣A-Za-z0-9&\s\-_\+\.\'\"!\(\)\[\]]+?'
    r'\[(?:' + '|'.join(BRACKET_TYPES) + r')[^\]]*\]'
    r'[가-힣A-Za-z0-9&\s\-_\+\'\"\(\)\[\]\.]*'
)

products = []
fund_id = 1
seen_names = set()

# Process: group lines into "fund blocks"
# A fund block starts when we see a risk level line and continues until next risk level

current_risk = None
current_subtype = None
current_block_lines = []


def process_block(block_lines, risk, subtype):
    """Process a block of lines for a single fund."""
    global fund_id

    if not block_lines:
        return

    block_text = ' '.join(l.strip() for l in block_lines if l.strip())

    # Find fund name(s) in block
    names = FUND_NAME_RE.findall(block_text)

    if not names:
        return

    # Process each name separately
    for raw_name in names:
        # Clean the name
        name = raw_name.strip()
        # Remove noise from edges
        noise_prefixes = ['Π', '☐', '□', '☆', 'Q', 'α', 'a', 'A', '이', '①']
        for np in noise_prefixes:
            while name.startswith(np):
                name = name[len(np):].strip()
        noise_suffixes = ['매수', 'Q', '☐', 'Π', '□', '☆', '이', 'a', 'α', '♡', '0', '①', 'Q 매수']
        for ns in noise_suffixes:
            while name.endswith(ns):
                name = name[:-len(ns)].strip()

        # Ensure name actually contains Korean fund content
        if len(name) < 8:
            continue
        if not re.search(r'[가-힣]{2,}', name):
            continue
        if '신탁' not in name and '투자회사' not in name and '자산자투자' not in name:
            continue

        # Deduplicate
        # Normalize name for dedup
        name_key = re.sub(r'\s+', '', name)
        if name_key in seen_names:
            continue
        seen_names.add(name_key)

        # Extract numbers from block
        # Remove the fund name portion to avoid extracting numbers from it
        block_minus_name = block_text.replace(raw_name, ' ')
        # Also remove other fund names
        block_minus_names = FUND_NAME_RE.sub(' ', block_text)

        nums = parse_numbers(block_minus_names)

        ret_1m = ret_3m = ret_6m = ret_1y = ret_3y = ret_since = aum = None

        if len(nums) >= 7:
            ret_1m = nums[0]
            ret_3m = nums[1]
            ret_6m = nums[2]
            ret_1y = nums[3]
            ret_3y = nums[4]
            ret_since = nums[5]
            aum = nums[6]
        elif len(nums) == 6:
            ret_1m = nums[0]
            ret_3m = nums[1]
            ret_6m = nums[2]
            ret_1y = nums[3]
            ret_3y = nums[4]
            aum = nums[5]
        elif len(nums) == 5:
            ret_1m = nums[0]
            ret_3m = nums[1]
            ret_6m = nums[2]
            ret_1y = nums[3]
            aum = nums[4]
        elif len(nums) >= 3:
            ret_1m = nums[0]
            ret_3m = nums[1]
            aum = nums[-1]

        cat = get_category(name, subtype)

        product = {
            "id": f"SH_{fund_id:03d}",
            "kind": "fund",
            "name": name,
            "nickname": None,
            "category": cat,
            "risk_level": risk,
            "return_1m": ret_1m,
            "return_3m": ret_3m,
            "return_6m": ret_6m,
            "return_1y": ret_1y,
            "return_3y": ret_3y,
            "return_since": ret_since,
            "aum": aum,
            "expense_ratio": None
        }
        products.append(product)
        fund_id += 1


for raw_line in lines:
    line = raw_line.rstrip('\n')
    stripped = line.strip()

    # Stop at footer
    if any(p in stripped for p in ['COPYRIGHT', '개인정보처리방침', '확인하세요!', 'WEB AWARD', '이게 실제 실적배당상품']):
        break

    if should_skip(stripped):
        continue

    # Check if this line starts a new risk context
    new_risk = get_risk(stripped)
    if new_risk:
        # Process previous block
        if current_block_lines and current_risk:
            process_block(current_block_lines, current_risk, current_subtype)
        # Start new block
        current_risk = new_risk
        current_subtype = get_subtype(stripped)
        # Remaining content after removing risk/subtype tokens
        rest = stripped
        for r in RISK_LEVELS:
            rest = rest.replace(r, '')
        for s in SUBTYPES:
            rest = rest.replace(s, '')
        for k in SUBTYPE_VARIANTS:
            rest = rest.replace(k, '')
        for token in ['수수료미징구', '수수료선취', '수수료미정구', '수수료미칭구', '수수료이징',
                       '온라인', '퇴직연금', '계열사펀드', '수수료']:
            rest = rest.replace(token, ' ')
        rest = rest.strip()
        current_block_lines = [rest] if rest else []
    else:
        # Add to current block
        if current_risk:
            current_block_lines.append(stripped)
        # else: lines before any risk level (headers, etc.) - skip

# Process last block
if current_block_lines and current_risk:
    process_block(current_block_lines, current_risk, current_subtype)

print(f"Total products parsed: {len(products)}", file=sys.stderr)

# Show samples
for p in products[:15]:
    print(f"  {p['id']}: {p['name'][:55]} | cat={p['category']} | 3m={p['return_3m']} | aum={p['aum']}", file=sys.stderr)

# Write output JSON
output = {
    "updated_at": "2026-06-26T00:00:00.000Z",
    "source_note": "신한투자증권 퇴직연금 실적배당상품 (2026.06.26 기준)",
    "products": products
}

with open(r'C:\Users\hiyoo\코딩\money\public\data\products.json', 'w', encoding='utf-8') as f:
    json.dump(output, f, ensure_ascii=False, indent=2)

print("Done.", file=sys.stderr)
