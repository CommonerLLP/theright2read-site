"""
TUS 2024 reading-for-leisure (ICATUS code 841) isolation and demographic cuts.

Loads:
  - tus2024/TUS106PER.csv  (1.2 GB; 10.2M activity-slot records joined with person demographics)
  - tus2024/household.csv  (139,490 households with social group, UMPCE, sector)

Joins on: FSU Serial No + Stratum + Sub-Stratum + Sub-Round + FOD Sub-Region + Sample hhld No

Outputs:
  - notes/poc/tus/results_tus2024.tsv  (engagement % by demographic cut)
  - Printed summary tables

Activity code reference (from TUS 2024 Instructions, p.3945-3948):
  841 - Reading for leisure
  842 - Watching/listening to television and videos
  843 - Listening to radio and audio devices
  849 - Other mass media use
"""
import pandas as pd
import numpy as np
from pathlib import Path

ROOT = Path(__file__).parent.parent
TUS = ROOT / 'notes' / 'poc' / 'tus'

# ── Load household file (small) ──────────────────────────────────────────
print('Loading household file...')
hh_cols = ['FSU Serial No.', 'Stratum', 'Sub-Stratum', 'Sub-Round',
           'FOD Sub-Region', 'Sample hhld. No.', 'Sector',
           'Social group ', 'religion',
           'usual monthly consumer expenditure E: [A+B+C+(D+E)/12]',
           'Household size', 'MULT']
hh = pd.read_csv(TUS / 'tus2024' / 'household.csv', usecols=hh_cols,
                 low_memory=False)
hh.rename(columns={
    'Social group ': 'social_group',
    'usual monthly consumer expenditure E: [A+B+C+(D+E)/12]': 'umpce',
    'Household size': 'hh_size',
    'MULT': 'hh_mult'
}, inplace=True)
print(f'  Households: {len(hh):,}')

# Per-capita monthly expenditure
hh['umpce_pc'] = hh['umpce'] / hh['hh_size']

# Compute UMPCE quintiles weighted by household population (hh_size × mult)
# Drop rows with missing umpce_pc or hh_size before cutting
hh['pop_weight'] = hh['hh_size'] * hh['hh_mult']
hh_clean = hh.dropna(subset=['umpce_pc', 'pop_weight']).sort_values('umpce_pc').reset_index(drop=True)
cum = hh_clean['pop_weight'].cumsum() / hh_clean['pop_weight'].sum()
hh_clean['umpce_quintile'] = pd.cut(cum, bins=[0, 0.2, 0.4, 0.6, 0.8, 1.01],
                                     labels=[1, 2, 3, 4, 5])
hh_clean['umpce_quintile'] = hh_clean['umpce_quintile'].cat.add_categories([0]).fillna(0).astype(int)
hh = hh_clean

# Map social group codes (TUS standard: 1=ST, 2=SC, 3=OBC, 9=Others/General)
sg_map = {1: 'ST', 2: 'SC', 3: 'OBC', 9: 'Others'}
hh['caste'] = hh['social_group'].map(sg_map)

# Build household join key
def hh_key(df):
    return (df['FSU Serial No.'].astype(str) + '_'
          + df['Stratum'].astype(str) + '_'
          + df['Sub-Stratum'].astype(str) + '_'
          + df['Sub-Round'].astype(str) + '_'
          + df['FOD Sub-Region'].astype(str) + '_'
          + df['Sample hhld. No.'].astype(str))

hh['hhkey'] = hh_key(hh)
hh_small = hh[['hhkey', 'caste', 'umpce_quintile', 'umpce_pc']].drop_duplicates('hhkey')
print(f'  Unique HH keys: {len(hh_small):,}')

# ── Load person/activity file (1.2 GB, chunked) ───────────────────────────
print('\nLoading TUS 2024 person/activity file (chunked)...')
per_cols = ['FSU Serial No.', 'Stratum', 'Sub-Stratum', 'Sub-Round',
            'FOD Sub-Region', 'Sample hhld. No.',
            'Person serial no.', 'Sector', 'Gender', 'Age',
            'highest level of education',
            '3-digit activity code', 'whether a major activity',
            'time from (HH:MM)', 'time to (HH:MM)',
            'MULT']

# Read with str dtype on activity code to preserve leading zero
chunks = []
for i, chunk in enumerate(pd.read_csv(
    TUS / 'tus2024' / 'TUS106PER.csv',
    usecols=per_cols,
    dtype={'3-digit activity code': str},
    chunksize=1_000_000, low_memory=False)):
    chunks.append(chunk)
    print(f'  chunk {i+1}: {len(chunk):,} rows (cumulative {sum(len(c) for c in chunks):,})')

per = pd.concat(chunks, ignore_index=True)
print(f'  Total activity-slot rows: {len(per):,}')
del chunks

# Filter to major activity only (the principal activity in each time slot)
per = per[per['whether a major activity'] == 1].copy()
print(f'  After major-activity filter: {len(per):,}')

# Per-person key + per-household key
per['hhkey'] = hh_key(per)
per['pkey'] = per['hhkey'] + '_' + per['Person serial no.'].astype(str)

