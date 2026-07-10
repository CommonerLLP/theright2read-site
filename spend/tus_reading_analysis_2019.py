"""
TUS 2019 reading-for-leisure (ICATUS code 841) replication.

Five-level NSS structure (different from TUS 2024 single-file structure):
  L02 (level02.csv)        = person demographics (1 row per person per HH)
  L03 (level03.csv)        = HH demographics + consumption (social group, UMPCE)
  L04 (level04.csv)        = informant info (1 row per informant)
  L05 (TUS106_L05_{1-3})   = activity records (1 row per time slot per informant)

Join logic:
  L05.member_srl + hh_key → L02 (to get informant demographics)
  hh_key → L03 (to get caste, UMPCE)

hh_key = FSU Serial No + Stratum + Sub-Stratum + Sub-Round + FOD Sub-Region + Sample hhld No
"""
import pandas as pd
import numpy as np
from pathlib import Path

ROOT = Path(__file__).parent.parent
TUS = ROOT / 'notes' / 'poc' / 'tus' / 'tus2019'

def _i(s):
    """Coerce a column to integer-string form (handles float NaN-pollution)."""
    return pd.to_numeric(s, errors='coerce').fillna(-1).astype('int64').astype(str)

def hh_key(df):
    return (_i(df['FSU Serial No.']) + '_'
          + _i(df['Stratum']) + '_'
          + _i(df['Sub-Stratum']) + '_'
          + _i(df['Sub-Round']) + '_'
          + _i(df['FOD Sub-Region']) + '_'
          + _i(df['Sample hhld. No.']))

# ── L03: household demographics (caste, religion, UMPCE) ──────────────────
print('Loading L03 (HH demographics)...')
l03 = pd.read_csv(TUS / 'level03.csv', low_memory=False)
print(f'  L03 cols: {len(l03.columns)}, rows: {len(l03):,}')

# Find UMPCE column — last big consumption value, varies in name
umpce_col = [c for c in l03.columns if 'usual monthly' in c.lower() and 'consumer' in c.lower()]
if not umpce_col:
    umpce_col = [c for c in l03.columns if 'A+B+C' in c]
print(f'  UMPCE col found: {umpce_col}')
umpce_col = umpce_col[0] if umpce_col else None

sg_map = {1: 'ST', 2: 'SC', 3: 'OBC', 9: 'Others'}
l03['caste'] = l03['Social group '].map(sg_map) if 'Social group ' in l03.columns else l03['Social group'].map(sg_map)
l03['hhkey'] = hh_key(l03)

# Compute UMPCE quintile (per capita, weighted by HH-size × MULT)
if umpce_col and 'Household size' in l03.columns and 'MULT' in l03.columns:
    l03['umpce_pc'] = l03[umpce_col] / l03['Household size']
    l03['pop_weight'] = l03['Household size'] * l03['MULT']
    l03_clean = l03.dropna(subset=['umpce_pc', 'pop_weight']).sort_values('umpce_pc').reset_index(drop=True)
    cum = l03_clean['pop_weight'].cumsum() / l03_clean['pop_weight'].sum()
    l03_clean['umpce_quintile'] = pd.cut(cum, bins=[0, 0.2, 0.4, 0.6, 0.8, 1.01],
                                          labels=[1, 2, 3, 4, 5])
    l03_clean['umpce_quintile'] = l03_clean['umpce_quintile'].cat.add_categories([0]).fillna(0).astype(int)
    l03 = l03_clean
else:
    print('  WARN: UMPCE/HH-size/MULT missing, skipping quintile')
    l03['umpce_quintile'] = 0
    l03['umpce_pc'] = np.nan

hh_dem = l03[['hhkey', 'caste', 'umpce_quintile', 'umpce_pc']].drop_duplicates('hhkey')
print(f'  Unique HH: {len(hh_dem):,}, with caste: {hh_dem["caste"].notna().sum():,}')

# ── L02: person demographics ─────────────────────────────────────────────
print('\nLoading L02 (person demographics)...')
l02 = pd.read_csv(TUS / 'level02.csv', low_memory=False)
print(f'  L02 cols: {len(l02.columns)}, rows: {len(l02):,}')

# Person srl, gender, age, education
l02['hhkey'] = hh_key(l02)
l02['pkey'] = l02['hhkey'] + '_' + _i(l02['Person serial no.'])
print(f'  Unique persons: {l02["pkey"].nunique():,}')

