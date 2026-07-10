/* ============================================================
   data.js — canonical data and constants for the pamphlet.
   Single source of truth. Both / and /data/ load this.

   Update numbers here and they propagate everywhere that reads them
   from window.CONSTANTS / window.DATA. HTML strings still need the
   {{TOKEN}} substitution dance — see helpers.js / substituteConstants.
   ============================================================ */

// ─── CANONICAL NUMBERS ────────────────────────────────────────────
// One place to update. Reference window.CONSTANTS.NAME from JS,
// or {{NAME}} from HTML (with substituteConstants on load).
const CONSTANTS = {
  STATUE_OF_UNITY_CR:   2989,    // ₹ crore — Statue of Unity construction cost (Govt. of Gujarat, 2018)
  // NB: these three are NOMINAL, state-level (KBD 2025) — NOT the campaign headline.
  // The single per-person headline is ₹4.77 (consolidated state+Centre, real 2011-12 ₹, WP-001).
  // Do not surface these as "what India spends per person"; use HERO_PER_CAPITA_REAL below.
  HERO_PER_CAPITA_REAL: 4.77,    // ₹ / person / year — CANONICAL headline (consolidated real, WP-001/005)
  NATIONAL_PER_CAPITA:  15.30,   // ₹ / person / year — nominal state-level average (yardstick only)
  CENTRE_PER_CAPITA:    2.07,    // ₹ / person / year — Centre's per-capita library spend (nominal, KBD 2025)
  COMBINED_PER_CAPITA:  11.62,   // ₹ / person / year — peak national combined, nominal (state + Centre)
  RRRLF_20YR_TOTAL_CR:  197,     // ₹ crore — RRRLF total 2003-2023
  BOOK_PRICE:           250,     // ₹ — typical Indian-published paperback (illustrative)

  CENTRE_BUDGET:        4800000, // ₹ crore — Union Budget 2024-25 BE
  CENTRE_LIBRARIES:     195,     // ₹ crore — Centre's full library spend (CAG 2205-105 avg 2014-21)
  CENTRE_ADS:           644,     // ₹ crore — Govt advertising FY 2024-25 actual
  CORP_TAX_CUT:         145000,  // ₹ crore — revenue forgone from 2019 corporate tax cut, FY 2019-20
  STANDARD_DEDUCTION:   75000    // ₹ — Income tax standard deduction (FY 2024-25 New Regime)
};
window.CONSTANTS = CONSTANTS;

// ─── STATE PER-CAPITA SPEND ───────────────────────────────────────
// 7 years: 2014-15 to 2020-21. ₹ per person per year, NOMINAL, Census-2011
// fixed population denominator (the as-published method). Source: Kulkarni,
// Balaji & Dhanamjaya 2025 ("KBD 2025"), Table 1 (CAG Combined Finance and
// Revenue Accounts, MH 2205-105). Verified 2026-07-06 against the primary
// PDF (Zotero 3D2483TW): reproduces KBD's own reported per-capita figures
// to within rounding. NOTE: spend/spend_data.py's ext_*_nominal / state_vals_
// nominal arrays use the SAME Table-1 totals but a different (population-
// corrected, TG2020-style) denominator — the two series legitimately diverge
// by design; see memory/verified_facts.md 2026-07-06 entry before "fixing".
const YEARS = ['2014-15','2015-16','2016-17','2017-18','2018-19','2019-20','2020-21'];

const STATE_DATA = {
  "Goa": [68.14,93.48,100.43,118.31,124.91,137.97,140.55],
  "Puducherry": [52.25,60.66,61.58,59.64,60.06,56.23,56.62],
  "Arunachal Pradesh": [43.61,55.13,54.09,53.13,51.82,59.97,65.12],
  "Andhra Pradesh": [8.39,8.59,15.10,20.50,26.07,26.30,21.23],
  "Sikkim": [14.68,15.66,17.69,19.17,21.24,28.61,23.32],
  "West Bengal": [0.53,0.54,19.19,19.44,20.82,0.46,16.28],
  "Karnataka": [16.54,16.01,18.27,19.56,37.74,19.71,11.98],
  "Mizoram": [11.73,12.22,14.48,15.37,18.13,20.29,18.32],
  "Tamil Nadu": [10.93,11.36,13.52,14.90,16.98,18.86,18.15],
  "Telangana": [0.75,23.35,11.49,19.46,14.70,14.18,15.00],
  // Jammu & Kashmir stays in the data so a J&K resident can still generate their
  // CM letter on /act/ — but it is held out of every spend-RANKING surface via
  // RANKING_EXCLUDE below (see note there). MoC series has a 2019-20 gap (null).
  "Jammu & Kashmir": [6.15,10.85,10.61,10.95,13.78,null,9.92],
  "Maharashtra": [9.73,15.07,11.28,12.60,13.43,9.19,10.14],
  "Himachal Pradesh": [4.34,4.42,5.39,5.76,12.34,8.89,7.86],
  "Meghalaya": [9.20,9.19,8.77,9.53,11.98,12.15,12.71],
  "Tripura": [9.30,9.75,9.89,11.35,11.46,11.77,0.07],
  "Kerala": [5.04,16.22,14.52,25.08,25.85,10.17,7.76],
  "Manipur": [6.23,4.51,6.64,6.89,7.42,5.16,5.99],
  "Gujarat": [3.06,3.33,3.61,4.62,5.60,5.85,5.42],
  "Assam": [4.16,3.60,3.97,5.61,5.14,5.18,5.48],
  "Delhi": [3.09,3.00,3.82,3.81,5.02,3.04,3.45],
  "Nagaland": [2.11,2.86,3.71,3.51,3.59,3.70,4.65],
  "Uttarakhand": [1.44,1.55,1.73,1.98,1.96,1.92,1.92],
  "Rajasthan": [1.34,1.30,1.36,1.43,1.66,1.62,1.60],
  "Haryana": [1.24,1.41,1.30,1.61,1.66,1.76,4.48],
  "Chhattisgarh": [0.95,0.85,0.91,1.75,1.40,1.11,1.22],
  "Odisha": [0.92,0.99,1.02,1.15,1.26,1.25,1.18],
  "Madhya Pradesh": [0.86,0.84,0.88,1.00,1.22,1.28,1.47],
  "Punjab": [1.12,1.12,1.04,1.04,1.05,1.08,0.92],
  "Uttar Pradesh": [0.32,0.36,0.37,0.42,1.05,1.10,1.16],
  "Bihar": [0.25,0.11,0.22,0.25,0.41,0.25,0.25],
  "Jharkhand": [0.20,0.31,0.36,0.12,0.15,0.12,0.10]
};

// Jurisdictions held OUT of every spend-RANKING / scorecard surface (the /status-quo/
// bar chart, the homepage "one scandal" picker, the A–F report card) but kept in the
// /act/ letter tool so residents can still petition their government. Jammu & Kashmir:
// not a State since the contested 2019 reorganisation, and its pre-2019 spend cannot be
// split from Ladakh — ranking it as "a State under the same Constitution" would read as
// endorsing the status the Indian state asserts over the region, which the campaign does
// not. Reported separately in the /status-quo/ footnote.
const RANKING_EXCLUDE = ["Jammu & Kashmir"];
window.RANKING_EXCLUDE = RANKING_EXCLUDE;

