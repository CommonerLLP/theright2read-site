"""spend_data.py — Canonical data for the library expenditure analysis.
Extracted from build_spend_page.py.
"""

import math

# ── Years ─────────────────────────────────────────────────────────────────────

years_balaji  = ["2014-15","2015-16","2016-17","2017-18","2018-19","2019-20","2020-21"]
years_ext     = ["2021-22","2022-23","2023-24","2024-25"]
years_all     = years_balaji + years_ext

# ── National Trends ──────────────────────────────────────────────────────────

# A: Nominal total / Census 2011 India population (fixed) — Balaji's method
nat_A = [5.16, 6.62, 8.62, 9.96, 11.64, 7.79, 8.39,  8.49, 8.66, 9.13, 9.51]
# B: Nominal total / TG 2020 projected India population (annual July 1)
nat_B = [4.93, 6.25, 8.05, 9.19, 10.63, 7.04, 7.50,  7.51, 7.60, 7.94, 8.20]
# C: Real (NAS GDP deflator, 2011-12 base) total / TG 2020 projected population
nat_C = [4.16, 5.16, 6.44, 7.07,  7.87, 5.09, 5.17,  4.78, 4.57, 4.65, 4.66]
LAST_ACTUAL_IDX = 6  # 2020-21 — last CAG actual

# ── Deflator ──────────────────────────────────────────────────────────────────

# MoSPI NAS implicit GDP deflator factors (constant / current), base 2011-12.
DEFLATOR_FACTOR = [0.8444, 0.8256, 0.7997, 0.7691, 0.7404,
                   0.7230, 0.6898, 0.6366, 0.6011, 0.5860, 0.5684]
DEFLATOR_2018_19 = 0.7404

# ── RRRLF (Central public-library transfers) ─────────────────────────────────
# Total GoI grant disbursed to Raja Rammohun Roy Library Foundation, ₹ crore.
# Primary source: RRRLF Annual Reports 44th–51st (2015-16 → 2022-23), extracted
# in budget-crawler/notes/rrrlf-audit-2011-2023.md.
# 2014-15: data gap (43rd AR state-level annexures in scanned-image form; OCR
# extraction of GIA-General + NML lines did not yield clean values).
# 2023-24, 2024-25: projection — held flat at the 2022-23 disbursement level
# (₹27.07 cr). Supported by (i) the post-COVID stabilisation in 2021-22 and
# 2022-23, both at ~₹27 cr, and (ii) the Parliamentary Standing Committee
# 310th Report (Feb 2022) recording ₹27.07 cr allocated to RRRLF for FY
# 2021-22, indicating the MoC line item has been held at this level.
RRRLF_TOTAL_CR = [None, 57.40, 55.50, 76.70, 53.75, 43.15, 19.96,
                  26.90, 27.07, 27.07, 27.07]

# India TG 2020 projected population, mid-year (millions). Source: MoHFW
# Technical Group on Population Projections (2020), Table 11.
TG_POP_MN = [1268.9, 1283.6, 1298.4, 1313.1, 1327.6, 1341.7, 1355.3,
             1368.4, 1381.1, 1393.4, 1405.3]

# Real per-capita RRRLF (2011-12 ₹/person/year). None for 2014-15 (data gap).
RRRLF_REAL_PC = [None if c is None else
                 round(c * 1e7 / (p * 1e6) * d, 4)
                 for c, p, d in zip(RRRLF_TOTAL_CR, TG_POP_MN, DEFLATOR_FACTOR)]

# Consolidated real per-capita (state MH 2205-105 + RRRLF Central transfers).
# 2014-15: state-only (RRRLF gap acknowledged).
nat_C_consolidated = [round(c + (r or 0), 2) for c, r in zip(nat_C, RRRLF_REAL_PC)]

# Index of last year with primary-source RRRLF disbursement (2022-23).
LAST_RRRLF_ACTUAL_IDX = 8

# ── State Cross-section (2018-19) ───────────────────────────────────────────
# state_vals_nominal is also population-corrected nominal (Series B, feeding the
# deflated real cross-section below), not as-published — see note above.

state_labels = ['Jharkhand','Bihar','Uttar Pradesh','Punjab','Madhya Pradesh',
                'Odisha','Chhattisgarh','Haryana','Rajasthan','Uttarakhand',
                'Nagaland','Delhi','Assam','Gujarat','Manipur','Tripura',
                'Meghalaya','Himachal Pradesh','Maharashtra','Jammu & Kashmir',
                'Telangana','Tamil Nadu','Mizoram','Sikkim','West Bengal',
                'Kerala','Andhra Pradesh','Karnataka','Arunachal Pradesh',
                'Puducherry','Goa']