# Select demographic cols (handle slight naming variations)
gender_col = [c for c in l02.columns if c.lower().strip() == 'gender']
age_col = [c for c in l02.columns if c.lower().strip() == 'age']
ed_col = [c for c in l02.columns if 'highest level of education' in c.lower()]
sector_col = [c for c in l02.columns if c.lower().strip() == 'sector']

pkey_demo = l02[['hhkey', 'pkey',
                 gender_col[0] if gender_col else 'Gender',
                 age_col[0] if age_col else 'Age',
                 ed_col[0] if ed_col else 'highest level of education',
                 sector_col[0] if sector_col else 'Sector']].copy()
pkey_demo.columns = ['hhkey', 'pkey', 'gender', 'age', 'education', 'sector']
print(f'  Person demo rows: {len(pkey_demo):,}')

# ── L05: activity records (3 parts) ──────────────────────────────────────
print('\nLoading L05 activity files (3 parts, ~930 MB total)...')
act_files = ['TUS106_L05_1.csv', 'TUS106_L05_2.csv', 'TUS106_L05_3.csv']
act_chunks = []
for fname in act_files:
    print(f'  Loading {fname}...')
    df = pd.read_csv(TUS / fname, dtype={'3-didit activity code': str}, low_memory=False)
    # The TUS 2019 column has typo: '3-didit activity code' (sic)
    code_col = [c for c in df.columns if 'activity code' in c.lower()][0]
    df.rename(columns={code_col: 'act_code'}, inplace=True)
    act_chunks.append(df)
    print(f'    {len(df):,} rows')

l05 = pd.concat(act_chunks, ignore_index=True)
del act_chunks
print(f'  L05 total rows: {len(l05):,}')

# Build join key — L05 has Serial no. of member (informant) which is person srl
l05['hhkey'] = hh_key(l05)
member_col = [c for c in l05.columns if 'serial no.of member' in c.lower() or 'serial no. of member' in c.lower()]
if not member_col:
    member_col = [c for c in l05.columns if 'no.of member' in c.lower() or 'no. of member' in c.lower()]
print(f'  Member col: {member_col}')
member_col = member_col[0]
l05['pkey'] = l05['hhkey'] + '_' + _i(l05[member_col])

# Filter to major activity
major_col = [c for c in l05.columns if 'major activity' in c.lower()][0]
l05_major = l05[l05[major_col] == 1].copy()
print(f'  After major-activity filter: {len(l05_major):,}')

# Activity engagement flags
l05_major['is_reading'] = (l05_major['act_code'] == '841').astype(int)
l05_major['is_tv'] = (l05_major['act_code'] == '842').astype(int)
l05_major['is_radio'] = (l05_major['act_code'] == '843').astype(int)
l05_major['is_mm_other'] = (l05_major['act_code'] == '849').astype(int)

# Time per slot in minutes
def parse_hhmm_col(col):
    """Convert HH:MM or HHMM column to minutes since midnight."""
    s = l05_major[col].astype(str).str.zfill(4)
    # If colon present, split it; else assume HHMM
    has_colon = s.str.contains(':')
    if has_colon.any():
        sp = s.str.split(':', expand=True)
        return pd.to_numeric(sp[0], errors='coerce') * 60 + pd.to_numeric(sp[1], errors='coerce')
    else:
        return pd.to_numeric(s.str[:2], errors='coerce') * 60 + pd.to_numeric(s.str[2:], errors='coerce')

tf_col = [c for c in l05.columns if 'time from' in c.lower()][0]
tt_col = [c for c in l05.columns if 'time to' in c.lower()][0]
l05_major['mins_from'] = parse_hhmm_col(tf_col)
l05_major['mins_to'] = parse_hhmm_col(tt_col)
l05_major['slot_mins'] = l05_major['mins_to'] - l05_major['mins_from']
l05_major.loc[l05_major['slot_mins'] < 0, 'slot_mins'] += 1440

l05_major['reading_mins'] = l05_major['is_reading'] * l05_major['slot_mins']
l05_major['tv_mins'] = l05_major['is_tv'] * l05_major['slot_mins']

# Per-person aggregates
print('\nAggregating to person level...')
mult_col = [c for c in l05_major.columns if c.strip().upper() == 'MULT'][0]
age_l05 = [c for c in l05_major.columns if c.lower().strip() == 'age'][0]