// `free: true` = Act explicitly defines public libraries as free of fees (only Haryana 1989, Section 2(e)).
const LEGISLATION = {
  "Andhra Pradesh": {has_act: true, year: 1960, free: false},
  "Arunachal Pradesh": {has_act: true, year: 2009, free: false},
  "Assam": {has_act: false}, // NOT among the 19 primary-read bare acts (RRRLF archive); prior "1989" is unverified — if a primary source confirms an Assam PL Act, add here AND to evidence/charts/state-acts.json (→ 20)
  "Bihar": {has_act: true, year: 2008, free: false},
  "Chhattisgarh": {has_act: true, year: 2008, free: false},
  "Delhi": {has_act: false},
  "Goa": {has_act: true, year: 1993, free: false},
  "Gujarat": {has_act: true, year: 2001, free: false},
  "Haryana": {has_act: true, year: 1989, free: true},
  "Himachal Pradesh": {has_act: false},
  "Jammu & Kashmir": {has_act: false},
  "Jharkhand": {has_act: false},
  "Karnataka": {has_act: true, year: 1965, free: false},
  "Kerala": {has_act: true, year: 1989, free: false},
  "Madhya Pradesh": {has_act: false},
  "Maharashtra": {has_act: true, year: 1967, free: false},
  "Manipur": {has_act: true, year: 1988, free: false},
  "Meghalaya": {has_act: false},
  "Mizoram": {has_act: true, year: 1993, free: false},
  "Nagaland": {has_act: false},
  "Odisha": {has_act: true, year: 2001, free: false},
  "Puducherry": {has_act: false},
  "Punjab": {has_act: false},
  "Rajasthan": {has_act: true, year: 2006, free: false},
  "Sikkim": {has_act: false},
  "Tamil Nadu": {has_act: true, year: 1948, free: false},
  "Telangana": {has_act: true, year: 1960, free: false},
  "Tripura": {has_act: false},
  "Uttar Pradesh": {has_act: true, year: 2006, free: false},
  "Uttarakhand": {has_act: true, year: 2005, free: false},
  "West Bengal": {has_act: true, year: 1979, free: false}
};

// The six States that fund public libraries through a WORKING (operative) cess —
// the funding model the /act/ letters hold up (Tamil Nadu 1948 is the parent,
// Kerala the reform). Primary read: research/library-law/bare-acts-comparative-analysis.md
// (matches evidence/charts/state-acts.json cess="operative").
const OPERATIVE_CESS = ["Tamil Nadu", "Andhra Pradesh", "Telangana", "Karnataka", "Kerala", "Goa"];

