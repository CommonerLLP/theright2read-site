#!/usr/bin/env python3
"""
TUS 2024 — Gujarat women's unpaid domestic + caregiving burden (for twenty27/GIDH).

Computed from raw unit-level microdata (TUS106PER.csv, 10.2M activity slots), NOT a
published summary — so it's ownable. Filters Gujarat (NSS state code 24; NSS-Region
241-245 → NSS-Region//10==24), then time on:
  - ICATUS division 3 (unpaid domestic services)  → activity code starts '3'
  - ICATUS division 4 (unpaid caregiving)          → activity code starts '4'
  - division 1 (employment, for the contrast)      → starts '1'
Weighted by MULT. Reports women vs men: avg min/day (all persons), participation %.
Output: twenty27/data/processed/tus_gujarat_women.json
"""
import json
import pandas as pd
from pathlib import Path

R2R = Path(__file__).resolve().parents[1]          # .../theright2read (no hardcoded path — audit S4)
TUS = R2R / "notes/poc/tus/tus2024"
OUT = R2R.parent / "twenty27/data/processed/tus_gujarat_women.json"
GUJ = 24  # NSS state code (sample confirmed standard NSS ordering)

cols = ['NSS-Region', 'FSU Serial No.', 'Stratum', 'Sub-Stratum', 'Sub-Round',
        'FOD Sub-Region', 'Sample hhld. No.', 'Person serial no.', 'Sector',
        'Gender', 'Age', '3-digit activity code', 'whether a major activity',
        'time from (HH:MM)', 'time to (HH:MM)', 'MULT']

parts = []
for i, ch in enumerate(pd.read_csv(TUS / "TUS106PER.csv", usecols=cols,
                                   dtype={'3-digit activity code': str},
                                   chunksize=1_000_000, low_memory=False)):
    g = ch[(pd.to_numeric(ch['NSS-Region'], errors='coerce') // 10) == GUJ]
    if len(g):
        parts.append(g)
    print(f"  chunk {i+1}: +{len(g):,} Gujarat slots", flush=True)
per = pd.concat(parts, ignore_index=True)
per = per[per['whether a major activity'] == 1].copy()
print(f"Gujarat major-activity slots: {len(per):,}")

tf = per['time from (HH:MM)'].astype(str).str.split(':', expand=True)
tt = per['time to (HH:MM)'].astype(str).str.split(':', expand=True)
per['mins'] = (pd.to_numeric(tt[0], errors='coerce') * 60 + pd.to_numeric(tt[1], errors='coerce')
               - pd.to_numeric(tf[0], errors='coerce') * 60 - pd.to_numeric(tf[1], errors='coerce'))
per.loc[per['mins'] < 0, 'mins'] += 1440

code = per['3-digit activity code'].astype(str)
per['dc'] = code.str.startswith('3') | code.str.startswith('4')   # unpaid domestic + care
per['emp'] = code.str.startswith('1')                              # employment
per['dc_min'] = per['dc'] * per['mins']
per['emp_min'] = per['emp'] * per['mins']

per['pkey'] = (per['FSU Serial No.'].astype(str) + '_' + per['Stratum'].astype(str) + '_'
               + per['Sub-Stratum'].astype(str) + '_' + per['Sub-Round'].astype(str) + '_'
               + per['FOD Sub-Region'].astype(str) + '_' + per['Sample hhld. No.'].astype(str)
               + '_' + per['Person serial no.'].astype(str))

person = per.groupby('pkey').agg(
    gender=('Gender', 'first'), age=('Age', 'first'), mult=('MULT', 'first'),
    dc_min=('dc_min', 'sum'), emp_min=('emp_min', 'sum'),
    did_dc=('dc', 'max'), did_emp=('emp', 'max')).reset_index()
person = person[person['age'] >= 6]
print(f"Gujarat persons (age 6+): {len(person):,}")

res = {"source": "TUS 2024 unit-level microdata (NSO), computed", "state": "Gujarat (NSS 24)",
       "n_persons_6plus": int(len(person)), "by_gender": {}}
for code_g, name in [(1, "Male"), (2, "Female")]:
    s = person[person['gender'] == code_g]
    if not len(s):
        continue
    w = s['mult']
    res["by_gender"][name] = {
        "n": int(len(s)),
        "unpaid_domestic_care_min_per_day_allpersons": round((s['dc_min'] * w).sum() / w.sum(), 1),
        "unpaid_dc_participation_pct": round((s['did_dc'] * w).sum() / w.sum() * 100, 1),
        "unpaid_dc_min_per_participant": round((s['dc_min'] * w).sum() / (s['did_dc'] * w).sum(), 1),
        "employment_min_per_day_allpersons": round((s['emp_min'] * w).sum() / w.sum(), 1),
        "employment_participation_pct": round((s['did_emp'] * w).sum() / w.sum() * 100, 1),
    }
OUT.parent.mkdir(parents=True, exist_ok=True)
json.dump(res, open(OUT, "w"), indent=1)
print("\n=== GUJARAT, TUS 2024 (weighted) ===")
for g, v in res["by_gender"].items():
    print(f"{g:<7} unpaid domestic+care: {v['unpaid_domestic_care_min_per_day_allpersons']} min/day "
          f"(participation {v['unpaid_dc_participation_pct']}%, {v['unpaid_dc_min_per_participant']} min/participant) "
          f"| employment {v['employment_min_per_day_allpersons']} min/day")
print(f"\nsaved -> {OUT}")