# Compute time spent per slot in minutes (parse HH:MM)
def to_mins(s):
    try:
        h, m = str(s).split(':')
        return int(h) * 60 + int(m)
    except Exception:
        return None

# Vectorise: split & convert
tf = per['time from (HH:MM)'].astype(str).str.split(':', expand=True)
tt = per['time to (HH:MM)'].astype(str).str.split(':', expand=True)
per['mins_from'] = pd.to_numeric(tf[0], errors='coerce') * 60 + pd.to_numeric(tf[1], errors='coerce')
per['mins_to'] = pd.to_numeric(tt[0], errors='coerce') * 60 + pd.to_numeric(tt[1], errors='coerce')
per['slot_mins'] = per['mins_to'] - per['mins_from']
per.loc[per['slot_mins'] < 0, 'slot_mins'] += 1440  # wrap midnight

# Flag rows for activities of interest
per['is_reading'] = (per['3-digit activity code'] == '841').astype(int)
per['is_tv'] = (per['3-digit activity code'] == '842').astype(int)
per['is_radio'] = (per['3-digit activity code'] == '843').astype(int)
per['is_mm_other'] = (per['3-digit activity code'] == '849').astype(int)
per['is_mm_any'] = ((per['is_reading'] | per['is_tv'] | per['is_radio'] | per['is_mm_other']) > 0).astype(int)

# Reading minutes per slot
per['reading_mins'] = per['is_reading'] * per['slot_mins']
per['tv_mins'] = per['is_tv'] * per['slot_mins']

# Per-person aggregates
print('\nAggregating to person level...')
person = per.groupby('pkey').agg(
    sector=('Sector', 'first'),
    gender=('Gender', 'first'),
    age=('Age', 'first'),
    education=('highest level of education', 'first'),
    mult=('MULT', 'first'),
    hhkey=('hhkey', 'first'),
    engaged_reading=('is_reading', 'max'),
    engaged_tv=('is_tv', 'max'),
    engaged_radio=('is_radio', 'max'),
    engaged_mm_other=('is_mm_other', 'max'),
    reading_mins=('reading_mins', 'sum'),
    tv_mins=('tv_mins', 'sum'),
).reset_index()
print(f'  Unique persons (age 6+): {len(person):,}')

# Filter to age 6+ (TUS convention)
person = person[person['age'] >= 6].copy()
print(f'  After age 6+ filter: {len(person):,}')

# Join with household demographics
person = person.merge(hh_small, on='hhkey', how='left')
print(f'  After HH merge: {len(person):,}')
print(f'  Persons with caste: {person["caste"].notna().sum():,}')

# Population-weighted engagement %
def pw_pct(g, col):
    return (g[col] * g['mult']).sum() / g['mult'].sum() * 100

def pw_minutes(g, col):
    # Mins per person per day (population-average)
    return (g[col] * g['mult']).sum() / g['mult'].sum()

def cut_table(person_df, cut_col, cut_label):
    rows = []
    for val, g in person_df.groupby(cut_col):
        if pd.isna(val): continue
        row = {
            'cut': cut_label,
            'value': val,
            'n': len(g),
            'reading_pct': pw_pct(g, 'engaged_reading'),
            'tv_pct': pw_pct(g, 'engaged_tv'),
            'reading_min_pp': pw_minutes(g, 'reading_mins'),
            'tv_min_pp': pw_minutes(g, 'tv_mins'),
        }
        rows.append(row)
    return pd.DataFrame(rows)

# Compute all cuts
tables = []
tables.append(pd.DataFrame([{
    'cut': 'all',
    'value': 'All India',
    'n': len(person),
    'reading_pct': pw_pct(person, 'engaged_reading'),
    'tv_pct': pw_pct(person, 'engaged_tv'),
    'reading_min_pp': pw_minutes(person, 'reading_mins'),
    'tv_min_pp': pw_minutes(person, 'tv_mins'),
}]))
tables.append(cut_table(person, 'caste', 'caste'))
tables.append(cut_table(person, 'umpce_quintile', 'umpce_quintile'))
tables.append(cut_table(person, 'education', 'education'))
tables.append(cut_table(person, 'sector', 'sector'))
tables.append(cut_table(person, 'gender', 'gender'))

# Caste × gender
for c in ['ST', 'SC', 'OBC', 'Others']:
    sub = person[person['caste'] == c]
    if len(sub) == 0: continue
    for g in [1, 2]:
        sub2 = sub[sub['gender'] == g]
        if len(sub2) == 0: continue
        tables.append(pd.DataFrame([{
            'cut': 'caste×gender',
            'value': f'{c}_{"M" if g==1 else "F"}',
            'n': len(sub2),
            'reading_pct': pw_pct(sub2, 'engaged_reading'),
            'tv_pct': pw_pct(sub2, 'engaged_tv'),
            'reading_min_pp': pw_minutes(sub2, 'reading_mins'),
            'tv_min_pp': pw_minutes(sub2, 'tv_mins'),
        }]))

result = pd.concat(tables, ignore_index=True)
result['year'] = 2024

out = TUS / 'results_tus2024.tsv'
result.to_csv(out, sep='\t', index=False, float_format='%.3f')
print(f'\nSaved: {out}')
print('\n=== RESULTS ===')
print(result.to_string(index=False))
