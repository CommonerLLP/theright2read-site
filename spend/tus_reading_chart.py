"""
TUS 2024 reading-for-leisure (code 841) caste-class-gender-education stratification.

Data: notes/poc/tus/results_tus2024.tsv from tus_reading_analysis.py.

Produces fig-tus-reading-841.pdf for the working paper.
"""
import pandas as pd
import matplotlib.pyplot as plt
import numpy as np
from pathlib import Path

C_INK, C_RED, C_BLUE, C_GREY, C_AMBER = '#0e0e0e', '#dc2a14', '#1936a8', '#888888', '#d97706'

plt.rcParams.update({
    'font.family': 'serif',
    'font.serif': ['STIX Two Text', 'TeX Gyre Termes', 'Times', 'DejaVu Serif'],
    'mathtext.fontset': 'stix',
    'font.size': 10,
    'axes.edgecolor': C_INK,
    'text.color': C_INK,
    'figure.facecolor': 'white',
    'axes.facecolor': 'white',
    'axes.spines.top': False,
    'axes.spines.right': False,
})

ROOT = Path(__file__).parent.parent
TUS = ROOT / 'notes' / 'poc' / 'tus'
df = pd.read_csv(TUS / 'results_tus2024.tsv', sep='\t')

# ── Four-panel chart ──────────────────────────────────────────────────────
fig, axes = plt.subplots(1, 4, figsize=(11.5, 3.8))

def style_panel(ax):
    ax.grid(axis='y', alpha=0.15, color=C_INK)
    ax.set_ylim(0, 16)

# Panel 1: Caste
caste = df[df['cut'] == 'caste'].set_index('value')
order = ['ST', 'SC', 'OBC', 'Others']
ax = axes[0]
x = np.arange(len(order))
w = 0.38
r_vals = [caste.loc[c, 'reading_pct'] for c in order]
t_vals = [caste.loc[c, 'tv_pct']/10 for c in order]  # scale TV /10 to fit
b1 = ax.bar(x - w/2, r_vals, w, color=C_RED, edgecolor=C_INK, lw=0.5, label='Reading-for-leisure (841)')
b2 = ax.bar(x + w/2, t_vals, w, color=C_GREY, edgecolor=C_INK, lw=0.5, label='TV/video (842) ÷ 10')
for b, v in zip(b1, r_vals):
    ax.text(b.get_x()+b.get_width()/2, v+0.3, f'{v:.1f}', ha='center', fontsize=7.5, color=C_RED, fontweight='bold')
for b, v, real in zip(b2, t_vals, [caste.loc[c, 'tv_pct'] for c in order]):
    ax.text(b.get_x()+b.get_width()/2, v+0.3, f'{real:.0f}', ha='center', fontsize=7.5, color=C_GREY, fontweight='bold')
ax.set_xticks(x); ax.set_xticklabels(order, fontsize=8.5)
ax.set_ylabel('% engaged in a day', fontsize=9)
ax.set_title('By caste', loc='left', fontsize=10, fontweight='bold', pad=4)
style_panel(ax)
ax.legend(loc='upper left', frameon=False, fontsize=7)

# Panel 2: UMPCE quintile
ump = df[df['cut'] == 'umpce_quintile']
ump['value_int'] = ump['value'].astype(int)
ump = ump[ump['value_int'].between(1, 5)].sort_values('value_int')
ax = axes[1]
qlabels = ['Q1\npoorest', 'Q2', 'Q3', 'Q4', 'Q5\nrichest']
x = np.arange(5)
r = ump['reading_pct'].values
t = ump['tv_pct'].values / 10
b1 = ax.bar(x - w/2, r, w, color=C_RED, edgecolor=C_INK, lw=0.5)
b2 = ax.bar(x + w/2, t, w, color=C_GREY, edgecolor=C_INK, lw=0.5)
for i, v in enumerate(r):
    ax.text(i - w/2, v + 0.3, f'{v:.1f}', ha='center', fontsize=7.5, color=C_RED, fontweight='bold')
for i, (v, real) in enumerate(zip(t, ump['tv_pct'].values)):
    ax.text(i + w/2, v + 0.3, f'{real:.0f}', ha='center', fontsize=7.5, color=C_GREY, fontweight='bold')
