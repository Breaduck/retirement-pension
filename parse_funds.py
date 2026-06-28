#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import json, re, sys, os

TRANSCRIPT = r'C:\Users\hiyoo\.claude\projects\C--Users-hiyoo----money\cf505d52-1322-47d8-9835-ef3507f5b7f9.jsonl'
OUTPUT = r'C:\Users\hiyoo\코딩\money\public\data\products.json'

# ── Read raw fund text from JSONL ──────────────────────────────────────────
raw = ''
with open(TRANSCRIPT, encoding='utf-8') as f:
    for line in f:
        line = line.strip()
        if not line:
            continue
        try:
            obj = json.loads(line)
        except Exception:
            continue
        for get_content in [
            lambda o: o.get('message', {}).get('content', ''),
            lambda o: o.get('content', ''),
        ]:
            try:
                content = get_content(obj)
                if isinstance(content, list):
                    text = ''.join(b.get('text', '') for b in content
                                   if isinstance(b, dict) and b.get('type') == 'text')
                elif isinstance(content, str):
                    text = content
                else:
                    text = ''
                if len(text) > 20000 and '매수' in text and '수수료미징구' in text:
                    raw = text
                    break
            except Exception:
                pass
        if raw:
            break

if not raw:
    sys.exit('ERROR: Could not find fund data in transcript')

print(f'[OK] Found raw text ({len(raw):,} chars)', file=sys.stderr)

# ── Mapping tables ──────────────────────────────────────────────────────────
CAT_MAP = {
    '해외선진':   'global_stock',
    '해외이머징': 'global_stock',
    '해외이머장': 'global_stock',
    '해외이머짐': 'global_stock',
    '국내주식':   'kr_stock',
    '국내채권':   'bond',
    '해외채권':   'bond',
    '대안투자':   'reit_infra',
    '구조화상품': 'bond',
}
RISK_LEVELS = [
    '매우높은위험', '높은위험', '다소높은위험',
    '보통위험', '낮은위험', '매우낮은위험', '매우낮은위협',
]
RISK_PAT = '|'.join(RISK_LEVELS)
CAT_PAT  = '|'.join(CAT_MAP.keys())

BRACKET_TYPES = '주식|채권|채권혼합|주식혼합|혼합|리츠|REITS|대출채권|특별자산|혼합자산'
BRACKET_RE = re.compile(r'\[(?:' + BRACKET_TYPES + r')[^\]]*\]')
NUM_RE     = re.compile(r'-?\d+(?:[.,]\d+)?')

def parse_num(s):
    try:
        return round(float(str(s).replace(',', '.')), 2)
    except Exception:
        return None

def is_year(v):
    return v is not None and 2000.0 <= v <= 2100.0

def get_category(cat_text, name):
    n = name.upper()
    if 'TDF' in n:
        return 'tdf'
    if '원리금' in name:
        return 'principal_guaranteed'
    if cat_text in CAT_MAP:
        return CAT_MAP[cat_text]
    if 'REITS' in n or '리츠' in name:
        return 'reit_infra'
    if '골드' in name or 'GOLD' in n:
        return 'commodity'
    if '천연자원' in name or '원자재' in name or '유가' in name:
        return 'commodity'
    return 'global_stock'

def extract_num_block(data_section, gap_threshold=10):
    """
    Find the largest cluster of non-year numbers in data_section where
    consecutive numbers are within gap_threshold characters of each other.

    Return numbers are always tightly packed (1 space apart).  Numbers
    embedded in fund names (e.g. '1' in '신탁1호') are separated by
    many Korean characters, so they end up in a different (smaller) block.

    Returns (nums_list, end_pos_after_last_num) or ([], 0).
    """
    all_matches = []
    for m in NUM_RE.finditer(data_section):
        v = parse_num(m.group(0))
        if v is not None and not is_year(v):
            all_matches.append((m.start(), m.end(), v))

    if not all_matches:
        return [], 0

    # Group into clusters by proximity
    blocks = [[all_matches[0]]]
    for i in range(1, len(all_matches)):
        prev_end = all_matches[i - 1][1]
        curr_start = all_matches[i][0]
        if curr_start - prev_end <= gap_threshold:
            blocks[-1].append(all_matches[i])
        else:
            blocks.append([all_matches[i]])

    # Use the largest cluster
    best = max(blocks, key=len)
    nums    = [v for _, _, v in best]
    end_pos = best[-1][1]
    return nums, end_pos