# Fix MULT — in TUS 2019 the last column has NSC+MULT mashed with whitespace:
# e.g. "4   128155" means NSC=4, MULT=128155. Take the last whitespace-token.
def _parse_mult(s):
    if pd.isna(s): return 0
    s = str(s).strip().split()
    return float(s[-1]) if s else 0
l05_major[mult_col] = l05_major[mult_col].map(_parse_mult)

person = l05_major.groupby('pkey').agg(
    mult=(mult_col, 'first'),
    age_l05=(age_l05, 'first'),
    hhkey=('hhkey', 'first'),
    engaged_reading=('is_reading', 'max'),
    engaged_tv=('is_tv', 'max'),
    engaged_radio=('is_radio', 'max'),
    engaged_mm_other=('is_mm_other', 'max'),
    reading_mins=('reading_mins', 'sum'),
    tv_mins=('tv_mins', 'sum'),
).reset_index()
print(f'  Informant-persons in L05: {len(person):,}')

# Merge with person demographics — drop pkey_demo's hhkey to avoid collision
pkey_demo_min = pkey_demo.drop(columns=['hhkey'])
person = person.merge(pkey_demo_min, on='pkey', how='left')
person.loc[person['age'].isna(), 'age'] = person.loc[person['age'].isna(), 'age_l05']
person = person[person['age'] >= 6].copy()
print(f'  After age 6+ filter: {len(person):,}')

# Debug: sample person hhkey vs hh_dem hhkey
print(f'  person.hhkey sample: {person["hhkey"].iloc[0]!r}')
print(f'  hh_dem.hhkey sample: {hh_dem["hhkey"].iloc[0]!r}')
print(f'  hhkey intersection: {len(set(person["hhkey"]) & set(hh_dem["hhkey"])):,}')

# Merge with HH demographics
person = person.merge(hh_dem, on='hhkey', how='left')
print(f'  After HH merge: {len(person):,}')
print(f'  With caste: {person["caste"].notna().sum():,}')

# ── Compute cuts (same as TUS 2024 analysis) ──────────────────────────────
def pw_pct(g, col):
    return (g[col] * g['mult']).sum() / g['mult'].sum() * 100

def pw_mins(g, col):
    return (g[col] * g['mult']).sum() / g['mult'].sum()

def cut_table(df, cut_col, cut_label):
    rows = []
    for val, g in df.groupby(cut_col):
        if pd.isna(val): continue
        rows.append({
            'cut': cut_label,
            'value': val,
            'n': len(g),
            'reading_pct': pw_pct(g, 'engaged_reading'),
            'tv_pct': pw_pct(g, 'engaged_tv'),
            'reading_min_pp': pw_mins(g, 'reading_mins'),
            'tv_min_pp': pw_mins(g, 'tv_mins'),
        })
    return pd.DataFrame(rows)

tables = [pd.DataFrame([{
    'cut': 'all', 'value': 'All India', 'n': len(person),
    'reading_pct': pw_pct(person, 'engaged_reading'),
    'tv_pct': pw_pct(person, 'engaged_tv'),
    'reading_min_pp': pw_mins(person, 'reading_mins'),
    'tv_min_pp': pw_mins(person, 'tv_mins'),
}])]
tables.append(cut_table(person, 'caste', 'caste'))
tables.append(cut_table(person, 'umpce_quintile', 'umpce_quintile'))
tables.append(cut_table(person, 'education', 'education'))
tables.append(cut_table(person, 'sector', 'sector'))
tables.append(cut_table(person, 'gender', 'gender'))

for c in ['ST', 'SC', 'OBC', 'Others']:
    sub = person[person['caste'] == c]
    if len(sub) == 0: continue
    for g in [1, 2]:
        sub2 = sub[sub['gender'] == g]
        if len(sub2) == 0: continue
        tables.append(pd.DataFrame([{
            'cut': 'caste×gender', 'value': f'{c}_{"M" if g==1 else "F"}',
            'n': len(sub2),
            'reading_pct': pw_pct(sub2, 'engaged_reading'),
            'tv_pct': pw_pct(sub2, 'engaged_tv'),
            'reading_min_pp': pw_mins(sub2, 'reading_mins'),
            'tv_min_pp': pw_mins(sub2, 'tv_mins'),
        }]))

result = pd.concat(tables, ignore_index=True)
result['year'] = 2019

out = TUS.parent / 'results_tus2019.tsv'
result.to_csv(out, sep='\t', index=False, float_format='%.3f')
print(f'\nSaved: {out}')
print('\n=== TUS 2019 RESULTS ===')
print(result.to_string(index=False))
