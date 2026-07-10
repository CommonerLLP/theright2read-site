#!/usr/bin/env python3
"""
TUS 2024 — women's unpaid domestic+care burden: Gujarat vs Tamil Nadu vs Maharashtra.
Same method as tus_gujarat_women.py, three states in one pass. NSS state codes:
24=Gujarat, 33=Tamil Nadu, 27=Maharashtra. Output -> twenty27 data.
"""
import json
import pandas as pd
from pathlib import Path

R2R = Path(__file__).resolve().parents[1]
TUS = R2R / "notes/poc/tus/tus2024"
OUT = R2R.parent / "twenty27/data/processed/tus_women_3state_2024.json"
STATES = {24: "Gujarat", 33: "Tamil Nadu", 27: "Maharashtra"}

cols = ['NSS-Region', 'FSU Serial No.', 'Stratum', 'Sub-Stratum', 'Sub-Round',
        'FOD Sub-Region', 'Sample hhld. No.', 'Person serial no.', 'Gender', 'Age',
        '3-digit activity code', 'whether a major activity',
        'time from (HH:MM)', 'time to (HH:MM)', 'MULT']

parts = []
for ch in pd.read_csv(TUS / "TUS106PER.csv", usecols=cols,
                      dtype={'3-digit activity code': str},
                      chunksize=1_000_000, low_memory=False):
    st = pd.to_numeric(ch['NSS-Region'], errors='coerce') // 10
    m = st.isin(list(STATES))
    if m.any():
        g = ch[m].copy(); g['st'] = st[m]; parts.append(g)
per = pd.concat(parts, ignore_index=True)
per = per[per['whether a major activity'] == 1].copy()

tf = per['time from (HH:MM)'].astype(str).str.split(':', expand=True)
tt = per['time to (HH:MM)'].astype(str).str.split(':', expand=True)
per['mins'] = (pd.to_numeric(tt[0], errors='coerce') * 60 + pd.to_numeric(tt[1], errors='coerce')
               - pd.to_numeric(tf[0], errors='coerce') * 60 - pd.to_numeric(tf[1], errors='coerce'))
per.loc[per['mins'] < 0, 'mins'] += 1440
code = per['3-digit activity code'].astype(str)
per['dc'] = code.str.startswith('3') | code.str.startswith('4')
per['dc_min'] = per['dc'] * per['mins']
per['pkey'] = (per['FSU Serial No.'].astype(str) + '_' + per['Stratum'].astype(str) + '_'
               + per['Sub-Stratum'].astype(str) + '_' + per['Sub-Round'].astype(str) + '_'
               + per['FOD Sub-Region'].astype(str) + '_' + per['Sample hhld. No.'].astype(str)
               + '_' + per['Person serial no.'].astype(str))
person = per.groupby('pkey').agg(st=('st', 'first'), gender=('Gender', 'first'),
                                 age=('Age', 'first'), mult=('MULT', 'first'),
                                 dc_min=('dc_min', 'sum'), did_dc=('dc', 'max')).reset_index()
person = person[person['age'] >= 6]

res = {"source": "TUS 2024 microdata (NSO), computed", "metric": "unpaid domestic+care min/day"}
print("\n=== Women unpaid domestic+care (TUS 2024, weighted) ===")
for code_s, name in STATES.items():
    res[name] = {}
    for g, gn in [(1, "Male"), (2, "Female")]:
        s = person[(person['st'] == code_s) & (person['gender'] == g)]
        if not len(s):
            continue
        w = s['mult']
        res[name][gn] = {"n": int(len(s)),
                         "min_per_day": round((s['dc_min'] * w).sum() / w.sum(), 1),
                         "participation_pct": round((s['did_dc'] * w).sum() / w.sum() * 100, 1)}
    f = res[name].get("Female", {}); m = res[name].get("Male", {})
    if f and m:
        ratio = round(f["min_per_day"] / m["min_per_day"], 1) if m["min_per_day"] else None
        print(f"  {name:<12} women {f['min_per_day']:>5} min/day ({f['participation_pct']}%)  "
              f"men {m['min_per_day']:>4}  ratio {ratio}x")
OUT.parent.mkdir(parents=True, exist_ok=True)
json.dump(res, open(OUT, "w"), indent=1)
print(f"\nsaved -> {OUT}")
