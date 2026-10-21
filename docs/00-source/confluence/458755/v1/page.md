# BA AI Workshop — brief (source material)

> **Source:** `originals/BA_AI_Workshop_Sep_2026.pdf` and `originals/BA_AI_Workshop_Sep_2026_Recap.pdf` (workshop 17–18 Sep 2026). Summarised by Claude, 14 Oct 2026. Read-only.

## Goal

Practice the full BA-to-PoC arc of an agentic SDLC — turn a messy requirements handoff into a working, deployed proof of concept, using an AI assistant deliberately at every step. Our team uses **Claude Code** as the AI platform.

## Practice project: DeskShare for Northwind Analytics

- Fictional \~120-person hybrid company — 3 anchor office days/week, no assigned desks.
- **Problem:** desk booking runs on a shared spreadsheet — double-bookings, no visibility into which floor is full.
- **Why now:** a new hybrid-work policy made desk availability something people rely on daily.
- **Done =** a working PoC that lets an employee book a desk by date and floor, see remaining capacity, and cancel a booking — good enough for the sponsor to demo to her leadership.

## Stakeholders (as quoted on the slides)

| Person | Role | Quote |
| --- | --- | --- |
| Priya Nandakumar | Office Manager · Sponsor | "I want one screen that tells me if tomorrow's a problem." |
| Sam Okafor | Software Engineer | "If this needs me babysitting a backend, it's not a PoC." |
| Dana Whitfield | HR Business Partner | "This can't turn into an attendance-tracking tool by accident." |

## Expected deliverables

1. **Requirements → dev-ready backlog** (Jira) — structured and analysed with an agentic flow; a developer could pick it up and build from it.
2. **Backlog → deployed PoC** — designed, built and tested with AI assistance, deployed to **Cloudflare**. A PoC, not production.

## Ground rules

1. **Design your own agentic workflow** — propose and justify it.
2. **Keep a human in the loop on conflicts** — AI drafts options; the scope call on a real trade-off belongs to the BA.
3. **This is a PoC, not production** — decide scope deliberately, don't gold-plate.

## Takeaways from the recap

- AI transformation across EPAM and industry.
- Improve expertise within the BA discipline — core team first.
- FDE (forward-deployed engineer) mindset.

## Next milestone

**28 October 2026** — present results: the workflow, the backlog and a PoC demo.
