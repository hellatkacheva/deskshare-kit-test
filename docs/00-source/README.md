# 00-source — inputs

Read-only. Only the `ingest-confluence` skill writes here (new snapshots, regenerated working sources). All other steps only read.

| File | What it is | Source | Version |
|---|---|---|---|
| `01-deskshare-requirements-gathering.md` | DeskShare requirements-gathering source: sales handoff, project context, minutes of Workshops 1–3 | Confluence 65670 | v5 |
| `02-workshop-brief.md` | Workshop brief: goal, practice project, stakeholder slide quotes, expected deliverables, ground rules, next milestone | Confluence 458755 (child of 65670) | v1 |
| `03-workshop-4-minutes.md` | Workshop 4 minutes: booking note (optional note per booking, 50 characters) — dated 2026-10-24 (SI-13) | Confluence 1146892 (child of 65670) | v1 |
<!-- rows added by ingest-confluence -->

## Source keys

Used in every reference as `[KEY · Section]`.

| Key | Meaning | Heading in the source |
|---|---|---|
| `PRE` | Preamble of the page (origin of the copy, scope note), before the first section | `# DeskShare — Requirements Gathering (source material)` |
| `HO` | Sales handoff from discovery (late August 2026) | `Handoff from Discovery` |
| `CTX` | Expanded project context: company, current state, why now, decision makers, definition of done | `Expanded Project Context` |
| `W1` | Workshop 1 — discovery handoff & kickoff, Mon Sep 8, 2026 | `Meeting Minutes — Workshop 1: Discovery Handoff & Kickoff` |
| `W2` | Workshop 2 — requirements deep-dive, Wed Sep 10, 2026 | `Meeting Minutes — Workshop 2: Requirements Deep-Dive` |
| `W3` | Workshop 3 — requirements refinement (new conflicts surfaced), Thu Sep 11, 2026 | `Meeting Minutes — Workshop 3: Requirements Refinement (new conflicts surfaced)` |
| `BR` | Workshop brief (child page 458755): BA AI Workshop 17–18 Sep 2026 — goal, practice project, stakeholder quotes from the slides, expected deliverables, ground rules, next milestone (28 Oct 2026). One key for the whole page; the section is the H2 heading, e.g. `[BR · Stakeholders (as quoted on the slides)]` | `# BA AI Workshop — brief (source material)` (file `02-workshop-brief.md`) |
| `W4` | Workshop 4 minutes (child page 1146892): booking note, dated 2026-10-24. **One key for the whole page; the page has no headings** — every reference uses the title paragraph as section: `[W4 · Workshop 4 — Booking note]` (BA, CHG-004; K-25) | first paragraph "Workshop 4 — Booking note" (file `03-workshop-4-minutes.md`) |
<!-- rows added by ingest-confluence -->

## Snapshots

`confluence/<pageId>/v<N>/` — the page exactly as fetched (`page.html`, `page.md`, `meta.json`). Never edited; a new version gets a new folder. Child pages get their own folder by page id; the parent's `meta.json` lists child ids and versions (BA decision 2026-10-21).

| Snapshot | Fetched | Children |
|---|---|---|
| `confluence/65670/v2/` | 2026-10-20 | 458755 v1 (listed in `meta.json` 2026-10-21; child created after the parent snapshot) |
| `confluence/458755/v1/` | 2026-10-21 | — (child page of 65670) |
| `confluence/65670/v3/` | 2026-10-23 | 458755 v1 — CHG-001: C0 only (emphasis on "no approval step"); working source `01-…md` stays on v2 text, identical in words |
| `confluence/65670/v4/` | 2026-10-23 | 458755 v1 — CHG-002: C2 D1 Floor 1 capacity 30 → 35; working source `01-…md` regenerated from v4 (also picks up the v3 emphasis on "no approval step") |
| `confluence/65670/v5/` | 2026-10-23 | 458755 v1 — CHG-003: C4 D1 W2 · Capacity limits "no waitlist in this PoC" → "a waitlist is in scope for this phase, PoC" (BA: deliberate test edit, scenario B4; DEC-035 keeps no waitlist; SI-12); working source `01-…md` regenerated from v5. `page.md` = MCP markdown body; `page.html` saved as fetched (re-fetched and confirmed byte-identical, K-24). Note: `v4/page.html` was assembled from v3 + one replacement, not saved as fetched (K-24, `v4/meta.json` provenance) |
| `confluence/1146892/v1/` | 2026-10-23 | — (child page of 65670, new in CHG-004: C6 + C3, optional booking note; BA: test page, scenario B6, handled as real). `page.md` / `page.html` saved as fetched from the MCP bodies (K-24) |
| `confluence/65670/v7/` | 2026-10-25 | 458755 v1, 1146892 v1 — CHG-005: C0 only (W1 Attendees — "Priya Nandakumar", "Sam Okafor" bold). v6 never snapshotted (watch issue #1 reported v5 → v6; K-29); MCP returned no version block (createdAt / message null). Working source `01-…md` stays on v5 text, identical in words |

## Known missing inputs

| Item | Referenced in | Status |
|---|---|---|
| `DeskShare_Sales_Discovery_Handoff_MOMs.docx` — account exec's full handoff notes | `[HO · Handoff from Discovery]` | **GAP-001 — referenced attachment not provided.** Not a blocker. BA (Olga Tkacheva, 2026-10-20): the file will not be supplied; its content is this page. `analyze-conflicts` carries it into the analysis log under the same ID. |
| Last month's booking spreadsheet (Priya's reference for booking volume and floor capacities) | `[W1 · Action items]`, `[W2 · Booking a desk]` | Not provided. Only the figures quoted in the minutes are available. |
| Sample booking data showing ~1 in 5 no-shows | `[W3 · No-show / ghost bookings]` | Not provided. Only the figure quoted in the minutes is available. |
| Attachments of pages 65670 and 458755 | — | Cannot be listed through MCP. Check the page in Confluence; put any files into `inbox/`. |
| `originals/BA_AI_Workshop_Sep_2026.pdf`, `originals/BA_AI_Workshop_Sep_2026_Recap.pdf` — slides the brief was summarised from | `[BR · BA AI Workshop — brief (source material)]` preamble | Not provided. The brief says it is "Summarised by Claude" — only the summary is available, not the slides. |
