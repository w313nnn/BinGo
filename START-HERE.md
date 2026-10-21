# BinGo: set up your own Firebase

This package contains the latest integrated source, rules, tests and model assets. It does not copy the original accounts or database. No passwords, private keys or original Firebase connection are included. Nothing syncs automatically.

## 1. Create a Firebase project

Use your own Google account to create a standard Firebase project. Choose Spark for supported no-cost features; leave paid SMS and Cloud Functions disabled. Confirm you can manage project members. Create Firestore in production mode using the `(default)` database. Choose the region deliberately, for example asia-southeast1. Enable Authentication > Email/Password, optionally Google. Add localhost to authorized domains for local testing if absent.

Register a Web app. Save its firebaseConfig object as valid JSON in web-config.json here: no `const`, comments or trailing semicolon. This is browser configuration, not an Admin SDK private key.

## 2. Configure and run

Use Node.js 24. Open Git Bash inside this folder:

```bash
node setup/configure.mjs web-config.json '(default)'
npm ci --ignore-scripts
cp .env.example .env.local
npm run dev
```

PowerShell: use npm.cmd if needed and Copy-Item instead of cp. The configure command updates firebase-applet-config.json, firebase.json and .firebaserc together. It refuses the original project and makes no cloud changes. Leave OTP and redemption flags false. Use your own restricted Maps key only if you need interactive Google Maps; the directory/fallback remains available. VITE variables are public, so never put private keys or email-service secrets there.

## 3. Publish rules

Paste firestore.rules into YOUR database's Rules tab and Publish. Confirm the correct project and `(default)` database. Alternatively:

```bash
npm install -g firebase-tools
firebase login
firebase deploy --only firestore:rules --project YOUR_PROJECT_ID
```

Replace YOUR_PROJECT_ID. Do not publish into the original team's project. Checking in rules does not publish them.

## 4. Accounts and roles

Create separate resident, administrator and collector accounts in Authentication > Users. Enter passwords yourself. Copy their NEW UIDs; original-project UIDs cannot be reused.

Create admins/NEW_ADMIN_UID in Firestore Data with role (string) = admin and active (boolean) = true. This is a privileged Console setup step, not something a resident can grant themselves. Email spelling alone grants no access.

Sign into BinGo's Administrator portal. In More > Collectors link the NEW collector UID to a name and unique collector ID, for example C260001. Each collector has their own account. The client cannot create Auth users for you.

## 5. Demonstration data

The built-in resident Demo account is already populated locally and needs no cloud seed. Its writes are disabled by design.

For real backend demonstrations, use sample records in setup/initial-data.json as a guide. Add schedules, notices and rewards through the admin screens, and capacity readings through the admin dashboard. Field types matter: numbers and booleans must not be saved as strings. Use dates relative to your demonstration day. Capacity percentages are illustrative, not sensor readings. Sample rewards are not valid merchant vouchers.

Use a real resident account to submit reports and recycling/pickup requests. This creates correct UID ownership and linked documents automatically. Do not manually copy private records, evidence or old UIDs from the original project.

## 6. Verify

```bash
npm run lint
npm test
npm run build
```

Test: resident submits pickup, admin approves and assigns, collector uploads evidence, admin reviews and awards points once, resident sees notification. Another resident must not see those records; collector must not enter admin. Name/address editing works. Email OTP, SMS and redemption are not live services in this package. AI uses the included browser model/runtime, approximately 20 MB on first use.

## 7. Keep the current GitHub repository

From a clean clone of the shared BinGo repository create integration/teammate-firebase. Apply the configured code from this package. Commit your web-client configuration and firebase.json, but never web-config.json, .env.local, passwords, private keys, node_modules or dist. Open a pull request to integration/ui-map-data. Merge only after the new backend and teammate access pass testing. The original backend remains unchanged as a fallback; data does not synchronize.

Hosting/PWA can follow. Hosting configuration is included but no site was published. Add your actual hosting domain to Authentication. Do not run an unqualified firebase deploy. A preview URL still uses the configured database.

## Limits

No cloud resources, Auth users, roles, billing or data are created by extracting this ZIP. No original credentials or personal data were exported. Existing large-bundle warnings and Firebase/grpc dependency audit findings remain; no forced Firebase downgrade was applied. Rules are a development baseline to review before real personal data. No teammate password or email is required to send this package.

References: https://firebase.google.com/docs/web/setup and https://firebase.google.com/docs/firestore/security/get-started
