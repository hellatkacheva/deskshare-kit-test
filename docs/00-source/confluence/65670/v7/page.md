# DeskShare — Requirements Gathering (source material)

> **Source:** Confluence page "DeskShare - Northwind Analytics", exported 14 Oct 2026.  
> **Scope of this file:** only the raw inputs — sales handoff, project context and the minutes of Workshops 1–3. Text is verbatim; only line breaks and list formatting were changed. Sections produced by another team (resolution log, conflict table, risk log, backlog, mockups) were deliberately excluded.  
> **Read-only.** Do not edit — workflow steps write their output to `docs/01-…` and later folders.

---

## Handoff from Discovery

Sales ran two discovery calls with Northwind Analytics in late August, scoped the opportunity at a high level, and closed a fixed-scope engagement. Discovery did not dig into detailed requirements — that starts now, with this team's formal requirements-gathering phase.

The full, unedited handoff notes are the account exec's own notes (not cleaned up for a BA audience) — `DeskShare_Sales_Discovery_Handoff_MOMs.docx`; expect gaps and a couple of things worth double-checking rather than taking at face value. *(Note from our team: this file is not yet available to us — see *`README.md`* in this folder.)*

**Sales handoff notes (verbatim from the account exec):**

> "Client is a \~120-person hybrid company, current process is a shared spreadsheet that keeps double-booking desks. Sponsor is the Office Manager. IT is thin — no time for a real dev project, which is why they're open to a lightweight PoC. They want to see something clickable, not a slide deck."

---

## Expanded Project Context

**Company:** Northwind Analytics, \~120 employees, hybrid work policy (3 anchor office days/week, no fixed seating).

**Current state:** Desk booking runs through a shared Google Sheet maintained by the Office Manager. It breaks down weekly — people book the same desk twice, forget to release a booking when plans change, and there's no visibility into which floor is actually full until someone shows up and can't find a seat.

**Why now:** The company just signed a new hybrid-work policy that assumes desk availability is self-service. The spreadsheet was a stopgap; it's now actively causing complaints serious enough that the Office Manager escalated to their leadership, who approved fixing it.

**Decision makers:** Priya Nandakumar (Office Manager) is the sponsor and day-to-day decision-maker. Dana Whitfield (HR Business Partner) has a seat at the table because booking data touches employee attendance patterns. Sam Okafor (Software Engineer) represents the small internal IT function and has veto power on anything that creates ongoing maintenance burden for them.

**What "done" looks like for this engagement:** a working PoC that lets an employee book a desk by date and floor, see remaining capacity, and cancel a booking — good enough for Priya to demo to her leadership as proof the idea works.

---

## Meeting Minutes — Workshop 1: Discovery Handoff & Kickoff

**Date:** Mon, Sep 8, 2026, 10:00–10:45  
**Attendees:** **Priya Nandakumar** (Office Manager, sponsor), **Sam Okafor** (Software Engineer), Dana Whitfield (HR Business Partner), BA (facilitator)

**Agenda:** Review sales handoff notes; confirm scope boundaries; agree on who needs to be in the requirements deep-dive.

**Discussion:**

- BA read back the sales handoff notes; Priya confirmed them as accurate but added: "The spreadsheet chaos isn't the whole story — people have also started just claiming a desk in person and ignoring the sheet entirely, so half our 'bookings' aren't even in it anymore."
- Sam flagged early that he does not want to own a database or server: "If this needs me babysitting a backend, it's not a PoC, it's a project. I don't have headcount for that."
- Dana raised a boundary up front: "Whatever this shows, it can't turn into an attendance-tracking tool by accident. I don't want a report that tells someone's manager they only came in twice this month."

**Decisions:**

- Scope stays a browser-only PoC; no shared backend/database for this phase (confirmed with Sam).
- No manager-facing reporting or attendance analytics in this PoC (confirmed with Dana) — noted as explicitly out of scope, not just deferred.
- Priya is the single point of sign-off for what ships.

**Action items:**

- BA to schedule Workshop 2 (requirements deep-dive) before end of week — Owner: BA, Due: Sep 9.
- Priya to pull last month's spreadsheet as a reference for real booking volume — Owner: Priya, Due: Sep 9.

---

## Meeting Minutes — Workshop 2: Requirements Deep-Dive

**Date:** Wed, Sep 10, 2026, 14:00–15:00  
**Attendees:** Priya Nandakumar, Sam Okafor, Dana Whitfield, BA (facilitator)

**Agenda:** Walk through the booking flow end to end; capture rules, edge cases, and anything explicitly out of scope.

**Discussion by topic:**

**Booking a desk**

- Priya: employees should pick a date and a floor, and see a desk immediately — *no approval step*. "If someone has to wait for me to approve it, I'm right back to being the bottleneck."
- Two floors only for the PoC: Floor 1 (capacity 35) and Floor 2 (capacity 25) — pulled from the spreadsheet reference Priya brought, sized up from her earlier ballpark now that real numbers were in front of her.

**Capacity limits**

