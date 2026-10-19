# Demo account and administrator setup

Select **Try demo account** on the sign-in screen. No password is required. Aina Demo includes a configured reminder, fleet updates, future schedules, four reports, five disposal records, two linked pickup bookings and sample rewards. Data resets when the demo is reopened; Firebase writes are blocked. This is a local resident preview, not an administrator account.

## Why administrator sign-in fails

The Firebase Authentication user list was checked: admin123@bingo.com is absent. A displayed email/password in documentation does not create a Firebase user. The application requires the real Firebase `admin: true` custom claim; it does not grant privileges based on email or local storage.

1. In Firebase project shining-display-s6tvw, open Authentication > Users > Add user. Create admin123@bingo.com with a password you control (or use an existing authorized account).
2. From a trusted project-owner machine with Application Default Credentials configured for that project, run:

```powershell
cd tools/admin-setup
npm.cmd install
node grant-admin.mjs --email admin123@bingo.com
node grant-admin.mjs --email admin123@bingo.com --grant
```

The first invocation checks only; --grant assigns and verifies the custom claim while preserving other claims. The tool never reads passwords. Do not place service-account keys in this repository or browser code.

3. Sign out and back in using Municipal Staff Login. Verify the dashboard opens and admin-only Firestore operations succeed. Canonical firestore.rules recognizes this claim. No live rules were replaced for this change.

Admin account creation/role assignment and live admin verification remain pending. Local build, lint and automated tests pass; the demo was checked in the browser.


## Starter Tier alternative (prepared, live grant pending)

Google-managed Starter Tier IAM cannot be edited by this project user. The app now accepts either the Firebase admin custom claim or an active, trusted `admins/{uid}` record with `role: "admin"` and `active: true`. It reads roles from the server and denies missing, inactive or invalid role records. No email/password/localStorage bypass is used.

The role record must be created through Firebase Console by a project operator. Browser clients cannot write any role records under the proposed rules. The resident can only get their own role document, not list the collection. Local canonical rules include this pattern; the narrow live proposal preserves unrelated deployed rules and existing verified-email access. A copy of the deployed rules is saved outside the project for rollback. Publishing and the actual grant need confirmation first.

Target Firebase Auth UID for admin123@bingo.com: e80U2vgBLJNePdvRa8Fnp2PpLID3.


## Live verification — 19 October 2026

With user approval, the narrow admin rule patch was published to the named database and admins/e80U2vgBLJNePdvRa8Fnp2PpLID3 was created with role=admin (string), active=true (boolean), via Firebase Console. No custom claim or Cloud IAM grant was made. Email/password sign-in through Municipal Staff Login was verified to open the Control Panel; the protected Feedback tab loaded its saved submission successfully. This supersedes the pending status above. Clients remain unable to write admin-role records. The existing unrelated live rules were preserved; this is not a complete backend security audit.
