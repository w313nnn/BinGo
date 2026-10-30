# Firebase handoff — deployment and live verification pending

Project: `shining-display-s6tvw`

Database: `ai-studio-bingosmartwastem-8bd3b03c-9b90-40c5-9a6b-f0a36a775d69`

The frontend explicitly uses this named database. `firebase.pickup-booking.json` targets the same database. The provided rules are a candidate full ruleset, not evidence of what is currently published.

## Before publishing

1. Export/copy the published rules for this exact named database as a rollback copy.
2. Compare the full local rules with the published rules, including `users`, `reports`, `recycleSessions`, `pickupBookings`, `collectors`, `rewards`, `redemptions` and public configuration collections. Preserve any additional application collections after reviewing their permissions.
3. Confirm the admin account exists in Firebase Authentication and has custom claim `admin: true`, set by a trusted Admin SDK environment. Email matching and client-side local storage do not grant this claim. Sign out and back in after changing claims.
4. Confirm existing documents use the fields expected by this build: `authorUid` on reports; `ownerUid` on recycling/booking/redemption documents. Existing records with missing/different ownership fields need a trusted migration; do not make all records readable as a workaround.

After the project owner reviews the complete ruleset, deployment from the extracted folder can use:

```powershell
firebase deploy --only firestore:rules --project shining-display-s6tvw --config firebase.pickup-booking.json
```

This command was **not run** during integration. Use your existing authenticated Firebase CLI. Reopen the named database's Rules tab after deployment and confirm publication there.

## Booking contract

`recycleSessions/{submissionId}` must be committed first, owned by the authenticated UID, with `collectionMethod: 'collector_pickup'`. The booking uses exactly `pickupBookings/{submissionId}` and `recyclingSubmissionId == submissionId`.

A transaction reads the booking before writing. The rules allow an authenticated read of a missing document for the idempotency check, owner/admin access to an existing document, owner-scoped history queries and creation only when the linked recycling session is valid. Dates and times use `YYYY-MM-DD` and `HH:mm`.

Admin transitions: Requested → Approved/Rejected; Approved → Assigned (registered `collectors/{uid}` required); Assigned → Collected. A client-side review button never overrides Firestore rules.

## Required live checks

- Resident A creates one valid collector pickup; both documents appear with the same ID.
- A retries the identical request; no second booking is created.
- Reload A's Activity page; its booking and recycling record load.
- Resident B cannot read A's booking/session and sees only B's own queried history.
- An unauthenticated user cannot create a booking.
- Admin can review pending recycling and advance bookings. A resident cannot approve points or change booking status.
- Verify approved points appear after reload; verify rejected/pending records do not increase approved points.

If denied, record the error code, operation (`get`, `list`, or `create`), project/database, authenticated UID locally and relevant document fields. Share redacted diagnostics. A missing-read failure means the transaction never reached creation; distinguish that from a create-rule failure.

## Other backend work

The client expects a secure callable named `redeemReward` in the configured functions region. It must verify auth, read approved points and prior spending, validate stock and eligibility, issue a provider-backed voucher and update spending/stock atomically with idempotent request IDs. Its implementation is outside the supplied files. `VITE_REDEMPTION_SERVICE_ENABLED` defaults to false.

Collector/facility roles, device-independent feedback/reminders, Storage images, real AI identification, geospatial validation and live capacity telemetry remain separate backend work. Do not broaden rules to `allow read, write: if true`.