# ── Preprocess ──────────────────────────────────────────────────────────────
text = raw
text = re.sub(r'[☐□Π①②③④⑤♡ⓐ]', ' ', text)
stop = re.search(r'① 확인하세요', text)
if stop:
    text = text[:stop.start()]

segments = re.split(r'(?<=매수)', text)
products = []
pid = 1
seen = set()

# ── Parse each segment ──────────────────────────────────────────────────────
for seg in segments:
    seg = seg.strip()
    if len(seg) < 15:
        continue

    # Risk level
    risk_match = re.search(RISK_PAT, seg)
    if not risk_match:
        continue
    risk_level = risk_match.group(0)

    # Category label
    cat_matches = list(re.finditer(CAT_PAT, seg))
    cat_text = cat_matches[-1].group(0) if cat_matches else ''

    # Fund-type bracket anchor (e.g. [주식], [혼합자산])
    bracket_match = BRACKET_RE.search(seg)
    if not bracket_match:
        continue

    before = seg[:bracket_match.start()]
    after  = seg[bracket_match.end():]

    # Use the FIRST occurrence of '퇴직연금'/'계열사펀드' as the anchor.
    # (Fund names also contain '퇴직연금', so taking the last occurrence
    # would land inside the fund name and miss all the return numbers.)
    pension_match = re.search(r'퇴직연금|계열사펀드', before)
    if pension_match:
        data_section = before[pension_match.end():]
    else:
        # fallback: start after risk + category labels
        start = max(
            risk_match.end(),
            cat_matches[-1].end() if cat_matches else 0,
        )
        data_section = before[start:]

    # Find the densest cluster of non-year numbers in data_section.
    # Return numbers are tightly packed (1-space apart); numbers embedded
    # inside the fund name prefix (e.g. '1' in '신탁1호') are far away.
    leading_nums, leading_end = extract_num_block(data_section, gap_threshold=2)

    if len(leading_nums) < 2:
        continue

    aum     = leading_nums[-1]
    returns = leading_nums[:-1]

    # Fund name prefix = text after the number cluster
    name_prefix = data_section[leading_end:].strip()

    # Suffix: text after bracket until next risk level or end
    name_suffix = re.sub(r'매수.*$', '', after, flags=re.DOTALL).strip()
    next_risk = re.search(RISK_PAT, name_suffix)
    if next_risk:
        name_suffix = name_suffix[:next_risk.start()].strip()
    name_suffix = re.sub(r'\s+', ' ', name_suffix).strip()

    raw_name = (name_prefix + bracket_match.group(0)
                + (' ' + name_suffix if name_suffix else '')).strip()
    raw_name = re.sub(r'\b(?:수수료\S*|온라인|퇴직연금|계열사펀드|Q)\b', '', raw_name)
    raw_name = re.sub(r'\s+', ' ', raw_name).strip()

    if not raw_name or len(raw_name) < 5:
        continue

    key = re.sub(r'\s+', '', raw_name)
    if key in seen:
        continue
    seen.add(key)

    n       = len(returns)
    r1m     = returns[0] if n >= 1 else None
    r3m     = returns[1] if n >= 2 else None
    r6m     = returns[2] if n >= 3 else None
    r1y     = returns[3] if n >= 4 else None
    r3y     = returns[4] if n >= 5 else None
    r_since = returns[5] if n >= 6 else None

    category = get_category(cat_text, raw_name)
    kind     = 'tdf' if category == 'tdf' else 'fund'

    p = {
        'id':         f'SH_{pid:03d}',
        'kind':       kind,
        'name':       raw_name,
        'nickname':   None,
        'category':   category,
        'risk_level': risk_level,
    }
    if r1m     is not None: p['return_1m']    = r1m
    if r3m     is not None: p['return_3m']    = r3m
    if r6m     is not None: p['return_6m']    = r6m
    if r1y     is not None: p['return_1y']    = r1y
    if r3y     is not None: p['return_3y']    = r3y
    if r_since is not None: p['return_since'] = r_since
    if aum     is not None: p['aum']          = aum

    products.append(p)
    pid += 1

out = {
    'updated_at':  '2026-06-26T00:00:00.000Z',
    'source_note': '신한투자증권 퇴직연금 실적배당상품 (2026.06.26 기준)',
    'products':    products,
}
os.makedirs(os.path.dirname(OUTPUT), exist_ok=True)
with open(OUTPUT, 'w', encoding='utf-8') as f:
    json.dump(out, f, ensure_ascii=False, indent=2)
print(f'[OK] {len(products)} products written')
