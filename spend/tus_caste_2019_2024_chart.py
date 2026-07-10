"""
TUS 2019 vs 2024 caste comparison: Mass Media and Cultural Participation
Data via MoSPI MCP API, accessed 2026-05-15.
Activity codes: ICATUS Division 84 (Mass media use) and Division 82
(Cultural participation, hobbies, games and other pastime activities).
2-digit resolution; 3-digit sub-codes (incl. reading 8221) not exposed.

Produces fig-tus-2019-2024.pdf for inclusion in working-paper.qmd.
"""

import matplotlib.pyplot as plt
import numpy as np
from pathlib import Path

C_INK, C_RED, C_BLUE, C_GREY = '#0e0e0e', '#dc2a14', '#1936a8', '#888888'
C_LIGHT_RED, C_LIGHT_BLUE = '#f4a896', '#9eb1d8'

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

# ── TUS 2019 vs 2024 — % engaged in a day, by social group ───────────────
groups = ['ST', 'SC', 'OBC', 'All India', 'Others']

# Mass media use (Division 84)
mm_2019 = [44.1, 53.3, 59.3, 58.1, 64.5]
mm_2024 = [51.2, 62.1, 66.4, 65.7, 72.6]

# Cultural participation, hobbies, games (Division 82)
cp_2019 = [17.6, 16.2, 15.4, 15.3, 13.6]
cp_2024 = [19.7, 19.1, 17.8, 17.5, 15.0]

# Population-average minutes/day (% × mins per participant / 100)
mm_min_2019 = [122, 121, 125, 125, 127]
mm_min_2024 = [105, 112, 118, 117, 121]
mm_pop_2019 = [p*m/100 for p, m in zip(mm_2019, mm_min_2019)]
mm_pop_2024 = [p*m/100 for p, m in zip(mm_2024, mm_min_2024)]

# ── Two-panel: slope chart 2019 → 2024 for each activity ─────────────────
fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(7.2, 3.6))

caste_colors = {
    'ST': '#dc2a14',
    'SC': '#d97706',
    'OBC': '#888888',
    'All India': '#0e0e0e',
    'Others': '#1936a8',
}

# Panel 1: Mass media — slope chart
for i, g in enumerate(groups):
    c = caste_colors[g]
    ax1.plot([0, 1], [mm_2019[i], mm_2024[i]], color=c, marker='o', markersize=6, lw=2)
    ax1.text(-0.04, mm_2019[i], f'{g} {mm_2019[i]:.0f}', ha='right', va='center',
             fontsize=8, color=c, fontweight='bold')
    ax1.text(1.04, mm_2024[i], f'{mm_2024[i]:.0f}', ha='left', va='center',
             fontsize=8, color=c, fontweight='bold')

ax1.set_xticks([0, 1])
ax1.set_xticklabels(['2019', '2024'], fontsize=9)
ax1.set_xlim(-0.35, 1.35)
ax1.set_ylabel('% of persons engaged in a day', fontsize=9)
ax1.set_ylim(40, 78)
ax1.set_title('Mass media use (ICATUS Div. 84)\nTV / radio / print / internet / social media',
              loc='left', fontsize=9.5, fontweight='bold', pad=8)
ax1.grid(axis='y', alpha=0.15, color=C_INK)
ax1.spines['bottom'].set_visible(False)
ax1.tick_params(axis='x', length=0, pad=8)

# Panel 2: Cultural participation — slope chart
for i, g in enumerate(groups):
    c = caste_colors[g]
    ax2.plot([0, 1], [cp_2019[i], cp_2024[i]], color=c, marker='o', markersize=6, lw=2)
    ax2.text(-0.04, cp_2019[i], f'{g} {cp_2019[i]:.0f}', ha='right', va='center',
             fontsize=8, color=c, fontweight='bold')
    ax2.text(1.04, cp_2024[i], f'{cp_2024[i]:.0f}', ha='left', va='center',
             fontsize=8, color=c, fontweight='bold')

ax2.set_xticks([0, 1])
ax2.set_xticklabels(['2019', '2024'], fontsize=9)
ax2.set_xlim(-0.35, 1.35)
ax2.set_ylabel('% of persons engaged in a day', fontsize=9)
ax2.set_ylim(11, 21)
ax2.set_title('Cultural participation, hobbies, games (ICATUS Div. 82)\nincludes reading-for-leisure as 3-digit sub-code',
              loc='left', fontsize=9.5, fontweight='bold', pad=8)
ax2.grid(axis='y', alpha=0.15, color=C_INK)
ax2.spines['bottom'].set_visible(False)
ax2.tick_params(axis='x', length=0, pad=8)

plt.tight_layout()
out = Path(__file__).parent.parent / 'notes' / 'research' / 'fig-tus-2019-2024.pdf'
plt.savefig(out, bbox_inches='tight', dpi=200)
plt.savefig(str(out).replace('.pdf', '.png'), bbox_inches='tight', dpi=200)
print(f'Saved: {out}')
print(f'Saved: {str(out).replace(".pdf", ".png")}')

# Print summary
print('\n=== Population-average minutes/day on mass media ===')
print(f'{"Group":<12} {"2019":>6} {"2024":>6} {"Δ":>6}')
for i, g in enumerate(groups):
    d = mm_pop_2024[i] - mm_pop_2019[i]
    print(f'{g:<12} {mm_pop_2019[i]:6.1f} {mm_pop_2024[i]:6.1f} {d:+6.1f}')
print(f'\nOthers-ST gap 2019: {mm_pop_2019[4] - mm_pop_2019[0]:+.1f} mins/day')
print(f'Others-ST gap 2024: {mm_pop_2024[4] - mm_pop_2024[0]:+.1f} mins/day')
