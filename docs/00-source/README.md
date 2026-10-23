# 00-source — inputs

Read-only. Only the `ingest-confluence` skill writes here (new snapshots, regenerated working sources). All other steps only read.

| File | What it is | Source | Version |
|---|---|---|---|
| `01-deskshare-requirements-gathering.md` | DeskShare requirements-gathering source: sales handoff, project context, minutes of Workshops 1–3 | Confluence 65670 | v2 |
| `02-workshop-brief.md` | Workshop brief: goal, practice project, stakeholder slide quotes, expected deliverables, ground rules, next milestone | Confluence 458755 (child of 65670) | v1 |
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
<!-- rows added by ingest-confluence -->

## Snapshots

`confluence/<pageId>/v<N>/` — the page exactly as fetched (`page.html`, `page.md`, `meta.json`). Never edited; a new version gets a new folder. Child pages get their own folder by page id; the parent's `meta.json` lists child ids and versions (BA decision 2026-10-21).

| Snapshot | Fetched | Children |
|---|---|---|
| `confluence/65670/v2/` | 2026-10-20 | 458755 v1 (listed in `meta.json` 2026-10-21; child created after the parent snapshot) |
| `confluence/458755/v1/` | 2026-10-21 | — (child page of 65670) |
| `confluence/65670/v3/` | 2026-10-23 | 458755 v1 — CHG-001: C0 only (emphasis on "no approval step"); working source `01-…md` stays on v2 text, identical in words |

## Known missing inputs

| Item | Referenced in | Status |
|---|---|---|
| `DeskShare_Sales_Discovery_Handoff_MOMs.docx` — account exec's full handoff notes | `[HO · Handoff from Discovery]` | **GAP-001 — referenced attachment not provided.** Not a blocker. BA (Olga Tkacheva, 2026-10-20): the file will not be supplied; its content is this page. `analyze-conflicts` carries it into the analysis log under the same ID. |
| Last month's booking spreadsheet (Priya's reference for booking volume and floor capacities) | `[W1 · Action items]`, `[W2 · Booking a desk]` | Not provided. Only the figures quoted in the minutes are available. |
| Sample booking data showing ~1 in 5 no-shows | `[W3 · No-show / ghost bookings]` | Not provided. Only the figure quoted in the minutes is available. |
| Attachments of pages 65670 and 458755 | — | Cannot be listed through MCP. Check the page in Confluence; put any files into `inbox/`. |
| `originals/BA_AI_Workshop_Sep_2026.pdf`, `originals/BA_AI_Workshop_Sep_2026_Recap.pdf` — slides the brief was summarised from | `[BR · BA AI Workshop — brief (source material)]` preamble | Not provided. The brief says it is "Summarised by Claude" — only the summary is available, not the slides. |