// Jurisdiction-level contacts for the dual-addressee letter (CM + PM cc).
// PMO has no public direct email — uses the official "Write to the PM" form
// at pmindia.gov.in. CPGRAMS (pgportal.gov.in) is the unified central
// grievance portal — every submission receives a docket + response timeline.
// State grievance portals + CM social handles VERIFIED from an ap-south-1 (India)
// IP, 2026-07-03. Public libraries are a STATE-LIST subject: grievances go to the
// STATE, NOT the Union. CPGRAMS (pgportal.gov.in) routes to central ministries and
// is therefore wrong here. Dead-portal recovery: Jharkhand -> cm.jharkhand.gov.in/
// write-to-cm; Maharashtra -> Aaple Sarkar; WB -> Samashya Samadhan; Assam kept
// (flaky but live). Where no live state portal (Uttarakhand broken-TLS; Nagaland /
// Puducherry none), portal=null: the resident POSTS the /act/ letter to the CM's
// address. Unverifiable CMO emails DROPPED. x / insta = CM social handles; OFFICE
// handles (@...CMO) are preferred as they survive a change of CM — a few are
// personal (e.g. Jharkhand insta @hemantsorenjmm) and will point at the wrong
// person once that CM leaves.
//
// !! MAINTENANCE: re-verify this whole block on a schedule — roughly every 3 months
// (a quarter is a long time in Indian politics) AND after any State election. CMs
// change and portals/handles drift (dead domains,
// broken TLS, renamed or deleted accounts). Personal (non-@...CMO) handles go stale
// first. Re-run the India-IP portal sweep and re-check every x / insta before
// trusting them as live.
const JURISDICTION_CONTACTS = {
  _centre: {
    title: "Hon'ble Prime Minister of India",
    email: null,
    portal: "https://www.pmindia.gov.in/en/interact-with-honble-pm/",
    central_grievance: "https://pgportal.gov.in"
  },
  "Andhra Pradesh":    { title: "Hon'ble Chief Minister, Government of Andhra Pradesh", email: null, portal: "https://pgrs.ap.gov.in/", pname: "Public Grievance Redressal System", insta: "@andhrapradeshcm" },
  "Arunachal Pradesh": { title: "Hon'ble Chief Minister, Government of Arunachal Pradesh", email: null, portal: "https://cmejansunwai.arunachal.gov.in/", pname: "CM e-Jansunwai", x: "@ArunachalCMO" },
  "Assam":             { title: "Hon'ble Chief Minister, Government of Assam", email: null, portal: "https://cm.assam.gov.in/write-to-cm", pname: "Write to the CM", x: "@CMOfficeAssam" },
  "Bihar":             { title: "Hon'ble Chief Minister, Government of Bihar", email: null, portal: "https://lokshikayat.bihar.gov.in", pname: "Bihar Lok Shikayat", x: "@officecmbihar" },
  "Chhattisgarh":      { title: "Hon'ble Chief Minister, Government of Chhattisgarh", email: null, portal: "https://cmhelpline.cg.gov.in", pname: "CM Helpline 1076", x: "@ChhattisgarhCMO", insta: "@chhattisgarhcmo" },
  "Delhi":             { title: "Hon'ble Chief Minister, Government of NCT of Delhi", email: null, portal: "https://cmjansunwai.delhi.gov.in", pname: "CM Jan Sunwai", x: "@CMODelhi" },
  "Goa":               { title: "Hon'ble Chief Minister, Government of Goa", email: null, portal: "https://cmhelpline.dpg.goa.gov.in/", pname: "CM Helpline 1905", x: "@goacm", insta: "@goacmo" },
  "Gujarat":           { title: "Hon'ble Chief Minister, Government of Gujarat", email: null, portal: "https://cmogujarat.gov.in/en/write-to-cmo", pname: "Write to CM", x: "@CMOGuj", insta: "@cmogujarat" },
  "Haryana":           { title: "Hon'ble Chief Minister, Government of Haryana", email: null, portal: "https://cmharyanacell.nic.in", pname: "CM Window", x: "@cmohry" },
  "Himachal Pradesh":  { title: "Hon'ble Chief Minister, Government of Himachal Pradesh", email: null, portal: "https://cmsankalp.hp.gov.in", pname: "Seva Sankalp 1100", x: "@CMOFFICEHP", insta: "@cmohimachal" },
  "Jammu & Kashmir":   { title: "Hon'ble Chief Minister, Government of J&K", email: null, portal: "https://samadhan.jk.gov.in/", pname: "JK Samadhan", x: "@CM_JnK" },
  "Jharkhand":         { title: "Hon'ble Chief Minister, Government of Jharkhand", email: null, portal: "https://cm.jharkhand.gov.in/write-to-cm", pname: "Write to the CM", x: "@JharkhandCMO", insta: "@hemantsorenjmm", address: "Chief Minister's Office, Project Building, Dhurwa, Ranchi 834004" },
  "Karnataka":         { title: "Hon'ble Chief Minister, Government of Karnataka", email: null, portal: "https://ipgrs.karnataka.gov.in/", pname: "Janaspandana", x: "@cmofkarnataka", insta: "@cmofkarnataka" },
  "Kerala":            { title: "Hon'ble Chief Minister, Government of Kerala", email: null, portal: "https://complaints.cmo.kerala.gov.in/", pname: "CM Grievance Cell", x: "@CMOKerala", insta: "@cmokerala" },
  "Madhya Pradesh":    { title: "Hon'ble Chief Minister, Government of Madhya Pradesh", email: null, portal: "https://cmhelpline.mp.gov.in", pname: "CM Helpline 181", x: "@CMMadhyaPradesh", insta: "@cmmadhyapradesh" },
  "Maharashtra":       { title: "Hon'ble Chief Minister, Government of Maharashtra", email: null, portal: "https://aaplesarkar.mahaonline.gov.in", pname: "Aaple Sarkar Grievance", x: "@CMOMaharashtra", insta: "@cmomaharashtra_" },
  "Manipur":           { title: "Hon'ble Chief Minister, Government of Manipur", email: null, portal: null, pname: null, x: "@manipur_cmo", insta: "@cmo_manipur", address: "Chief Minister's Secretariat, Babupara, Imphal West, Manipur 795001" },
  "Meghalaya":         { title: "Hon'ble Chief Minister, Government of Meghalaya", email: null, portal: "https://meghalaya.gov.in/services/content/19327", pname: "PGRMS / CM Connect", x: "@CMO_Meghalaya" },
  "Mizoram":           { title: "Hon'ble Chief Minister, Government of Mizoram", email: null, portal: null, pname: null, x: "@CMOMizoram", insta: "@cmo.mizoram", address: "Chief Minister's Office, New Secretariat Complex, Aizawl, Mizoram 796005" },
  "Nagaland":          { title: "Hon'ble Chief Minister, Government of Nagaland", email: null, portal: null, pname: null, x: "@CmoNagaland", address: "Chief Minister's Office, Civil Secretariat, Kohima, Nagaland" },
  "Odisha":            { title: "Hon'ble Chief Minister, Government of Odisha", email: null, portal: "https://janasunani.odisha.gov.in/", pname: "Jana Sunani", x: "@CMO_Odisha", insta: "@cmo_odisha" },
  "Puducherry":        { title: "Hon'ble Chief Minister, Government of Puducherry", email: null, portal: null, pname: null, x: "@CM_NRangaswamy", address: "Chief Minister's Office, No. 9 Vinayagar Koil Street, Thilaspet, Puducherry 605009" },
  "Punjab":            { title: "Hon'ble Chief Minister, Government of Punjab", email: null, portal: "https://connect.punjab.gov.in", pname: "Connect Punjab", x: "@CMOPb", insta: "@cmopb" },
  "Rajasthan":         { title: "Hon'ble Chief Minister, Government of Rajasthan", email: null, portal: "https://sampark.rajasthan.gov.in", pname: "Rajasthan Sampark", insta: "@rajcmo" },
  "Sikkim":            { title: "Hon'ble Chief Minister, Government of Sikkim", email: null, portal: null, pname: null, x: "@sikkimgovt", address: "Chief Minister's Office, Tashiling Secretariat, Gangtok, Sikkim 737101" },
  "Tamil Nadu":        { title: "Hon'ble Chief Minister, Government of Tamil Nadu", email: null, portal: "https://cmhelpline.tnega.org/", pname: "CM Helpline 1100", x: "@CMOTamilnadu", insta: "@cmotamilnadu" },
  "Telangana":         { title: "Hon'ble Chief Minister, Government of Telangana", email: null, portal: "https://prajavani.cgg.gov.in/", pname: "Prajavani", x: "@TelanganaCMO", insta: "@telanganacmo" },
  "Tripura":           { title: "Hon'ble Chief Minister, Government of Tripura", email: null, portal: "https://cmhelpline.tripura.gov.in/", pname: "CM Helpline 1905", x: "@tripura_cmo" },
  "Uttar Pradesh":     { title: "Hon'ble Chief Minister, Government of Uttar Pradesh", email: null, portal: "https://jansunwai.up.nic.in", pname: "Jansunwai IGRS", x: "@CMOfficeUP" },
  "Uttarakhand":       { title: "Hon'ble Chief Minister, Government of Uttarakhand", email: null, portal: null, pname: null, x: "@ukcmo", address: "Chief Minister's Office, Uttarakhand Secretariat, 4 Subhash Road, Dehradun 248001" },
  "West Bengal":       { title: "Hon'ble Chief Minister, Government of West Bengal", email: null, portal: "https://wb.gov.in/samashya-samadhan.aspx", pname: "Samashya Samadhan", x: "@CMOfficeWB" },

  // The 5 Union Territories WITHOUT a legislature: no CM, no MLA — administered
  // directly by the Centre through a Lieutenant Governor (Ladakh, A&N) or an
  // Administrator (Chandigarh, Lakshadweep, DNH&DD). The /act/ letter uses a UT
  // variant (utLetter in main.js): addressed to that office, the Centre answerable,
  // routed via CPGRAMS, no MLA Cc, no constituency. ut:true is the switch.
  "Ladakh":                               { ut: true, title: "Hon'ble Lieutenant Governor, Union Territory of Ladakh", salutation: "Hon'ble Lieutenant Governor,", mp: "Ladakh", email: null, portal: null, pname: null },
  "Chandigarh":                           { ut: true, title: "Hon'ble Administrator, Union Territory of Chandigarh", salutation: "Hon'ble Administrator,", mp: "Chandigarh", email: null, portal: null, pname: null },
  "Andaman & Nicobar Islands":            { ut: true, title: "Hon'ble Lieutenant Governor, Andaman & Nicobar Islands", salutation: "Hon'ble Lieutenant Governor,", mp: "Andaman & Nicobar Islands", email: null, portal: null, pname: null },
  "Lakshadweep":                          { ut: true, title: "Hon'ble Administrator, Union Territory of Lakshadweep", salutation: "Hon'ble Administrator,", mp: "Lakshadweep", email: null, portal: null, pname: null },
  "Dadra & Nagar Haveli and Daman & Diu": { ut: true, title: "Hon'ble Administrator, Dadra & Nagar Haveli and Daman & Diu", salutation: "Hon'ble Administrator,", mp: "Dadra & Nagar Haveli, or Daman & Diu", mp_list: ["Dadra & Nagar Haveli", "Daman & Diu"], email: null, portal: null, pname: null }
};

// UTs with no legislative assembly (no CM/MLA) — added to the /act/ dropdown
// alongside STATE_DATA; buildLetter routes them to utLetter via their ut:true flag.
const UT_NO_LEGISLATURE = ["Ladakh", "Chandigarh", "Andaman & Nicobar Islands", "Lakshadweep", "Dadra & Nagar Haveli and Daman & Diu"];

