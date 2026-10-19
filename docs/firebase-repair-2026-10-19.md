# Firebase repair and UI integration — 19 October 2026

## Confirmed root causes
- The live named database's pickupBookings rules checked userId; the integrated client writes/queries ownerUid. The old get rule also denied a transaction's read of a not-yet-created booking.
- Firebase Authentication only had Google enabled. Email/Password was disabled.
- The integrated resident feedback action did not save data; the admin page read localStorage.

## Live changes already applied
Project: shining-display-s6tvw
Database: ai-studio-bingosmartwastem-8bd3b03c-9b90-40c5-9a6b-f0a36a775d69
Email/Password enabled, confirmed in Console.
Replaced only pickupBookings rules and added feedback permissions from Xiangwei's supplied rules, with the required helper functions. Booking IDs equal recyclingSubmissionId, ownership uses ownerUid, initial status Requested, and the linked recycling session must belong to the same user with collector_pickup.
The existing live admin helper was extended to accept admin:true claims and now requires verified email for its legacy email allowlist. Its existing admins-document authorization remains.
Other live collections were left unchanged; many still allow public read/write. THIS IS NOT A PRODUCTION SECURITY SIGN-OFF. Jiayee must complete and test security for those collections and any legacy admin metadata before public release.

## Local files
The source retains all latest UI: filters, separate sorting-rule/details actions, reminder dialog, pale loading animation, and close BinGo spacing.
Feedback now writes rating/text/owner/name/server timestamp to Firestore, shows real success/error, prevents duplicate clicks, and keeps drafts after a failed request. Admin Feedback subscribes to Firestore with loading/error states and no browser-storage fallback.
Registration distinguishes disabled provider, existing account, and an account created before profile setup fails.
Canonical firestore.rules is Xiangwei's complete supplied rules (claim-based admins), which is stricter than the transitional live rules. firebase.json explicitly targets the named database. Do not deploy the complete canonical rules until Jiayee compares all schemas and provisions the admin claim; deploying it is a separate security migration.

## Admin access
This UI uses the Firebase ID token admin:true claim for admin routing. A matching email/password alone does not make an administrator. A trusted project owner must set that claim using the Firebase Admin SDK (preserve any existing claims), and the account must then sign out and sign in again. Never set a role in browser localStorage to grant access.
The legacy live allowlist/admins-document fallback is temporary and is not used to unlock the UI. Prefer claim-only authorization after migration.

## Verification
- TypeScript lint and production build passed.
- Existing 25 pickup transaction/query checks passed with mocked Firestore.
- Greeting/capacity/map checks passed.
- New feedback tests cover authentication, validation, owner UID, server timestamp, sorting, error propagation, unsubscribe (mocked Firestore).
- Firebase Console: authenticated get for missing pickup booking ALLOWED; anonymous get DENIED. Simulations do not create real bookings.
- Live integrated app: existing Google sign-in succeeds; resident Disposed Items loads without booking permission-denied (empty account).
- Not yet verified: Jiayee's actual new account registration, Xiangwei's actual booking creation, resident-to-authorized-admin feedback end-to-end. Retest using the respective users. No teammate credentials or real booking requests were created for testing.

## Run
Open the folder containing package.json:
    npm.cmd ci
    npm.cmd run dev

Send this complete integrated source to both teammates; merge their later branch work carefully, especially App.tsx, LoginFlow.tsx, AdminPanel.tsx, firebase.ts and firestore.rules.
