# 00-source — inputs

Read-only. Only the `ingest-confluence` skill writes here (new snapshots, regenerated working sources). All other steps only read.

| File | What it is | Source | Version |
|---|---|---|---|
| `01-deskshare-requirements-gathering.md` | DeskShare requirements-gathering source: sales handoff, project context, minutes of Workshops 1–3 | Confluence 65670 | v2 |
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
<!-- rows added by ingest-confluence -->

## Snapshots

`confluence/<pageId>/v<N>/` — the page exactly as fetched (`page.html`, `page.md`, `meta.json`, `children/`). Never edited; a new version gets a new folder.

| Snapshot | Fetched | Children |
|---|---|---|
| `confluence/65670/v2/` | 2026-10-20 | none |

## Known missing inputs

| Item | Referenced in | Status |
|---|---|---|
| `DeskShare_Sales_Discovery_Handoff_MOMs.docx` — account exec's full handoff notes | `[HO · Handoff from Discovery]` | **GAP-001 — referenced attachment not provided.** Not a blocker. BA (Olga Tkacheva, 2026-10-20): the file will not be supplied; its content is this page. `analyze-conflicts` carries it into the analysis log under the same ID. |
| Last month's booking spreadsheet (Priya's reference for booking volume and floor capacities) | `[W1 · Action items]`, `[W2 · Booking a desk]` | Not provided. Only the figures quoted in the minutes are available. |
| Sample booking data showing ~1 in 5 no-shows | `[W3 · No-show / ghost bookings]` | Not provided. Only the figure quoted in the minutes is available. |
| Attachments of page 65670 | — | Cannot be listed through MCP. Check the page in Confluence; put any files into `inbox/`. |
