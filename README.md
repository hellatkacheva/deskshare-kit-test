# deskshare-kit-test

DeskShare (kit test A) — a desk-booking proof of concept built with the BA workflow kit. Profile `static`: plain HTML/CSS/JS, bookings stored only in the browser (`localStorage`), no backend. Spec: `docs/04-spec/`.

## Links

| | |
|---|---|
| **Demo (GitHub Pages)** | https://hellatkacheva.github.io/deskshare-kit-test/ |
| **Spec** | `docs/04-spec/` |
| **Build and deploy status** | `docs/04-spec/build-status.md` |

## Reset demo data

The app loads fictional demo bookings (seed) the first time it is opened in a browser. To start again from fresh demo data:

| Build | How |
|---|---|
| Local / test (`localhost`, `127.0.0.1`) | open the app with `?reset-demo`, e.g. `http://127.0.0.1:4173/?reset-demo` |
| Deployed (public URL) | `?reset-demo` is ignored. **Clear the site data** of the app in the browser, then open the app again |

Clear site data:

- **Chrome / Edge desktop:** site-info icon left of the address → *Site settings* → *Delete data* (or DevTools → Application → Storage → *Clear site data*).
- **Chrome Android:** ⋮ → *Settings* → *Site settings* → *All sites* → the app's host → *Delete data*.
- **Safari iOS:** *Settings* → *Apps* → *Safari* (iOS 17: *Settings* → *Safari*) → *Advanced* → *Website Data* → swipe left on the app's host → *Delete*.

**Warning:** on GitHub Pages the host `hellatkacheva.github.io` is shared with other Pages sites of the account (e.g. kit test C, GearLoan). Clearing site data wipes their demo data in this browser too — open each app once afterwards to reload its seed.

The same steps fix the message "Saved bookings could not be read in this browser. Clear site data to reload demo data."

Demo-day checklist: `docs/04-spec/demo-data.md` §9 (reset on the demo device between 08:00 and 09:30 office time, UTC+5).
