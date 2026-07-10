# theright2read.org/evidence — self-hosted, embeddable proof surface

A tiny static chart/data-viz surface: the campaign's **evidence** distilled into
permalinked, embeddable units. (`data/` is the raw, unprocessed corpus; `evidence/`
is what we've processed and stand behind.) Every chart is a **permalink** you can drop
into a page, a Substack post, or a brief by `<iframe>`. No proprietary SaaS, no
trackers. Design follows the site v2 language via `../assets/tokens.css` (NO green —
the green in `styles.css` is a game-signal colour only).

Spec + decisions: `../notes/plans/charts-theright2read-org-sketch.md`.

## How it's served
Subtree of `theright2read`, published on **GitHub Pages** at
**`https://theright2read.org/evidence/`**. Routing is **hash-based**, so the app works
unchanged at any base path — the `/evidence/` subfolder today, or a real
`evidence.theright2read.org` subdomain later (that subdomain would need a **separate
Pages site / repo or CloudFront**, as `CommonerLLP/public-finance` does for
`data.commonerllp.org`; the code does not change).

## Routes
- `#/` — index of all charts (from `manifest.json`)
- `#/c/<slug>` — render `charts/<slug>.json`

Query params (work in the hash, e.g. `#/c/oscillation?embed=1&theme=dark`):
- `?embed=1` — strip app chrome (header/footer) for a clean iframe
- `?theme=dark|light` — force + lock the theme so an embed matches its host page

## Embed
```html
<iframe src="https://theright2read.org/evidence/#/c/oscillation?embed=1"
        loading="lazy" style="width:100%;height:640px;border:0"></iframe>
```
For Substack (which won't iframe arbitrary domains): open the chart, click
**Download PNG**, paste the image, and link "explore the interactive version →".

## Add a chart
1. Add `charts/<slug>.json`:
   ```json
   { "slug":"…", "renderer":"svg|canvas|echarts", "type":"…",
     "title":"…", "subtitle":"…", "source":"…", "caption":"…", "data":[…] }
   ```
2. Register it in `manifest.json` (slug + renderer + title).
3. Numbers come from `../memory/verified_facts.md` / the Zotero corpus — auditable,
   no live DB. Verify before shipping (repo rule).

## Two renderers, keyed off `renderer`
- **`svg` / `canvas`** (`render-svg.js`) — the signature hand-made pamphlet charts,
  zero dependencies. `type` selects the draw function (`oscillation`, `substitution`,
  `cess`, `silence`). The design *is* the argument here.
- **`echarts`** (`render-echarts.js`) — for maps and dense standard charts. ECharts
  (Apache-2.0) is **vendored** at `vendor/echarts.min.js` and **lazy-loaded** only when
  an echarts chart is opened, so the SVG charts stay dependency-free. The chart JSON
  carries an ECharts `option`; `echarts-theme.js` maps `tokens.css` → an ECharts theme
  (palette/fonts/dark-mode) so echarts charts inherit the campaign look.
  - Re-vendor/upgrade: `curl -sSL -o vendor/echarts.min.js https://cdn.jsdelivr.net/npm/echarts@5.5.1/dist/echarts.min.js`

## Current charts (WP-008 milestone)
`oscillation` · `substitution` · `cess` · `silence` — all from RTR-WP-008, seeded from
the `wp-008-blog.html` renderers.

## Verify (repo standard harness)
Serve the repo and screenshot with Playwright + Brave at 360/393/412/1366, light+dark:
```bash
python3 -m http.server 8791 --bind 127.0.0.1   # then open /evidence/
```
Floor: nothing may break at 360px wide; check `scrollWidth == clientWidth`.