// Annual RRRLF grant disbursement (₹ Lakhs, 2003-2023)
const RRRLF_DATA = {
  2003:378.53, 2004:177.00, 2005:390.00, 2006:207.00,
  2008:332.00, 2010:887.43, 2012:2350.00, 2013:2670.30,
  2014:1139.32, 2015:710.00, 2016:2046.47, 2017:1493.40,
  2018:1363.61, 2019:697.36, 2020:745.73, 2021:782.83,
  2022:2680.64, 2023:645.74
};

// 2021-24 RRRLF utilisation by state (released, ₹ Lakhs, summed across years)
const RRRLF_RELEASED = {
  // computed from Q.1316 — values approximate; meaningful (>5L) entries by state
  "Gujarat": 933, "Tamil Nadu": 145, "Maharashtra": 372, "West Bengal": 442,
  "Karnataka": 397, "Goa": 40, "Mizoram": 122, "Nagaland": 110,
  "Telangana": 179, "Kerala": 154, "Tripura": 136, "Himachal Pradesh": 32,
  "Uttar Pradesh": 12, "Andhra Pradesh": 4, "Manipur": 4, "Madhya Pradesh": 9,
  "Arunachal Pradesh": 115, "Assam": 49, "Bihar": 124, "Delhi": 16,
  "Haryana": 78, "Jammu & Kashmir": 147, "Meghalaya": 38, "Odisha": 42,
  "Rajasthan": 134, "Sikkim": 1, "Uttarakhand": 1, "Chhattisgarh": 3,
  "Puducherry": 0, "Punjab": 0, "Jharkhand": 0
};

// State population (millions, ~2020 mid-year — used for the statue-test
// math). Census 2011 + standard projections.
const STATE_POP_MN = {
  "Andhra Pradesh": 53, "Arunachal Pradesh": 1.5, "Assam": 35, "Bihar": 124,
  "Chhattisgarh": 30, "Delhi": 19, "Goa": 1.7, "Gujarat": 67, "Haryana": 28,
  "Himachal Pradesh": 7.4, "Jammu & Kashmir": 14, "Jharkhand": 38,
  "Karnataka": 67, "Kerala": 36, "Madhya Pradesh": 85, "Maharashtra": 124,
  "Manipur": 3.2, "Meghalaya": 3.4, "Mizoram": 1.2, "Nagaland": 2.2,
  "Odisha": 46, "Puducherry": 1.5, "Punjab": 30, "Rajasthan": 80,
  "Sikkim": 0.7, "Tamil Nadu": 79, "Telangana": 38, "Tripura": 4.0,
  "Uttar Pradesh": 235, "Uttarakhand": 11, "West Bengal": 100
};
// STATUE_OF_UNITY_CR moved into CONSTANTS at the top of this file.
// Backwards-compatible alias for code that references it as a global:
const STATUE_OF_UNITY_CR = CONSTANTS.STATUE_OF_UNITY_CR;

const NML_STATES = new Set(['Arunachal Pradesh','Goa','Mizoram','Rajasthan','Telangana','Uttar Pradesh',
  'West Bengal','Assam','Madhya Pradesh','Maharashtra','Nagaland','Tamil Nadu','Karnataka',
  'Bihar','Himachal Pradesh','Haryana','Chhattisgarh','Odisha','Uttarakhand','Jammu & Kashmir',
  'Sikkim','Manipur','Meghalaya','Kerala','Puducherry','Punjab','Jharkhand']);

// India vs World (₹ per capita per year, order-of-magnitude). Lives on /data/ subpage now.
// Anchored at the top with rich-country comparators; India sits at the bottom
// (₹4.77 = consolidated state-plus-Centre real headline, WP-001) so the bar rounds to zero.
// Sources: IMLS Public Libraries Survey (USA); CIPFA (UK); ALIA (Australia);
// NAPLE Forum / Libraries.fi (Finland); Statistics Canada; Ministry of Culture
// & Tourism (PRC); Kulkarni-Balaji-Dhanamjaya 2025 (India).
const WORLD = [
  { name: "Finland",            value: 5500, india: false },
  { name: "USA",                value: 2900, india: false },
  { name: "Australia",          value: 2400, india: false },
  { name: "UK",                 value: 1820, india: false },
  { name: "Canada",             value: 1700, india: false },
  { name: "China",              value: 250,  india: false },
  { name: "India",              value: 4.77, india: true }
];

const STANDARDS = [
  { n: "01", short: "Free", long: "No fees, no subscription, no membership cost. Ever." },
  { n: "02", short: "Anti-caste", long: "No discrimination on caste, class, gender, sexuality, ability, religion, language." },
  { n: "03", short: "Universal access", long: "Provisions for persons with disabilities. Hours that fit working lives." },
  { n: "04", short: "Internet", long: "Free, fast, private, uncensored Wi-Fi and devices for all members." },
  { n: "05", short: "Local", long: "Collections in the languages of the community. Books that look back at the reader." },
  { n: "06", short: "Private", long: "What you read is your business. No surveillance. No data sold." },
  { n: "07", short: "Funded", long: "Public money. Per capita allocations tied to standards. Audited." }
];

const EXCLUDED = [
  { id: "dalit",      label: "Dalit, Bahujan, Adivasi", stats: "ST: 69.1% · SC: 73.5% (Literacy, 2022-23)" },
  { id: "women",      label: "Women, non-binary & trans people", stats: "Women: 71.5% vs Men: 84.4% (Literacy, NFHS-5)" },
  { id: "disabled",   label: "Persons with disabilities", stats: "Systematically un-counted in library infrastructure" },
  { id: "working",    label: "The working class & rural poor", stats: "Rural Literacy: 74.9% vs Urban: 88.3%" },
  { id: "muslim",     label: "Religious minorities", stats: "OBC literacy: 78.9% (includes many Muslim groups)" },
  { id: "linguistic", label: "Speakers of non-dominant languages", stats: "Collections lack non-dominant languages" }
];

// Rural library coverage percentage (Gram Panchayats with functional libraries).
// Source: MoPR PAI 2.0 (Panchayat Advancement Index) Baseline Report 2025, Indicator T6.12.
const RURAL_COVERAGE = {
  "Kerala": 98,
  "Tripura": 95,
  "Maharashtra": 92.9,
  "Gujarat": 85,
  "Telangana": 82,
  "Tamil Nadu": 75,
  "Uttar Pradesh": 40,
  "Andhra Pradesh": 35,
  "Bihar": 22,
  "National": 45.72
};
window.RURAL_COVERAGE = RURAL_COVERAGE;

