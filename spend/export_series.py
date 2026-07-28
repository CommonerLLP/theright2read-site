#!/usr/bin/env python3
"""export_series.py — emit the WP-001 replication CSVs from spend_data.py.

spend_data.py is the single source of truth; every file written here is derived
from it. Run this after any change to the data layer so the deposited archive
cannot drift from the paper.

    python spend/export_series.py [--check]

--check writes nothing and exits non-zero if any file on disk differs from what
the current data layer would produce.
"""

import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import spend_data as d  # noqa: E402

OUT = Path(__file__).resolve().parents[1] / "notes" / "research" / "data"


def fmt(v):
    return "" if v is None else str(v)


def rows_national():
    yield ["year", "nat_A_balaji", "nat_B_tg_pop_nominal", "nat_C_real_2011_12",
           "is_projection", "deflator_factor", "tg_population_mn"]
    for i, y in enumerate(d.years_all):
        yield [y, d.nat_A[i], d.nat_B[i], d.nat_C[i],
               "no" if i <= d.LAST_ACTUAL_IDX else "yes",
               d.DEFLATOR_FACTOR[i], d.TG_POP_MN[i]]


def rows_consolidated():
    yield ["year", "state_only_real_pc", "rrrlf_real_pc", "consolidated_real_pc"]
    for i, y in enumerate(d.years_all):
        yield [y, d.nat_C[i], d.RRRLF_REAL_PC[i], d.nat_C_consolidated[i]]


def rows_rrrlf():
    yield ["year", "rrrlf_total_cr_nominal", "rrrlf_real_pc_2011_12",
           "is_projection", "source"]
    for i, y in enumerate(d.years_all):
        if i == 0:
            src, proj = "RRRLF_AR_43rd", "no"
        elif i <= d.LAST_RRRLF_ACTUAL_IDX:
            src, proj = "RRRLF_AR_44th_to_52nd", "no"
        else:
            src, proj = "held_flat_53rd_AR_unpublished", "yes"
        yield [y, d.RRRLF_TOTAL_CR[i], d.RRRLF_REAL_PC[i], proj, src]


def rows_capital():
    yield ["year", "capital_cr_nominal", "capital_real_pc_2011_12",
           "capital_share_of_consolidated_pct"]
    for i, y in enumerate(d.years_all):
        yield [y, d.cap_cr[i], d.nat_cap_real_pc[i], d.cap_share_pct[i]]


def rows_deflator():
    yield ["year", "deflator_factor_2011_12_base", "nas_revision_stage"]
    for i, y in enumerate(d.years_all):
        yield [y, d.DEFLATOR_FACTOR[i], d.DEFLATOR_REVISION_STAGE[i]]


def rows_cess():
    states = list(d.CESS_STATES_LAKH)
    yield ["year"] + [s.lower().replace(" ", "_") + "_lakh" for s in states]
    for i, y in enumerate(d.years_balaji):
        yield [y] + [d.CESS_STATES_LAKH[s][i] for s in states]


def rows_cross_section():
    yield ["state", "nominal_pc_2018_19", "real_pc_2018_19_2011_12",
           "population_mn_2020"]
    for label, nominal in zip(d.state_labels, d.state_vals_nominal):
        yield [label, nominal, round(nominal * d.DEFLATOR_2018_19, 2),
               d.STATE_POP_MN[label]]


FILES = {
    "series_national_state_only.csv": rows_national,
    "series_consolidated.csv": rows_consolidated,
    "series_rrrlf.csv": rows_rrrlf,
    "series_capital.csv": rows_capital,
    "series_deflator_factors.csv": rows_deflator,
    "series_cess_states_annual.csv": rows_cess,
    "series_state_cross_section_2018_19.csv": rows_cross_section,
}


def render(builder):
    return "".join(",".join(fmt(c) for c in row) + "\n" for row in builder())


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--check", action="store_true")
    args = ap.parse_args()

    # notes/ is gitignored, so OUT does not exist on a fresh checkout.
    if not args.check:
        OUT.mkdir(parents=True, exist_ok=True)
        # Datasets moved from TSV to CSV. Leaving the old files behind would let
        # --check pass while stale, differently-formatted copies sit alongside.
        for old in OUT.glob("series_*.tsv"):
            old.unlink()
            print(f"removed obsolete {old.name}")

    stale = []
    for name, builder in FILES.items():
        text = render(builder)
        path = OUT / name
        if args.check:
            if not path.exists() or path.read_text() != text:
                stale.append(name)
        else:
            path.write_text(text)
            print(f"wrote {path.relative_to(OUT.parents[2])} "
                  f"({text.count(chr(10)) - 1} rows)")

    if args.check:
        if stale:
            print("stale (re-run without --check): " + ", ".join(stale))
            return 1
        print(f"all {len(FILES)} series files match spend_data.py")
    return 0


if __name__ == "__main__":
    sys.exit(main())
