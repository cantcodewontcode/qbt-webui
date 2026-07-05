# IDEAS.md — Aspirational Enhancements for qbt-webui
*Written May 2026 — grounded in the design system, the current codebase, and genuine creative thinking*

---

## Framing thought

The design system describes this UI as "a calibrated instrument." Every Sony Walkman had a tape counter, a VU meter, a track indicator — it didn't just play music, it *told you things* while it played. The torrent list right now is mostly static: it tells you the current reading, not the story. The best enhancements here are the ones that make the instrument feel *alive*.

---

## 1. Global speed history sparklines (toolbar)

**What**: Every 3-second poll, accumulate the global `dl_info_speed` and `up_info_speed` from `server_state` into two small ring buffers (~40 readings, ~2 minutes of history). Render them as a pair of inline SVG sparklines in the toolbar, sitting to the left of the ↓/↑ speed readouts. Not a chart — a trace. Like the sweep of a VU meter needle.

**The design problem**: This needs a careful eye. The toolbar is 48px tall and already has the speed readouts, divider, log/settings buttons, and Add Torrent. Adding visual complexity here risks cluttering the one surface that must remain unambiguous. Options worth considering:

- **Behind the readout**: The sparkline renders as a very low-opacity trace *behind* the numeric value in its own button. The number floats above its own history.
- **Beside the readout**: A slim dedicated zone (e.g. 60×24px) between the left elements and the speed readouts — the two traces stacked vertically (↓ over ↑), hairline weight.
- **On hover only**: The sparklines only appear when you hover over the speed readout button, as a kind of expanded tooltip showing recent history. Clean at rest, informative on demand.

The hover approach is probably the most defensible aesthetically — the toolbar stays clean and the history is revealed only when sought.

**Design fit**: `--color-accent` at 45% opacity for download trace, `--color-success` at 45% for upload. 0.75px stroke. Axes and grid: none — the instrument speaks for itself. When either speed is consistently zero the trace is a flat baseline, which is itself informative.

**Technical**: Two `CircularBuffer` instances in `state.js`, filled on every `serverstate:changed` emit. Sparklines rendered as `<polyline>` inside an inline SVG. Zero API overhead — data is already arriving.

---

## 2. Session statistics

**What**: The `/sync/maindata` `server_state` already delivers `alltime_dl`, `alltime_ul`, `dl_info_data` (this session), `up_info_data` (this session). None of it is currently displayed beyond the live speed readouts. A small display — perhaps in the sidebar footer, below the filter tabs — showing:

```
↓ 142.3 GB  ↑ 89.1 GB   this session
↓ 4.7 TB   ↑ 12.1 TB   all time
```

**Design fit**: `--type-data-sm`, `--font-data`, `--color-text-disabled`. The same instrument-readout register as the toolbar speeds. Quiet and available, not prominent.

**Technical**: Data is already in every maindata poll. This is purely a display problem.

---

## 3. Ratio goal progress on seeding rows

**What**: For seeding torrents with a per-torrent ratio goal (`ratio_limit >= 0`), the ratio column already shows the number. Add a small secondary visual indicator showing progress toward the goal — e.g. if goal is 2.0 and current ratio is 1.4, a 70%-filled mark. When goal is met: shown in `--color-success`. When no goal is set: nothing shown.

**Note**: The data for this is already in every row object. The visual reinforcement is the enhancement — turning a number into a reading on a gauge.

---

## 4. Peer world map

**What**: In the inspector Peers tab, above or alongside the peer list: a minimal SVG world map with a dot per connected peer, positioned by country code. We already receive `country_code` on every peer object.

No external service — a compact public-domain SVG world outline with a lookup table mapping country codes to approximate centroid coordinates. Dots in `--color-accent` for peers we're uploading to, `--color-success` for peers sending to us. On hover, a tooltip shows the peer's IP and client name.

**Why**: The Peers tab is currently a dry table. The map transforms it into something that makes you feel the geographic reach of the swarm — which for a large public torrent is genuinely extraordinary. Very Sony: like watching the signal meter on a shortwave radio sweep across bands.

**Design fit**: Map SVG in `--color-border-subtle` (land) on `--color-bg-inset` (ocean/background). Dots 5px, `--radius-pill`. ~200px tall, sitting above the peer list, with a `1px solid var(--color-border-subtle)` bottom edge separating it from the table.

**Technical**: SVG world map path data from Natural Earth (public domain), simplified to ~10–15KB. Country centroid coordinates as a ~250-entry JSON lookup. Pure SVG rendering — no canvas, no library.

---

## What to build first

1. **Session statistics** — lowest effort, data already arrives every poll, immediately useful.
2. **Global sparklines** — requires the design eye question to be resolved, then straightforward.
3. **Peer world map** — the most delightful, medium effort, makes the Peers tab worth opening.
4. **Ratio goal indicator** — low effort, complements the existing ratio column.

---

*This document is a thinking space, not a commitment. Items should be promoted to WORKLOG.md and AGENT_*.md files as they're prioritized.*
