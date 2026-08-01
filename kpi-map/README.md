# Profit Cause Map — v1.0

An interactive cause-and-effect map of an e-commerce brand's KPIs
(Shopify subscriptions + Meta ads on one side, TikTok Shop + creators on the
other), built to decide **what a management/monitoring app should track**
before building it.

Every card is a metric with a **data source tag** (Xero / Shopify API /
TikTok Shop API / Meta API / Derived / Manual). Every arrow is a causal link:
green **+** pushes the target the same direction, red dashed **−** the
opposite way. Amber **★ health check** cards are ratios with rules — the
"expectation" metrics that catch things like *"59 videos, up 9%"* being a
failure because retainer spend doubled.

## Run it

Double-click `index.html`. That's it — no install, no server, no internet.
Works in Chrome / Edge / Safari / Firefox.

- Drag cards to move, drag the background to pan, scroll to zoom
- Double-click empty space (or **+ Node**) to add a metric
- **⤳ Link mode**: click a source card, then a target card
- Click any card or arrow to edit it in the right-hand panel; `Del` removes it
- Everything autosaves in your browser. **Export** downloads the map as JSON
  (share it back and forth); **Import** loads one; **Reset example** restores
  the built-in 42-metric map

## Files

| File | What it is |
|---|---|
| `index.html` | Markup + all styles |
| `app.js` | All logic. The example map lives in `defaultGraph()` — data model is documented in the header comment |

## Hand it to your AI assistant

The code is written to be picked up cold. Paste something like this as one
prompt, with both files in the project folder:

> Read `index.html` and `app.js` in this folder — a self-contained,
> dependency-free KPI cause-map tool (plain JS + SVG, no build step; the
> data model and default map are documented at the top of `app.js`).
> Open it in a browser so I can see it, then help me extend it.
> Keep it dependency-free and keep the two-file structure.

Then ask for whatever you want next, e.g.:

- "Add a `value` field to nodes and show this month's number on each card"
- "Add a new workspace for wholesale/retail"
- "Connect the health-check cards to live data from Xero / Shopify and
  turn them red/green against their benchmark rules"
- "Turn the health checks into a summary alert panel"

Your map edits live in the browser's localStorage (`kpi-map-v1`), so code
changes won't wipe them — but **Export** a JSON backup before big changes,
and note the default in `defaultGraph()` only shows after **Reset example**.