state_vals_nominal = [0.14,0.36,0.94,0.98,1.09,1.22,1.26,1.48,1.49,1.79,3.33,4.31,
                      4.71,5.02,6.88,10.61,11.11,11.66,12.43,13.16,13.97,16.23,16.80,
                      19.68,19.69,24.67,24.74,35.23,48.02,50.61,118.76]

# ── Extended Series ──────────────────────────────────────────────────────────
# NOTE (verified 2026-07-06): despite the "_nominal" suffix, these are population-
# CORRECTED nominal (Series B: same KBD-2025/CAG Table-1 ₹ totals ÷ a growing,
# TG2020-style population), not the as-published Census-2011-denominator figures.
# assets/data.js STATE_DATA holds the as-published series instead (verified to
# reproduce KBD 2025's own reported per-capita numbers) — the two legitimately
# diverge by design; see memory/verified_facts.md 2026-07-06 entry.

ext_assam_nominal     = [3.99,3.42,3.72,5.20,4.71,4.70,4.92, 4.87,4.42,7.84,6.97]
ext_goa_nominal       = [66.52,90.59,96.69,113.23,118.76,130.42,132.00, None,163.38,245.19,284.17]
ext_rajasthan_nominal = [1.27,1.22,1.25,1.29,1.49,1.43,1.40, None,None,1.80,2.04]
ext_odisha_nominal    = [0.91,0.97,0.99,1.11,1.22,1.20,1.13, None,1.16,1.30,1.14]

# ── Populations (Millions, ~2020) ───────────────────────────────────────────

STATE_POP_MN = {
    "Andhra Pradesh": 53, "Arunachal Pradesh": 1.5, "Assam": 35, "Bihar": 124,
    "Chhattisgarh": 30, "Delhi": 19, "Goa": 1.7, "Gujarat": 67, "Haryana": 28,
    "Himachal Pradesh": 7.4, "Jammu & Kashmir": 14, "Jharkhand": 38,
    "Karnataka": 67, "Kerala": 36, "Madhya Pradesh": 85, "Maharashtra": 124,
    "Manipur": 3.2, "Meghalaya": 3.4, "Mizoram": 1.2, "Nagaland": 2.2,
    "Odisha": 46, "Puducherry": 1.5, "Punjab": 30, "Rajasthan": 80,
    "Sikkim": 0.7, "Tamil Nadu": 79, "Telangana": 38, "Tripura": 4.0,
    "Uttar Pradesh": 235, "Uttarakhand": 11, "West Bengal": 100,
}

# ── Zonal Council Data ────────────────────────────────────────────────────────

MHA_ZONE_META = {
    "Central":   ("CENTRAL ZC",  "#c53030",  0.94, 361, 27),
    "Eastern":   ("EASTERN ZC",  "#e8633f",  3.96, 308, 23),
    "Northern":  ("NORTHERN ZC", "#ecc94b",  4.08, 180, 13),
    "NEC":       ("NE COUNCIL",  "#a3c265", 11.21,  50,  4),
    "Southern":  ("SOUTHERN ZC", "#68d391", 20.42, 274, 20),
    "Western":   ("WESTERN ZC",  "#2f855a", 33.61, 193, 14),
}

MOC_ZONE_META = {
    "NC": ("NORTH CENTRAL", "#c53030",  1.21, 584, 41),
    "N":  ("NORTH",         "#e8633f",  3.77, 174, 13),
    "E":  ("EAST",          "#ed8936",  5.86, 351, 26),
    "NE": ("NORTH EAST",    "#ecc94b", 11.21,  50,  4),
    "S":  ("SOUTH",         "#a3c265", 20.42, 275, 20),
    "SC": ("SOUTH CENTRAL", "#68d391", 21.95, 399, 29),
    "W":  ("WEST",          "#2f855a", 25.49, 273, 20),
}

# ── Convergence Model: Tamil Nadu benchmark to 2035 ──────────────────────────
# TN total library expenditure 2014-15 to 2020-21 (CAG, ₹ lakh)
TN_TOTAL_LAKH = [7886, 8199, 9755, 10750, 12249, 13604, 13094]
# TN population, projected July-1 each year, in millions (TG 2020, Table 11)
TN_POP_MN = {
    2014: 73.0, 2015: 73.7, 2016: 74.4, 2017: 75.1, 2018: 75.8,
    2019: 76.5, 2020: 77.1, 2021: 77.7, 2022: 78.2, 2023: 78.7,
    2024: 79.1, 2025: 79.5, 2030: 81.2, 2035: 82.5,
}
# India population, projected (TG 2020, Table 11) — millions
INDIA_POP_MN = {
    2014: 1267, 2015: 1283, 2016: 1299, 2017: 1316, 2018: 1332,
    2019: 1349, 2020: 1365, 2021: 1382, 2022: 1398, 2023: 1416,
    2024: 1434, 2025: 1451, 2030: 1515, 2035: 1564,
}