// Narrowed focus: the two specific State efforts that failed/are failing.
// Phule, Ambedkar, Ranganathan, Birsa, Baroda, Haryana, FLN draft, China 2017
// Full chronology — pre-colonial destruction → colonial extraction →
// Independence-era promise → six decades of Centre neglect → the present.
// The arc shows that the assault on public knowledge in South Asia has
// never been a single moment; it is a long thread.
const HISTORY = [
  // Anti-caste-first framing: timeline starts at Phule's 1848 school —
  // the first political act of reading in the anti-caste tradition.
  // Earlier precedents (Nalanda's Buddhist library sacked in 1193;
  // British plunder of Tipu Sultan's library in 1799) are deeper
  // backdrop and live in the lede / "What was destroyed" section,
  // NOT as dots on this scrubber. Their inclusion compressed the
  // post-Phule events into the right edge of the line.
  { year: "1848", title: "Phule opens a school for Dalit girls", body: "Jotirao and Savitribai Phule open the first school for Dalit-Bahujan girls in Pune. Reading is the first political act. Brahmin neighbours throw cow-dung at Savitribai on her walk to school." },
  { year: "1873", title: "Satyashodhak Samaj", body: "Phule's Society of Truth-Seekers names knowledge-gatekeeping for what it is — a brahminical lock on the public mind, older than colonialism, surviving it." },
  { year: "1901", title: "Telangana Library Movement begins", body: "Under Nizam-era Hyderabad, a network of village reading rooms emerges — one of the earliest sustained library movements in South Asia. By 1948 it has 240 libraries across the region." },
  { year: "1910", title: "Baroda Central Library opens — free, open to all", body: "Sayajirao Gaekwad III, inspired by American public libraries, founds the Baroda Central Library on the principle of universal free access. He also funds Ambedkar's scholarship to Columbia. Newton Mohan Dutt's 1928 study Baroda and its libraries documents the model." },
  { year: "1911", title: "Hindi Sahitya Sammelan", body: "Founded under the Nagari Pracharini Sabha in Allahabad — the first deliberate archive of Hindi print, an anti-colonial reclamation of the language as a public knowledge medium." },
  { year: "1915", title: "Ambedkar writes from Columbia: build a library, not a statue", body: "From New York, the young Ambedkar urges the Bombay government to commemorate Sir Pherozshah Mehta by building a public library — not a statue. The statue went up. The library never came." },
  { year: "1925", title: "Periyar founds the Self-Respect Movement", body: "Periyar resigns from the Congress and launches Suya Mariyathai Iyakkam — the Self-Respect Movement. Kudi Arasu (weekly newspaper) launches the same year as its flagship publication. Self-Respecters preferred Kudi Arasu and Viduthalai over nationalist papers; the movement built alternative spaces for socialisation and rationalist education outside Brahminical control. Print and reading become the spine of a mass anti-caste movement, decades before the State would build a single free public library." },
  { year: "1931", title: "Ranganathan's Five Laws", body: "Books are for use. Every reader her book. Every book its reader. Save the time of the reader. The library is a growing organism. Free was the first one." },
  { year: "1933", title: "Rajgruha: A house for 50,000 books", body: "Ambedkar completes his three-story home in Dadar, Mumbai, designed specifically to house his library. He named it Rajgruha after the ancient Buddhist capital. It becomes one of the largest private libraries in the world, built by a man who was once denied entry to public libraries." },
  { year: "1945", title: "Travancore Library Association — the village-library movement begins", body: "P.N. Panicker convenes the Thiruvithaamkoor Granthasala Sangham at the P.K. Memorial Library in Ambalapuzha on 16 September 1945, with 47 rural libraries. Slogan: ‘Read and Grow.’ Renamed Kerala Grandhasala Sangham after states reorganisation in 1956, it grows — panchayat by panchayat — into a 6,000-library network: the densest village-library system in India and the infrastructure underneath Kerala's literacy outcomes for the next 80 years." },
  { year: "1947–49", title: "Partition shatters the libraries", body: "Delhi's Urdu collections are split, looted, or burned. Scholars die or flee. The Maulana Hifzur Rahman Seoharvi tries to save the Madrasa Aminia library; much of it is lost. Partition was also a knowledge-destruction event." },
  { year: "1948", title: "Tamil Nadu Library Act — India's first", body: "Drafted with Ranganathan's input, but restricts membership to paying users — contradicting his own First Law on the day of its passage." },
  { year: "1956", title: "Ambedkar dies, leaving 50,000 books at Rajgruha", body: "Babasaheb's personal library at his Mumbai home is the largest in 1950s India. The country that wouldn't let him into a public library left him no choice but to build his own." },
  { year: "1962", title: "KSSP — science for social revolution", body: "Kerala Sasthra Sahithya Parishad inaugurated at Devagiri College, Kozhikode, on 10 September 1962 by a group of 40 science writers and teachers. ‘Science for Social Revolution.’ Reading circles, science publishing in Malayalam, library campaigns, total-literacy organising. Wins the Right Livelihood Award in 1996. Proof that mass literacy in India has been led by movements, not ministries." },
  { year: "1967", title: "DMK comes to power — and reading rooms become governance", body: "Annadurai becomes Chief Minister of Madras State. Through the 1950s and 60s the Dravidian movement had built padippakams — reading rooms attached to DMK branch offices, stocked with Periyar-Anna-Karunanidhi pamphlets and run as night schools for non-literate adults. After 1967, this movement infrastructure is folded into the State; in 1972, the DMK government establishes a dedicated Directorate of Public Libraries — the only Indian state where reading rooms moved from movement to ministry at scale." },
  { year: "1986", title: "Chattopadhyay Committee — drafted, then shelved", body: "A government-appointed committee declares what should have been obvious: public libraries must be free, and the State must fund them. The Union Government receives the report. The recommendations sit on a shelf — the same shelf the books are not on." },
  { year: "1989", title: "Haryana defines its public libraries as actually free", body: "Three years after Chattopadhyay, Haryana passes the Public Libraries Act, 1989 (Haryana No. 20 of 1989). Section 2(e) defines a public library as ‘a library, which permits members of the public to use it for reference or borrowing without charging fee or subscription.’ To date, the only Indian state Act whose legal definition of ‘public library’ excludes fees. Two years before liberalisation slams the door on this kind of public-good legislation." },
  { year: "1991", title: "Liberalisation: the State retreats from social services", body: "Manmohan Singh's structural-adjustment reforms unbundle subsidies, open to foreign investment, and reframe public spending as inefficient. The Chattopadhyay Committee's call for a publicly-funded national library system — made five years earlier — becomes politically unaffordable in a single budget cycle. Privatisation, not provision, is the new common sense." },
  { year: "1993", title: "The Centre 'considers' a library policy. Decides to do nothing", body: "An internal review revisits the 1986 Chattopadhyay recommendations. It acknowledges them, then concludes that fiscal space is unavailable. The draft is shelved a second time. The library question goes silent at the Centre for over a decade." },
  { year: "1996", title: "Kerala's People's Plan — power, and money, to the panchayat", body: "On 25 August 1996, the LDF government under E.K. Nayanar launches Janakeeya Aasoothranam, with EMS Namboodiripad as architect. 35% of state development funds devolved to panchayats; gram sabhas decide local priorities. The State that already has the densest village-library network in India (built by KLA volunteers since 1945) hands its panchayats real budgets. Decentralisation does what national policy refused to do: makes a public library a local government's job, not a Centre's promise." },
  { year: "2007", title: "National Knowledge Commission · Libraries as 'knowledge economy' infrastructure", body: "Sam Pitroda's NKC, commissioned by Manmohan Singh in 2005, releases 'Libraries: Gateways to Knowledge.' The framing has shifted: libraries are now digital infrastructure for the 'knowledge society,' not constitutional public institutions. The report recommends a small, technology-led National Mission on Libraries. The anti-caste, free-access argument from Phule, Ambedkar, and Chattopadhyay does not appear." },
  { year: "2014", title: "National Mission on Libraries — too small to matter", body: "Seven years after NKC, NML launches. ₹78.7 crore sanctioned in total to modernise 64 libraries — in a country of 1.4 billion. Roughly the price of one South Mumbai apartment. ₹20.6 crore of that remains undisbursed. NML is not a policy. It is a press release." },
  { year: "2016", title: "The categorisation that buried the Mission", body: "A Cabinet decision on 3 August 2016 sorts centrally-sponsored schemes into Core (states must fund) and Optional (states may, if they like). The National Mission on Libraries fits none of the ten Core priority sectors — the Ministry of Culture had no seat on the sub-group — so it falls, by residual, into the Optional bucket no one is obliged to fund. The de-prioritisation of public libraries was not debated. It was a filing decision. (Cabinet ratification, PIB; NITI Aayog Sub-Group report, Oct 2015.)" },
  { year: "2017", title: "China enacts a Public Library Law", body: "A comparably-sized country enshrines public libraries as a statutory right. India still has no equivalent — the draft has been pending since the 1986 Chattopadhyay Committee." },
  { year: "2019–20", title: "One website launched, the Mission declared 'complete'", body: "The Indian Culture Portal — one of the four components of the National Mission on Libraries — goes live in December 2019. Three months later, in March 2020, the Ministry tells the Rajya Sabha the Mission 'is complete now' and is not extended. The other three components — the Centre-State matching scheme that would have built physical libraries, the survey, the capacity-building — are treated as finished by being abandoned. That year the library-development budget collapses to ₹0.73 crore against ₹118.51 crore allocated: not unallocated — unspent. (RS Q.277, 12.03.2020; RS Q.310, Feb 2022; Union Budget RE 2019-20.)" },
  { year: "2020", title: "National Education Policy 2020 — libraries reduced to 'digital'", body: "The first major education policy in 35 years. Library mentions are overwhelmingly about digital access and digitisation — 'one nation, one digital library' replaces the question of physical public libraries entirely. The library as anti-caste infrastructure, as a constitutional public good, as a place where caste, gender, and class meet on neutral ground — gets no chapter, no allocation, no target." },
  { year: "2024", title: "FLN publishes the People's National Library Policy", body: "The Free Libraries Network drafts and publishes PNLP24 — the document the State has refused to write for seventy-five years." },
  { year: "2024–25", title: "The Digital Shift — ₹5,000 crore for 'Digital Libraries'", body: "In the 2023–24 budget, the Centre earmarks a ₹5,000 crore corpus for states to build digital libraries at the Panchayat level. The physical public library remains un-funded. The State chooses the screen over the shelf — a shift that bypasses the millions without reliable electricity or devices." },
  { year: "2026", title: "You read this", body: "What happens next is up to people who have a bookshelf at home and a friend who is a Member of Parliament." }
];