- Sam pushed for a hard stop rather than a warning: once a floor hits capacity for a given day, the system should refuse the booking outright, not just flag it. "People ignore soft warnings. That's basically what the spreadsheet already does."
- Agreed: a waitlist is in scope for this phase, PoC — if a floor is full, the employee is told to pick another day or floor. Waitlisting was parked as a future-phase idea, not built now.

**Cancelling**

- Dana: employees must be able to cancel their own booking without going through Priya or IT. No mention of needing manager approval to cancel.

**Privacy**

- Dana repeated the boundary from Workshop 1: the tool can show how many desks are booked per floor, but should not surface anyone's individual attendance history in a way that could be pulled into a report. Booking records tied to a name for the purpose of the booking itself is fine; a list or export of "who came in which days" is not.

**Admin needs**

- Sam asked whether Priya needs to block a desk for maintenance (e.g., a broken chair). Priya said it's a real need but not urgent enough to hold up the PoC — logged as a backlog item for a later iteration, not blocking.

**Out of scope, explicitly confirmed:**

- No login/authentication (name is typed in at booking time — acceptable for a PoC, revisit for production).
- No integration with HR systems or the badge/access system.
- No mobile app — responsive browser use is enough for the demo.
- No admin desk-blocking feature (parked, see above).

**Decisions:**

- Scope at this point: book by date + floor, hard capacity limit per floor, self-service cancellation, no accounts, no reporting.
- Priya will demo the PoC to her leadership using this exact scope — nothing beyond it should be implied as "coming next" without her sign-off.

**Open questions / parking lot:**

- Should capacity limits differ by day of week (e.g., Mondays are busier)? Parked — worth asking again if this moves past PoC.
- Desk-level (not just floor-level) booking — Sam noted it's a bigger data-modeling problem and shouldn't be assumed for this phase.

**Action items:**

- BA to turn this into backlog items (Jira) ahead of the build lab — Owner: BA, Due: before Day 2 build session.
- Sam to confirm hosting approach is acceptable for IT — Owner: Sam, Due: Day 1 wrap.

---

## Meeting Minutes — Workshop 3: Requirements Refinement (new conflicts surfaced)

**Date:** Thu, Sep 11, 2026, 09:00–09:45  
**Attendees:** Priya Nandakumar, Sam Okafor, Dana Whitfield, BA (facilitator)

**Context:** Priya informally shared the Workshop 2 scope with a handful of employees before this session. Their feedback surfaced three new points that weren't on the table in Workshop 2.

**Discussion by topic:**

**"Show me where my team sat" (new ask from Sam, via employee feedback)**

- Sam: several employees asked if the tool could show which desk their teammates booked, not just how many desks are free — "the whole point of coming in is sitting near my team; capacity numbers don't tell me that."
- Dana pushed back immediately: "We already agreed no one gets a report of who's where. Showing live desks is showing who's where — I don't see the difference."
- Sam disagreed that it's the same thing: a live view of today's bookings isn't a historical attendance report, in his view. Dana wasn't convinced.
- Not resolved in this session. Parked as C1 — a conflict to bring back to Priya for a scope call, since it sits right on the boundary Dana drew in Workshop 1.

**No-show / ghost bookings (new ask from Priya)**

- Priya reported that in the sample data she pulled, roughly 1 in 5 bookings appear to be no-shows, which means the hard capacity cap from Workshop 2 may be turning away people for desks that end up empty. She asked whether the cap could allow a small overbook buffer.
- Sam objected: "We just agreed on a hard stop two days ago. If we make it soft now, that's the same complaint-generating behavior as the spreadsheet." He proposed an alternative instead: an automatic release if a booking isn't "confirmed" by some cutoff time.
- Resolved as C2: agreed to add a check-in/grace-period mechanic (a booking auto-releases if not confirmed by a cutoff time) instead of loosening the hard cap. This is new scope, not something already designed — needs its own acceptance criteria in the backlog.

**Identity trust for headcount (new ask from Dana)**

- Dana repeated her fire-drill use case from Workshop 1, but added a new concern after thinking it through: with a free-text name field, two different people could type "J. Smith," or someone could book under a coworker's name by mistake or on purpose. "If I'm using this list to know who's in the building during an emergency, it has to be trustworthy, not just present."
- Sam maintained his position from Workshop 1 that no login/auth is in scope for this PoC — "that's a real problem, but it's a production problem, not a PoC problem."
- Not resolved. Logged as C3 — a known gap between what the PoC demonstrates and what Dana would need before relying on it operationally.

**Decisions actually made this session:**

- C2 (no-show/ghost bookings) was resolved via the check-in/grace-period mechanic. C1 and C3 are explicitly open going into backlog creation.
- Priya asked that all three be written up clearly (not glossed over) so she can make a scope call on the two still open before development starts.

**Action items:**

- BA to document C1 and C3 as explicit open items, not silently pick a side — Owner: BA, Due: before backlog is finalized.
- BA to write the check-in/grace-period mechanic (C2) up as a real backlog item, since it's new scope — Owner: BA, Due: before backlog is finalized.
- BA to flag the identity-trust gap (C3) as a known limitation, not a build item — Owner: BA, Due: before backlog is finalized.
