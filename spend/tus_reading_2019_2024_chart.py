"""
TUS 2019 vs 2024 reading-for-leisure (code 841) change — by caste, quintile, education.

Data: notes/poc/tus/results_tus2019.tsv and results_tus2024.tsv
Output: notes/research/fig-tus-reading-841-change.pdf (+ png)
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
df19 = pd.read_csv(TUS / 'results_tus2019.tsv', sep='\t')
df24 = pd.read_csv(TUS / 'results_tus2024.tsv', sep='\t')
df19['value'] = df19['value'].astype(str)
df24['value'] = df24['value'].astype(str)

# Normalise quintile values: 2019 might have "1.0", 2024 has "1"
df19['value'] = df19['value'].str.replace('.0', '', regex=False)
df24['value'] = df24['value'].str.replace('.0', '', regex=False)

caste_colors = {
    'ST': '#dc2a14', 'SC': '#d97706', 'OBC': '#888888',
    'All India': '#0e0e0e', 'Others': '#1936a8',
}

fig, axes = plt.subplots(1, 3, figsize=(11.5, 3.7))

def slope_panel(ax, key, value_list, label_format=None, title='', value_col='reading_pct',
                color_map=None, ylim=None):
    a19 = df19[df19['cut'] == key].set_index('value')
    a24 = df24[df24['cut'] == key].set_index('value')
    for v in value_list:
        if v not in a19.index or v not in a24.index:
            continue
        y19 = a19.loc[v, value_col]
        y24 = a24.loc[v, value_col]
        c = color_map.get(v, C_INK) if color_map else C_INK
        ax.plot([0, 1], [y19, y24], color=c, marker='o', markersize=6, lw=2)
        lbl = label_format(v) if label_format else v
        ax.text(-0.04, y19, f'{lbl} {y19:.1f}', ha='right', va='center',
                fontsize=8, color=c, fontweight='bold')
        ax.text(1.04, y24, f'{y24:.1f}', ha='left', va='center',
                fontsize=8, color=c, fontweight='bold')
    ax.set_xticks([0, 1]); ax.set_xticklabels(['2019', '2024'], fontsize=9)
    ax.set_xlim(-0.35, 1.35)
    if ylim:
        ax.set_ylim(*ylim)
    ax.set_ylabel('% of persons reading for leisure in a day', fontsize=9)
    ax.set_title(title, loc='left', fontsize=9.5, fontweight='bold', pad=8)
    ax.grid(axis='y', alpha=0.15, color=C_INK)
    ax.spines['bottom'].set_visible(False)
    ax.tick_params(axis='x', length=0, pad=8)

# Panel 1: by caste
slope_panel(axes[0], 'caste', ['ST', 'SC', 'OBC', 'All India', 'Others'],
            color_map=caste_colors, title='By caste', ylim=(0, 8))

# Add the "All India" line manually from 'all' cut
all_19 = df19[df19['cut'] == 'all'].iloc[0]['reading_pct']
all_24 = df24[df24['cut'] == 'all'].iloc[0]['reading_pct']
axes[0].plot([0, 1], [all_19, all_24], color='#0e0e0e', marker='s', markersize=5, lw=1.5,
              linestyle='--', alpha=0.7)
axes[0].text(0.5, (all_19+all_24)/2 + 0.4, f'All India ({all_19:.1f} to {all_24:.1f})',
              ha='center', fontsize=7.5, color='#0e0e0e', style='italic')

# Panel 2: by UMPCE quintile
quintile_colors = {
    '1': '#dc2a14', '2': '#d97706', '3': '#888888', '4': '#1936a8', '5': '#0e0e0e',
}
quintile_labels = {'1': 'Q1 (poorest)', '2': 'Q2', '3': 'Q3', '4': 'Q4', '5': 'Q5 (richest)'}
slope_panel(axes[1], 'umpce_quintile', ['1', '2', '3', '4', '5'],
            label_format=lambda v: quintile_labels.get(v, v),
            color_map=quintile_colors, title='By UMPCE quintile', ylim=(0, 11))

# Panel 3: by caste × gender (compound)
cg_pairs = ['ST_F', 'ST_M', 'SC_F', 'SC_M', 'OBC_F', 'OBC_M', 'Others_F', 'Others_M']
cg_colors = {
    'ST_F': '#dc2a14', 'ST_M': '#dc2a14',
    'SC_F': '#d97706', 'SC_M': '#d97706',
    'OBC_F': '#888888', 'OBC_M': '#888888',
    'Others_F': '#1936a8', 'Others_M': '#1936a8',
}
cg_labels = {f'{c}_{g}': f'{c} {g}' for c in ['ST', 'SC', 'OBC', 'Others'] for g in ['F', 'M']}
slope_panel(axes[2], 'caste×gender', cg_pairs,
            label_format=lambda v: cg_labels.get(v, v),
            color_map=cg_colors, title='By caste × gender (compound exclusion)',
            ylim=(0, 10))

fig.suptitle('Reading-for-leisure (ICATUS 841) declined across every demographic between TUS 2019 and TUS 2024. '
             'Steepest fall: ST (-44%), SC women, lowest-quintile rural.',
             fontsize=9, y=1.02, x=0.5, ha='center', color=C_GREY, style='italic')

plt.tight_layout()
out_pdf = TUS.parent.parent / 'research' / 'fig-tus-reading-841-change.pdf'
plt.savefig(out_pdf, bbox_inches='tight', dpi=200)
plt.savefig(str(out_pdf).replace('.pdf', '.png'), bbox_inches='tight', dpi=200)
print(f'Saved: {out_pdf}')

# Print compact summary
print('\n=== Reading-for-leisure (% engaged) 2019 vs 2024 ===\n')
print(f'{"Group":<20} {"2019":>7} {"2024":>7} {"Δ":>10}')
print('-' * 50)
for cut, vals in [('all', ['All India']),
                  ('caste', ['ST', 'SC', 'OBC', 'Others']),
                  ('umpce_quintile', ['1', '2', '3', '4', '5']),
                  ('sector', ['1', '2']),
                  ('gender', ['1', '2'])]:
    for v in vals:
        r19 = df19[(df19['cut']==cut) & (df19['value']==v)]
        r24 = df24[(df24['cut']==cut) & (df24['value']==v)]
        if r19.empty or r24.empty: continue
        a = r19.iloc[0]['reading_pct']
        b = r24.iloc[0]['reading_pct']
        pct_change = (b-a)/a * 100 if a else float('nan')
        print(f'{cut[:8]+":"+v:<20} {a:>6.2f}% {b:>6.2f}%  {pct_change:>+6.1f}%')