// `iso` = BCP 47 / ISO 639 language code for the `text` field. Used in `lang=`
// attribute on the rendered <blockquote> so screen readers + browsers pick the
// right phoneme inventory and font fallback.
const QUOTES = [
  { iso: "mr", script: "deva",  text: "विद्ये विना मती गेली। मती विना नीती गेली।", attr: "महात्मा फुले", en: "Without learning, intellect was lost. Without intellect, morality was lost.", attrEn: "Jyotirao Phule" },
  { iso: "en",                  text: "Cultivate the mind. Educate. Agitate. Organise.", attr: "Dr. B. R. Ambedkar" },
  { iso: "ta", script: "tamil", text: "பகுத்தறிவு இல்லாதவன் மனிதன் அல்ல.", attr: "தந்தை பெரியார்", en: "One without rational thought is not yet human.", attrEn: "Periyar E. V. Ramasamy" },
  { iso: "hi", script: "deva",  text: "अबुआ दिशुम, अबुआ राज।", attr: "बिरसा मुंडा", en: "Our country, our rule.", attrEn: "Birsa Munda" },
  { iso: "mr", script: "deva",  text: "शिकलेली बाई घर सुधारते, गाव सुधारते.", attr: "सावित्रीबाई फुले", en: "An educated woman improves the home and the village.", attrEn: "Savitribai Phule" },
  { iso: "en",                  text: "Books are for use. Every reader her book. Every book its reader.", attr: "S. R. Ranganathan, Five Laws of Library Science" }
];

const ACTIONS = [
  { n: "01", verb: "WALK", title: "into the nearest public library this week.", body: "Find one. Sit in it. See who is there and who is not. See what books they have, what they don't. See whether they charge. Tell three friends what you saw." },
  { n: "02", verb: "ASK", title: "what your state's library budget is.", body: "File an RTI. Most states won't have a clean answer. That is itself the answer. Publish what you find." },
  { n: "03", verb: "FUND", title: "a free library that already exists.", body: "The Free Libraries Network runs and supports community libraries across India — most of them on a hand-to-mouth budget. ₹1,000 a month from a middle-class household keeps a child reading for a year." },
  { n: "04", verb: "DONATE", title: "books — but only the ones a child would actually read.", body: "Not your old college textbooks. Picture books in the local language. Adolescent fiction. Comics. Books that look like the children who will read them." },
  { n: "05", verb: "TEACH", title: "a reading session, once a week, in your neighbourhood.", body: "Not a curriculum. Not a coaching class. Just reading. Out loud, in any language. With anyone who wants to listen." },
  { n: "06", verb: "MAP", title: "your local reading rooms.", body: "Is there a public reading room in your ward? Is it on Google Maps? Does it have a sign? Map the infrastructure that the State has forgotten." }
];

