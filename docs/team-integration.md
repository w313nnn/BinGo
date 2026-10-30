# Team integration notes

## Inputs

- UI/UX: `BinGo-main`, latest local UI branch copy.
- Core/data: the three files in `pickupbooking.zip` plus the earlier idempotency/diagnostic patch.
- Map/address: `bingo.zip`, including GoogleMapView, SimeDarbyAddressPicker and the collection-point data.
- Security teammate: no source handoff available. No assumption was made that her branch was finished.

The core ZIP expected newer data types, login behaviour and admin props that were not included. These interfaces were reconciled in this build. The older map ZIP's App, login, admin and permissive rules did not replace newer UI/core behaviour.

## Main changes

`App.tsx`, `appData.tsx`, `firebase.ts`, `firestore.rules` and `pickupBookingSupport.ts` share stable IDs, owner-based queries, pending/approved points and retry state. Failed booking writes are not shown as confirmed. Existing browser-only records are distinguished from saved Firestore records.

The map and card list previously assigned different IDs to the same named stations. They now derive from one collection-point dataset, including Nilai Impian. General includes Organic points consistently. Static distance estimates and fabricated live truck coordinates were removed from the integrated directory. Coordinate/location accuracy still needs domain verification; supplied snapshots are not sensor feeds.

Admin writes use saved Firestore document IDs, wait for acknowledgement and expose failures. A new Review tab uses the core handoff's pickup/recycling APIs. Reward details are editable metadata; unspecified terms remain unspecified. Editing a reward does not overwrite its current redemption count.

Login uses Firebase Auth rather than local plaintext credentials or a demo admin bypass. SMS login is not configured. No password is embedded in this package. Profiles load per authenticated UID; Google login does not write an invented phone/address over a saved profile.

## Motion approach

The requested GSAP core, React, utilities, plugins, timeline, performance and ScrollTrigger guidance informed the implementation. The frameworks skill's lifecycle/scoping guidance applies; this codebase is React, so Vue/Svelte lifecycle hooks were not added.

- `Startup.tsx`: short overlapping GSAP timeline, skipped under reduced motion.
- `Orb.tsx`: scoped green edge/orbit, `quickTo` pointer movement and utilities for safe input ranges; listeners/tweens cleaned up.
- `CapacityIndicator.tsx`, `AdminLiveData.tsx`: numeric interpolation and transform-based fills, with exact accessible values, reduced-motion handling and offscreen/background pause.
- `usePageMotion.ts`: limited ScrollTrigger batch entrances inside the app's own scroll panel. Trigger/tween ownership is explicit and cleanup is local. No global trigger kill or scroll hijacking.
- Existing Specular/MorphIcon effects are retained. AnalysisMotion pauses repetitive updates while inactive and under reduced motion.

No paid plugins or unrelated framework packages were added. GSAP does not turn static data into a live backend feed.

## Handoff

Extract as a new folder and use that folder as the team's integration baseline. Run all checks before cherry-picking shared files into teammates' branches. Agree one owner for `firebase.ts`, `firestore.rules`, `App.tsx` and `appData.tsx` because all three areas touch them. Do not overwrite another teammate's later commits with this ZIP without comparing them.

The original UI project is unchanged; extracted teammate sources are retained in the workspace. No GitHub push, Firebase rules publication, account provisioning or live data mutation was performed for this integration.
