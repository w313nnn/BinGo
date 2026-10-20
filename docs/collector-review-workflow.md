# Collector evidence and Green Points review

Prepared 20 October 2026. Not activated in live Firebase yet.

## Flow

Residents request a pickup. Admin Review has Pickups / Recycling review, status counts, horizontal filters and name/item/address/reference search. Admin approves and assigns an active collector UID. The collector signs in through Staff Login, sees only assigned jobs, checks the resident/address/date/item/weight/condition, confirms the details, takes or uploads a photo, adds notes and submits. The photo is compressed to JPEG <=450,000 characters and stored in a private Firestore evidence document (no new Storage/billing dependency). Evidence creation and booking Collected status commit atomically. A collector cannot change points or recycling verification.

The admin opens Recycling review, inspects the evidence and confirms that it has been reviewed, enters approved recycling points, and approves or rejects. Pickup approvals require a Collected booking and matching collector evidence. Final approval and a persistent resident notification commit in one transaction. Repeated approvals are rejected; completed report approval uses one deterministic notification per report and awards the existing 8-point amount once. Self-drop-off submissions may be verified directly by an admin. Notifications appear in the resident notification panel. Sample system notifications are limited to demo mode.

Timing assumption: 1–3 working days is the human review estimate, not a forced delay after approval. Points become approved immediately when the admin accepts the submission. No time-based automatic approval is implemented. If a post-approval business-day hold is required, scheduled backend processing and a Malaysia holiday policy must be defined.

## Activation

1. Review the narrow proposed live rules at outputs/collector-workflow-proposed.rules (outside this project folder). A rollback copy is outputs/collector-workflow-live-before.rules. It retains unrelated current deployed collections and the current admin helper, while replacing reports, recycleSessions and pickupBookings permissions and adding collector/evidence/notification permissions. The project firestore.rules remains the stricter canonical full policy.
2. Publish only after user confirms the new collector access: active collectors may read their assigned booking/item details and submit their evidence; only admins may review points or manage collector-role records. No collector role or account has been created automatically.
3. All teammates running staff review must use this build: older review code cannot commit the required paired notifications. Existing verified records remain visible but cannot be awarded again. Existing legacy Collected pickups without evidence require manual investigation; no fabricated evidence is created.
4. Create a real collector Firebase Authentication account (the human enters its password), then use admin More > Collectors with that account UID/name. Registering a UID does not create an Authentication user. Assign it to an approved pickup and test with a consenting test resident through the full workflow.
5. Confirm collector evidence, admin review, resident points and resident notifications across separate signed-in sessions before rollout. Reward redemption still uses the existing secure redemption-service flag/callable; this patch does not enable an undeployed redemption backend or fabricate vouchers.

## Checks

TypeScript, existing tests, new mocked Firestore transaction tests, and build pass. Tests cover assignment/ownership, invalid evidence, no collector credits, atomic rollback, missing evidence, duplicate approval/report award and notification ownership. Rules draft compiles in Firebase Rules Playground (self collector-role get allowed); live publication and end-to-end collector verification remain pending. Browser preview of localhost is unavailable in this session.

## Separate staff accounts (confirmed by user)

Administrator remains admin123@bingo.com; proposed tslc-admin replacement is not being used. Separate collector email is collector123@bingo.com. Staff Login now provides Administrator / Collector tabs in the existing visual style before sign-in. The selection is checked against server-resolved roles and never assigns a role. Admin credentials cannot be used to enter the collector portal; collector-only credentials cannot enter the admin portal. Both reserved staff emails are removed from resident remembered-account history. Passwords are never stored in source. Collector Authentication account creation (human password entry) and its collector-only grant remain pending.


## Collector staff IDs
Each Firebase account is linked once to a unique ID such as C250001 (C, joining year 25, sequence 0001). IDs are entered explicitly from employment records, not inferred from account creation. The sequence has four digits and starts at 0001. IDs cannot be reassigned or changed after linking; deactivation preserves the reservation.

Admin > More > Collectors > Link collector account accepts ID, name and Firebase UID for initial setup only. Existing collectors without an ID have a Link collector ID button. Pickup assignment accepts the ID and resolves the authenticated UID internally. Existing pickup assignments continue to use UIDs and remain valid.

Deployment: add the collectorIds rule block from firestore.rules to the existing named database rules before linking IDs. The registry is admin-only and reserves IDs atomically with the collector account document. No account passwords or roles are inferred from IDs. The existing live collector needs its actual joining year and sequence entered once. Existing Firebase accounts must be created in Authentication before linking; the browser client cannot verify Auth user existence from a UID.

Deployment status (20 October 2026): the narrow collectorIds registry rule was merged into the live named database rules and published at 3:44 pm. Existing collector access was preserved. Staff IDs still require one-time linking in the application. Build, type checking and the full mocked transaction test suite pass; browser end-to-end staff-ID linking has not been exercised.