// ─── DIVERSION GAME ROUNDS ────────────────────────────────────────
// Each round: India had a real budget, and funded one of the listed
// items. The user picks. The "correct" item is always the vanity
// option. By round 4, the user has internalised the pattern: India
// funds vanity. The diversion is the strategy.
const DIVERSION_ROUNDS = [
  {
    year: 2018,
    budget: "₹2,989 crore",
    prompt: "It's <strong>2018</strong>. India had <strong>₹2,989 crore</strong> on the table. India funded <strong>ONE</strong> of these. Pick which.",
    options: [
      { text: "A new IIT campus", cost: "~₹1,500 cr" },
      { text: "The country's largest public library system, twice over", cost: "~₹1,500 cr" },
      { text: "Universal child stunting elimination across two states", cost: "~₹500 cr" },
      { text: "A 182-metre statue", cost: "₹2,989 cr", correct: true }
    ],
    feedback: "<strong>India built the Statue of Unity.</strong> ₹2,989 crore. The world's tallest statue. With the same money the Centre could have funded its <strong>library foundation for fifteen years</strong>, eliminated child stunting in two whole states, and still had change for an IIT.",
    diversion: "Sold to the public as 'national pride.'"
  },
  {
    year: 2014,
    budget: "₹78.7 crore",
    prompt: "It's <strong>2014</strong>. India had <strong>₹78.7 crore</strong> for the National Mission on Libraries. It modernised <strong>ONE</strong> of these. Pick which.",
    options: [
      { text: "5,000 panchayat-level libraries (one per ~150 villages)", cost: "~₹16 lakh each" },
      { text: "1,000 district libraries with new books and Wi-Fi", cost: "~₹8 lakh each" },
      { text: "64 libraries — total — across all of India", cost: "~₹1.2 cr each", correct: true },
      { text: "200 women's reading rooms in rural districts", cost: "~₹40 lakh each" }
    ],
    feedback: "<strong>India modernised 64 libraries.</strong> Sixty-four. In a country of 1.4 billion people. That works out to <strong>one library per 22 million Indians</strong>. The mission is a press release. ₹20.6 crore of the sanctioned amount remains undisbursed a decade on.",
    diversion: "The press release said 'transformative.'"
  },
  {
    year: 2024,
    budget: "₹3,000 crore",
    prompt: "Across one fiscal year, the Centre spent <strong>~₹3,000 crore</strong> on government advertising — its own image. With the same money, India could have funded <strong>ONE</strong> of these. Which did it actually choose?",
    options: [
      { text: "15× the entire annual public-library budget of every state combined", cost: "~₹3,000 cr" },
      { text: "Free school lunches for 30 million additional children", cost: "~₹3,000 cr" },
      { text: "10,000 primary health sub-centres", cost: "~₹3,000 cr" },
      { text: "Government advertising. Newspapers, TV, hoardings, jingles.", cost: "₹3,000 cr", correct: true }
    ],
    feedback: "<strong>India bought ad space.</strong> Newspapers, TV, hoardings, jingles. Around <strong>₹3,000 crore</strong> on the State's own publicity. That is roughly <strong>15× the country's entire library budget</strong>. The State spent more on telling you it was working than on the work.",
    diversion: "Frames itself as 'public information.'"
  },
  {
    year: 2019,
    budget: "₹1,45,000 crore",
    prompt: "In <strong>2019</strong> the Union government had a <strong>₹1.45 lakh crore</strong> hole to fill in revenue. It chose <strong>ONE</strong> of these.",
    options: [
      { text: "100 years of full library funding for the entire country", cost: "~₹1.4 lakh cr" },
      { text: "A National Public Library Law + 50,000 new libraries", cost: "~₹1.5 lakh cr" },
      { text: "MNREGA expansion + universal free school meals", cost: "~₹1.4 lakh cr" },
      { text: "A corporate tax cut. Permanent. From 30% to 22%.", cost: "₹1,45,000 cr revenue forgone (FY 2019-20)", correct: true }
    ],
    feedback: "<strong>India cut corporate tax.</strong> ₹1.45 lakh crore in revenue forgone — every year, compounding. That is more than <strong>100× the country's annual library spend</strong>, gifted upward, in perpetuity. The promised investment surge never came. The libraries didn't either.",
    diversion: "Sold as 'investment-led growth.'"
  },
  {
    year: 2022,
    budget: "₹20,000 crore",
    prompt: "<strong>Central Vista</strong>, the Delhi redevelopment project — original budget ₹13,450 cr, since revised. Most current estimate: <strong>~₹20,000 crore.</strong> India chose <strong>ONE</strong> of these.",
    options: [
      { text: "A district public library in every one of India's 800 districts", cost: "~₹2,000 cr" },
      { text: "A new AIIMS hospital in 8 underserved states", cost: "~₹16,000 cr" },
      { text: "A new Parliament + new central government office complex + new PM/VP residences", cost: "₹20,000 cr (rising)", correct: true },
      { text: "Free higher education for every Dalit, Adivasi & OBC student for 5 years", cost: "~₹15,000 cr" }
    ],
    feedback: "<strong>India built the Central Vista.</strong> A new Parliament, new offices, new residences. Most recent estimate: ~₹20,000 crore, rising. With the same money India could have built a <strong>district public library in all 800 districts</strong> — and still funded eight new AIIMS hospitals.",
    diversion: "Promoted as 'modernising democracy.'"
  },
  {
    year: 2023,
    budget: "₹4,000 crore (cumulative)",
    prompt: "Renamed cities, stations, airports, highways, schemes. The cumulative cost of just the <strong>renaming-and-rebranding</strong> — new signage, stationery, web infra, GIS updates — runs into <strong>thousands of crores</strong>. India chose <strong>ONE</strong> path.",
    options: [
      { text: "Update every government textbook with current science + civics", cost: "~₹500 cr" },
      { text: "Spend on translation + Devanagari/regional-script open-access digital books", cost: "~₹300 cr" },
      { text: "Rename Allahabad, Faizabad, Aurangabad, Ahmednagar, Mughalsarai — and counting", cost: "~₹4,000 cr (signage / stationery / digital infra)", correct: true },
      { text: "Pay every public-school teacher a 5% raise for 3 years", cost: "~₹3,500 cr" }
    ],
    feedback: "<strong>India renamed cities.</strong> Thousands of crores in signage, stationery, GIS database updates, court-order compliance, train indicators, official letterheads. The textbooks didn't get updated. The teachers didn't get paid. The library was never built. <strong>The map was redrawn instead.</strong>",
    diversion: "Marketed as 'reclaiming heritage.'"
  }
];

