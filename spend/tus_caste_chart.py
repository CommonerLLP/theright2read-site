"""
TUS 2019 caste cut: Mass Media vs Cultural Participation
Data pulled via MoSPI API, 2026-05-15.
Activity codes are ICATUS divisions (2-digit). MoSPI API does not expose
3-digit sub-activities, so reading-for-leisure cannot be isolated from
Division 82 here. The contrast presented is at the next-most-granular
level the API supports.

Produces fig-tus-caste.pdf for inclusion in working-paper.qmd.
"""

import matplotlib.pyplot as plt
import numpy as np
from pathlib import Path

# ── Palette (matches working-paper.qmd) ───────────────────────────────────
C_INK   = '#0e0e0e'
C_RED   = '#dc2a14'
C_BLUE  = '#1936a8'
C_GREY  = '#888888'

plt.rcParams.update({
    'font.family':      'serif',
    'font.serif':       ['STIX Two Text', 'TeX Gyre Termes', 'Times', 'DejaVu Serif'],
    'mathtext.fontset': 'stix',
    'font.size':        10,
    'axes.edgecolor':   C_INK,
    'text.color':       C_INK,
    'figure.facecolor': 'white',
    'axes.facecolor':   'white',
    'axes.spines.top':  False,
    'axes.spines.right':False,
})

# ── Data (TUS 2019, MoSPI; combined rural+urban, all genders, age 6+) ─────
# Source: MoSPI MCP API, indicators 31 (% engaged) and 32 (mins/day/participant),
# ICATUS Division 82 (Cultural/hobbies/games) and Division 84 (Mass media).
groups = ['ST', 'SC', 'OBC', 'All India', 'Others']

mm_pct  = [44.1, 53.3, 59.3, 58.1, 64.5]    # % engaged in mass media
mm_min  = [122, 121, 125, 125, 127]         # mins/day per participant
mm_pop  = [p*m/100 for p, m in zip(mm_pct, mm_min)]   # mins/day per person

cp_pct  = [17.6, 16.2, 15.4, 15.3, 13.6]    # % engaged in cultural/hobbies
cp_min  = [144, 137, 135, 133, 123]         # mins/day per participant
cp_pop  = [p*m/100 for p, m in zip(cp_pct, cp_min)]   # mins/day per person

# ── Two-panel chart ───────────────────────────────────────────────────────
fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(7.2, 3.4))

x = np.arange(len(groups))
w = 0.55

# Panel 1: % engaged
bars_mm = ax1.bar(x - w/2, mm_pct, w/1.1, color=C_RED, label='Mass media use',
                  edgecolor=C_INK, lw=0.5)
bars_cp = ax1.bar(x + w/2, cp_pct, w/1.1, color=C_BLUE, label='Cultural participation,\nhobbies, games',
                  edgecolor=C_INK, lw=0.5)
for b, v in zip(bars_mm, mm_pct):
    ax1.text(b.get_x() + b.get_width()/2, v + 1, f'{v:.0f}', ha='center', fontsize=7.5, color=C_RED, fontweight='bold')
for b, v in zip(bars_cp, cp_pct):
    ax1.text(b.get_x() + b.get_width()/2, v + 1, f'{v:.0f}', ha='center', fontsize=7.5, color=C_BLUE, fontweight='bold')

ax1.set_xticks(x)
ax1.set_xticklabels(groups, fontsize=8.5)
ax1.set_ylabel('% of persons engaged in a day', fontsize=9)
ax1.set_ylim(0, 75)
ax1.set_title('% of population engaged', loc='left', fontsize=10, fontweight='bold', pad=6)
ax1.legend(loc='upper right', frameon=False, fontsize=7.5)
ax1.grid(axis='y', alpha=0.15, color=C_INK)

# Panel 2: population-average minutes/day (engagement × intensity)
bars_mm2 = ax2.bar(x - w/2, mm_pop, w/1.1, color=C_RED,
                   label='Mass media use', edgecolor=C_INK, lw=0.5)
bars_cp2 = ax2.bar(x + w/2, cp_pop, w/1.1, color=C_BLUE,
                   label='Cultural participation,\nhobbies, games', edgecolor=C_INK, lw=0.5)
for b, v in zip(bars_mm2, mm_pop):
    ax2.text(b.get_x() + b.get_width()/2, v + 1.5, f'{v:.0f}', ha='center', fontsize=7.5, color=C_RED, fontweight='bold')
for b, v in zip(bars_cp2, cp_pop):
    ax2.text(b.get_x() + b.get_width()/2, v + 1.5, f'{v:.0f}', ha='center', fontsize=7.5, color=C_BLUE, fontweight='bold')

ax2.set_xticks(x)
ax2.set_xticklabels(groups, fontsize=8.5)
ax2.set_ylabel('Minutes per day per person', fontsize=9)
ax2.set_ylim(0, 95)
ax2.set_title('Population-average minutes/day', loc='left', fontsize=10, fontweight='bold', pad=6)
ax2.grid(axis='y', alpha=0.15, color=C_INK)

plt.tight_layout()

out = Path(__file__).parent.parent / 'notes' / 'research' / 'fig-tus-caste.pdf'
plt.savefig(out, bbox_inches='tight', dpi=200)
plt.savefig(str(out).replace('.pdf', '.png'), bbox_inches='tight', dpi=200)
print(f'Saved: {out}')
print(f'Saved: {str(out).replace(".pdf", ".png")}')