ax.set_xticks(x); ax.set_xticklabels(qlabels, fontsize=8)
ax.set_title('By UMPCE quintile', loc='left', fontsize=10, fontweight='bold', pad=4)
style_panel(ax)

# Panel 3: Education (collapse to 4 meaningful bands)
# Education codes: 1=illiterate, 2-6=primary→higher-sec, 10-12=graduate→postgrad
ed = df[df['cut'] == 'education'].copy()
ed['value_int'] = ed['value'].astype(int)
bands = {
    'Illiterate': [1],
    'Primary &\nbelow': [2, 3],
    'Sec/higher\nsec': [4, 5, 6],
    'Diploma /\nGraduate+': [7, 8, 10, 11, 12],
}
ed_data = []
for band, codes in bands.items():
    sub = ed[ed['value_int'].isin(codes)]
    # Population-weighted by n
    rpct = (sub['reading_pct'] * sub['n']).sum() / sub['n'].sum()
    tpct = (sub['tv_pct'] * sub['n']).sum() / sub['n'].sum()
    ed_data.append((band, rpct, tpct))
ax = axes[2]
x = np.arange(len(ed_data))
r = [d[1] for d in ed_data]
t = [d[2]/10 for d in ed_data]
real_t = [d[2] for d in ed_data]
b1 = ax.bar(x - w/2, r, w, color=C_RED, edgecolor=C_INK, lw=0.5)
b2 = ax.bar(x + w/2, t, w, color=C_GREY, edgecolor=C_INK, lw=0.5)
for i, v in enumerate(r):
    ax.text(i - w/2, v + 0.3, f'{v:.1f}', ha='center', fontsize=7.5, color=C_RED, fontweight='bold')
for i, v in enumerate(real_t):
    ax.text(i + w/2, v/10 + 0.3, f'{v:.0f}', ha='center', fontsize=7.5, color=C_GREY, fontweight='bold')
ax.set_xticks(x); ax.set_xticklabels([d[0] for d in ed_data], fontsize=7.5)
ax.set_title('By education', loc='left', fontsize=10, fontweight='bold', pad=4)
style_panel(ax)

# Panel 4: Caste × Gender (compound exclusion)
cxg = df[df['cut'] == 'caste×gender'].copy()
order_cxg = ['ST_F', 'ST_M', 'SC_F', 'SC_M', 'OBC_F', 'OBC_M', 'Others_F', 'Others_M']
cxg = cxg.set_index('value').loc[order_cxg].reset_index()
ax = axes[3]
x = np.arange(len(order_cxg))
colors = [C_RED if v.endswith('_F') else C_BLUE for v in order_cxg]
b = ax.bar(x, cxg['reading_pct'], 0.7, color=colors, edgecolor=C_INK, lw=0.5)
for bar, v in zip(b, cxg['reading_pct']):
    ax.text(bar.get_x()+bar.get_width()/2, v+0.2, f'{v:.1f}', ha='center', fontsize=7.5,
            color=C_INK, fontweight='bold')
labels = [v.replace('_F', ' F').replace('_M', ' M') for v in order_cxg]
ax.set_xticks(x); ax.set_xticklabels(labels, fontsize=7.5, rotation=30, ha='right')
ax.set_title('Reading × caste × gender', loc='left', fontsize=10, fontweight='bold', pad=4)
style_panel(ax)
ax.set_ylim(0, 10)

# Suptitle
fig.suptitle('Reading-for-leisure (ICATUS 841) is the upper-tail of the upper-tail. '
             'TV (842) numbers shown ÷10 in panels 1-3 for scale visibility.',
             fontsize=9.5, y=1.02, x=0.5, ha='center', fontweight='normal', color=C_GREY)

plt.tight_layout()
out_pdf = TUS.parent.parent / 'research' / 'fig-tus-reading-841.pdf'
out_png = str(out_pdf).replace('.pdf', '.png')
plt.savefig(out_pdf, bbox_inches='tight', dpi=200)
plt.savefig(out_png, bbox_inches='tight', dpi=200)
print(f'Saved: {out_pdf}')
print(f'Saved: {out_png}')
