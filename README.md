# BinGo — integrated team build

Combined on 18 October 2026 from the UI/UX project, pickup-booking teammate handoff and map teammate ZIP. This is a separate project folder; the original projects were not overwritten.

## Run in PowerShell

Open a terminal **inside this extracted folder**, then run:

```powershell
npm.cmd ci
npm.cmd run dev
```

Open the Local URL printed by Vite. If another copy is running, Vite may choose the next available port. Use a Node version supported by Vite 8 (Node 22.12+ recommended).

For the embedded map, create `.env.local` from `.env.example` and set your restricted Google Maps browser API key. Without it, the point directory and Google Maps directions links still work.

```powershell
npm.cmd run lint
npm.cmd test
npm.cmd run build
```

## What is integrated

- Shared collection-point IDs, names, coordinates, addresses and filters between map pins, the directory and station selection.
- Map errors, missing key and quota failures keep the directory usable. Location errors do not fabricate a user location. Fleet pins require published coordinates.
- Real Firebase email/password registration and login, Google sign-in, password-reset requests and authenticated profile loading. Remember-me stores no plaintext password. Admin access requires a Firebase custom claim.
- Owner-scoped report, recycling and pickup history. Stable booking IDs and retries distinguish recycling saved from booking confirmed.
- Admin report, schedule, notice and reward edits wait for Firestore. Review tab supports recycling approval and pickup status transitions. Collector assignment needs a registered collector document.
- Reward details support description, validity, delivery, stores, spend restrictions, usage instructions and terms entered by an administrator.
- Mobile loading sequence, green login orbit, GSAP counters/capacity meters, scoped scroll entrances and MorphIcon filters. Reduced motion and offscreen/background animation handling are retained.
- Clickable steps preserve progress while revisiting unchanged answers; changing inputs invalidates later steps. Pending saves lock step navigation.

## Remaining service setup

**This ZIP does not prove or change the live Firebase rules.** The pickup permission-denied problem needs comparison and deployment to the named database, followed by a live two-account test. See [Firebase handoff](docs/firebase-handoff.md).

No security teammate source was supplied. Collector/facility sign-in pages and their role-specific access still require that teammate's implementation and review. Admin access is no longer granted by matching a hardcoded password.

Image analysis remains an explicitly labelled simulation. Images are prepared locally; only the `photoAttached` flag and recycling metadata are persisted by this handoff. Firebase Storage upload, image retention/access rules and a real image-analysis service are not implemented here.

Reward redemption remains disabled until a secure `redeemReward` callable is deployed and tested. This package does not contain that backend. Do not enable the flag just to hide the unavailable state. Feedback and reminders still have browser-local behaviour, rather than shared backend delivery. Collection-point capacities are supplied directory snapshots, not connected bin sensors.

See [integration notes](docs/team-integration.md) and [validation](docs/integration-validation.md). Older design notes in this folder describe earlier UI iterations; these integration notes take precedence for current behaviour.