// Campaign channels — the SINGLE source for the site-wide footer. Rendered by
// assets/core/footer.js via ContentPort.channels(); never hand-write channel
// markup in HTML. Toggle a channel with `enabled`; add a live link by filling
// `url` (empty url ⇒ rendered as a non-clickable icon). Order here is render order.
const CHANNELS = [
  { key: 'whatsapp',  label: 'WhatsApp',  url: '', enabled: false, icon: 'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z' },
  { key: 'telegram',  label: 'Telegram',  url: '', enabled: false, icon: 'M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z' },
  { key: 'youtube',   label: 'YouTube',   url: 'https://www.youtube.com/@theright2read', enabled: true,  icon: 'M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z' },
  { key: 'instagram', label: 'Instagram', url: 'https://www.instagram.com/theright2read/', enabled: true,  icon: 'M7.0301.084c-1.2768.0602-2.1487.264-2.911.5634-.7888.3075-1.4575.72-2.1228 1.3877-.6652.6677-1.075 1.3368-1.3802 2.127-.2954.7638-.4956 1.6365-.552 2.914-.0564 1.2775-.0689 1.6882-.0626 4.947.0062 3.2586.0206 3.6671.0825 4.9473.061 1.2765.264 2.1482.5635 2.9107.308.7889.72 1.4573 1.388 2.1228.6679.6655 1.3365 1.0743 2.1285 1.38.7632.295 1.6361.4961 2.9134.552 1.2773.056 1.6884.069 4.9462.0627 3.2578-.0062 3.668-.0207 4.9478-.0814 1.28-.0607 2.147-.2652 2.9098-.5633.7889-.3086 1.4578-.72 2.1228-1.3881.665-.6682 1.0745-1.3378 1.3795-2.1284.2957-.7632.4966-1.636.552-2.9124.056-1.2809.0692-1.6898.063-4.948-.0063-3.2583-.021-3.6668-.0817-4.9465-.0607-1.2797-.264-2.1487-.5633-2.9117-.3084-.7889-.72-1.4568-1.3876-2.1228C21.2982 1.33 20.628.9208 19.8378.6165 19.074.321 18.2017.1197 16.9244.0645 15.6471.0093 15.236-.005 11.977.0014 8.718.0076 8.31.0215 7.0301.0839m.1402 21.6932c-1.17-.0509-1.8053-.2453-2.2287-.408-.5606-.216-.96-.4771-1.3819-.895-.422-.4178-.6811-.8186-.9-1.378-.1644-.4234-.3624-1.058-.4171-2.228-.0595-1.2645-.072-1.6442-.079-4.848-.007-3.2037.0053-3.583.0607-4.848.05-1.169.2456-1.805.408-2.2282.216-.5613.4762-.96.895-1.3816.4188-.4217.8184-.6814 1.3783-.9003.423-.1651 1.0575-.3614 2.227-.4171 1.2655-.06 1.6447-.072 4.848-.079 3.2033-.007 3.5835.005 4.8495.0608 1.169.0508 1.8053.2445 2.228.408.5608.216.96.4754 1.3816.895.4217.4194.6816.8176.9005 1.3787.1653.4217.3617 1.056.4169 2.2263.0602 1.2655.0739 1.645.0796 4.848.0058 3.203-.0055 3.5834-.061 4.848-.051 1.17-.245 1.8055-.408 2.2294-.216.5604-.4763.96-.8954 1.3814-.419.4215-.8181.6811-1.3783.9-.4224.1649-1.0577.3617-2.2262.4174-1.2656.0595-1.6448.072-4.8493.079-3.2045.007-3.5825-.006-4.848-.0608M16.953 5.5864A1.44 1.44 0 1 0 18.39 4.144a1.44 1.44 0 0 0-1.437 1.4424M5.8385 12.012c.0067 3.4032 2.7706 6.1557 6.173 6.1493 3.4026-.0065 6.157-2.7701 6.1506-6.1733-.0065-3.4032-2.771-6.1565-6.174-6.1498-3.403.0067-6.156 2.771-6.1496 6.1738M8 12.0077a4 4 0 1 1 4.008 3.9921A3.9996 3.9996 0 0 1 8 12.0077' },
  { key: 'x',         label: 'X',         url: 'https://x.com/theright2read', enabled: true,  icon: 'M14.234 10.162 22.977 0h-2.072l-7.591 8.824L7.251 0H.258l9.168 13.343L.258 24H2.33l8.016-9.318L16.749 24h6.993zm-2.837 3.299-.929-1.329L3.076 1.56h3.182l5.965 8.532.929 1.329 7.754 11.09h-3.182z' },
  { key: 'bluesky',   label: 'Bluesky',   url: 'https://bsky.app/profile/theright2read.org', enabled: true, icon: 'M5.202 2.857C7.954 4.922 10.913 9.11 12 11.358c1.087-2.247 4.046-6.436 6.798-8.501C20.783 1.366 24 .213 24 3.883c0 .732-.42 6.156-.667 7.037-.856 3.061-3.978 3.842-6.755 3.37 4.854.826 6.089 3.562 3.422 6.299-5.065 5.196-7.28-1.304-7.847-2.97-.104-.305-.152-.448-.153-.327 0-.121-.05.022-.153.327-.568 1.666-2.782 8.166-7.847 2.97-2.667-2.737-1.432-5.473 3.422-6.3-2.777.473-5.899-.308-6.755-3.369C.42 10.04 0 4.615 0 3.883c0-3.67 3.217-2.517 5.202-1.026' },
  { key: 'mastodon',  label: 'Mastodon',  url: '', enabled: false, icon: 'M23.268 5.313c-.35-2.578-2.617-4.61-5.304-5.004C17.51.242 15.792 0 11.813 0h-.03c-3.98 0-4.835.242-5.288.309C3.882.692 1.496 2.518.917 5.127.64 6.412.61 7.837.661 9.143c.074 1.874.088 3.745.26 5.611.118 1.24.325 2.47.62 3.68.55 2.237 2.777 4.098 4.96 4.857 2.336.792 4.849.923 7.256.38.265-.061.527-.132.786-.213.585-.184 1.27-.39 1.774-.753a.057.057 0 0 0 .023-.043v-1.809a.052.052 0 0 0-.02-.041.053.053 0 0 0-.046-.01 20.282 20.282 0 0 1-4.709.545c-2.73 0-3.463-1.284-3.674-1.818a5.593 5.593 0 0 1-.319-1.433.053.053 0 0 1 .066-.054c1.517.363 3.072.546 4.632.546.376 0 .75 0 1.125-.01 1.57-.044 3.224-.124 4.768-.422.038-.008.077-.015.11-.024 2.435-.464 4.753-1.92 4.989-5.604.008-.145.03-1.52.03-1.67.002-.512.167-3.63-.024-5.545zm-3.748 9.195h-2.561V8.29c0-1.309-.55-1.976-1.67-1.976-1.23 0-1.846.79-1.846 2.35v3.403h-2.546V8.663c0-1.56-.617-2.35-1.848-2.35-1.112 0-1.668.668-1.67 1.977v6.218H4.822V8.102c0-1.31.337-2.35 1.011-3.12.696-.77 1.608-1.164 2.74-1.164 1.311 0 2.302.5 2.962 1.498l.638 1.06.638-1.06c.66-.999 1.65-1.498 2.96-1.498 1.13 0 2.043.395 2.74 1.164.675.77 1.012 1.81 1.012 3.12z' },
  { key: 'threads',   label: 'Threads',   url: '', enabled: false, icon: 'M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.589 12c.027 3.086.718 5.496 2.057 7.164 1.43 1.783 3.631 2.698 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.361-.218-3.259-.801-1.063-.689-1.685-1.74-1.752-2.964-.065-1.19.408-2.285 1.33-3.082.88-.76 2.119-1.207 3.583-1.291a13.853 13.853 0 0 1 3.02.142c-.126-.742-.375-1.332-.75-1.757-.513-.586-1.308-.883-2.359-.89h-.029c-.844 0-1.992.232-2.721 1.32L7.734 7.847c.98-1.454 2.568-2.256 4.478-2.256h.044c3.194.02 5.097 1.975 5.287 5.388.108.046.216.094.321.142 1.49.7 2.58 1.761 3.154 3.07.797 1.82.871 4.79-1.548 7.158-1.85 1.81-4.094 2.628-7.277 2.65Z' },
  { key: 'substack',  label: 'Substack',  url: 'https://theright2read.substack.com', enabled: true, icon: 'M22.539 8.242H1.46V5.406h21.08v2.836zM1.46 10.812V24L12 18.11 22.54 24V10.812H1.46zM22.54 0H1.46v2.836h21.08V0z' },
  { key: 'rss',       label: 'RSS',       url: '', enabled: false, icon: 'M19.199 24C19.199 13.467 10.533 4.8 0 4.8V0c13.165 0 24 10.835 24 24h-4.801zM3.291 17.415c1.814 0 3.293 1.479 3.293 3.295 0 1.813-1.485 3.29-3.301 3.29C1.47 24 0 22.526 0 20.71s1.475-3.294 3.291-3.295zM15.909 24h-4.665c0-6.169-5.075-11.245-11.244-11.245V8.09c8.727 0 15.909 7.184 15.909 15.91z' }
];
window.CHANNELS = CHANNELS;
