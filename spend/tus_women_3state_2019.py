#!/usr/bin/env python3
"""
TUS 2019 — women's unpaid domestic+care (min/day): Gujarat vs TN vs Maharashtra.
2019 multi-file format: level02 = persons (has State, Gender, Age); L05_1/2/3 = activity
slots (State, member-serial, time, activity code, MULT). Join on person key.
Quirks (from tus_reading_analysis_2019.py): activity col typo '3-didit'; MULT mashed
with NSC ("4  128155" -> take last token). NSS State code: 24=Guj, 33=TN, 27=Maha.
Output -> twenty27 data. Compare to tus_women_3state_2024.json.
"""
import json
import pandas as pd
from pathlib import Path

R2R = Path(__file__).resolve().parents[1]
TUS = R2R / "notes/poc/tus/tus2019"
OUT = R2R.parent / "twenty27/data/processed/tus_women_3state_2019.json"
STATES = {24: "Gujarat", 33: "Tamil Nadu", 27: "Maharashtra"}

def hh_key(df):
    return (df['FSU Serial No.'].astype(str) + '_' + df['Stratum'].astype(str) + '_'
            + df['Sub-Stratum'].astype(str) + '_' + df['Sub-Round'].astype(str) + '_'
            + df['FOD Sub-Region'].astype(str) + '_' + df['Sample hhld. No.'].astype(str))

def _i(s):
    return pd.to_numeric(s, errors='coerce').fillna(-1).astype(int).astype(str)

# ── level02 persons → gender/age/state ──
l02 = pd.read_csv(TUS / "level02.csv", low_memory=False)
l02['State'] = pd.to_numeric(l02['State'], errors='coerce')
l02 = l02[l02['State'].isin(STATES)].copy()
l02['pkey'] = hh_key(l02) + '_' + _i(l02['Person serial no.'])
demo = (l02[['pkey', 'State', 'Gender', 'Age']].drop_duplicates('pkey')
        .rename(columns={'State': 'st', 'Gender': 'gender', 'Age': 'age'}))
print(f"level02 persons in 3 states: {len(demo):,}")

# ── L05 activity slots (3 files, chunked, filter 3 states) ──
parts = []
for fn in ["TUS106_L05_1.csv", "TUS106_L05_2.csv", "TUS106_L05_3.csv"]:
    for ch in pd.read_csv(TUS / fn, dtype={'3-didit activity code': str},
                          chunksize=1_000_000, low_memory=False):
        ch['State'] = pd.to_numeric(ch['State'], errors='coerce')
        m = ch[ch['State'].isin(STATES)]
        if len(m):
            parts.append(m)
    print(f"  {fn} done", flush=True)
l05 = pd.concat(parts, ignore_index=True)
code_col = [c for c in l05.columns if 'activity code' in c.lower()][0]
major_col = [c for c in l05.columns if 'major activity' in c.lower()][0]
mcol = [c for c in l05.columns if 'member' in c.lower() and 'serial' in c.lower()][0]
mult_col = [c for c in l05.columns if c.strip().upper() == 'MULT'][0]
tf = [c for c in l05.columns if 'time from' in c.lower()][0]
tt = [c for c in l05.columns if 'time to' in c.lower()][0]
l05 = l05[l05[major_col] == 1].copy()
l05['pkey'] = hh_key(l05) + '_' + _i(l05[mcol])

def parse(col):
    s = l05[col].astype(str).str.replace(' ', '', regex=False)
    sp = s.str.split(':', expand=True)
    if sp.shape[1] > 1:
        return pd.to_numeric(sp[0], errors='coerce') * 60 + pd.to_numeric(sp[1], errors='coerce')
    z = s.str.zfill(4)
    return pd.to_numeric(z.str[:2], errors='coerce') * 60 + pd.to_numeric(z.str[2:], errors='coerce')

l05['mins'] = parse(tt) - parse(tf)
l05.loc[l05['mins'] < 0, 'mins'] += 1440
ac = l05[code_col].astype(str)
l05['dc'] = ac.str.startswith('3') | ac.str.startswith('4')
l05['dc_min'] = l05['dc'] * l05['mins']

def pm(s):
    if pd.isna(s):
        return 0
    t = str(s).strip().split()
    return float(t[-1]) if t else 0
l05[mult_col] = l05[mult_col].map(pm)

person = l05.groupby('pkey').agg(mult=(mult_col, 'first'),
                                 dc_min=('dc_min', 'sum'), did_dc=('dc', 'max')).reset_index()
person = person.merge(demo, on='pkey', how='left')
person = person[person['age'] >= 6]
print(f"persons (age 6+, matched): {len(person):,}")

res = {"source": "TUS 2019 microdata (NSO), computed", "metric": "unpaid domestic+care min/day"}
print("\n=== Women unpaid domestic+care (TUS 2019, weighted) ===")
for sc, name in STATES.items():
    res[name] = {}
    for g, gn in [(1, "Male"), (2, "Female")]:
        s = person[(person['st'] == sc) & (person['gender'] == g)]
        if not len(s):
            continue
        w = s['mult']
        res[name][gn] = {"n": int(len(s)),
                         "min_per_day": round((s['dc_min'] * w).sum() / w.sum(), 1),
                         "participation_pct": round((s['did_dc'] * w).sum() / w.sum() * 100, 1)}
    f = res[name].get("Female", {}); m = res[name].get("Male", {})
    if f and m:
        ratio = round(f["min_per_day"] / m["min_per_day"], 1) if m["min_per_day"] else None
        print(f"  {name:<12} women {f['min_per_day']:>5} ({f['participation_pct']}%)  men {m['min_per_day']:>4}  ratio {ratio}x  (n_w={f['n']})")
OUT.parent.mkdir(parents=True, exist_ok=True)
json.dump(res, open(OUT, "w"), indent=1)
print(f"\nsaved -> {OUT}")
