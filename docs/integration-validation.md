# Integration validation — 18 October 2026

## Passed

- `npm.cmd run lint`: TypeScript no-emit check, exit 0.
- `npm.cmd test`: 25 pickup checks using the actual transaction/query functions with a mocked Firestore boundary; 8 greeting-time boundaries; 7 capacity edge cases; shared map/list IDs, addresses, coordinates and General/E-Waste filter consistency.
- `npm.cmd run build`: production build, exit 0. Admin and map screens are separate lazy chunks. Vite still reports a large App chunk (about 1.09 MB minified / 318 KB gzip); no 60fps benchmark or exhaustive performance audit is claimed.
- Browser: actual startup/sign-in screen rendered. Isolated resident/admin previews used fixture data and disabled cloud writes. They are not Firebase integration tests and are excluded from the deliverable.
- Mobile layout checked at 390×844 and 320×740. On the narrow map page, document/body scroll width matched the 320-pixel viewport. The desktop shell also rendered.
- General filter selected the Organic/General collection point; directory and map data now share IDs.
- Camera wizard: reached step 3, selected step 1, returned directly to step 3 without editing; returned to step 1 and removed the photo; steps 2 and 3 became disabled.
- Reward list opened the selected reward's detail page, with heading focus, provider fields and an unavailable redemption CTA.
- Admin Review tab loaded pickup/recycling fixtures. A simulated failed approval showed an error and left the booking Requested. The recycling review form displayed weight and approved-point input correctly.
- A scroll cleanup recursion found during development was fixed; navigation was rechecked after the fix. Temporary preview configuration and test-only auth overrides are not shipped.
- Original `BinGo-main` Git worktree remained unchanged.

## Not verified against live services

No rules deployment, custom-claim provisioning, live pickup creation, cross-account Firebase security test, merchant redemption, live GPS, real image analysis or Firebase Storage upload was performed. The named database's published rules may still deny the existing teammate app. See `firebase-handoff.md` before claiming the live pickup issue is resolved.

There is no Firestore Emulator test suite in this package. Mocked transaction checks do not validate Firestore Security Rules syntax/semantics or deployment state. Test the candidate rules with the team's emulator setup and the live checklist before publication.

`BinGo-integrated-preview.png` outside the project folder is a visual preview using isolated fixture data, not live municipality statistics.
