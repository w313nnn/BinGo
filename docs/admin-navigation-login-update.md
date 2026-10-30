# Admin navigation and sign-in update

19 October 2026. Bottom navigation: Dashboard, Reports, central Review, Schedule, More. Rewards, Updates and Feedback remain under More. English/Malay labels included.

Resident device-account history prunes the reserved admin email and prevents saving it again. Google sign-in resolves roles before saving a resident account entry. This cleanup happens separately in each browser when this build loads; no Firebase report, booking, user or disposal document is deleted.

The reserved administrator account cannot fall through to the resident interface when its role check fails. Authentication observer failures fail closed. The existing trusted Firestore role is required; credentials or local storage never grant admin access.

Browser checks: fresh email sign-in using the ordinary form automatically opens Control Panel; reload restores admin session. More displays all three secondary tools. Automated history cleanup preserves resident records. Lint, tests and production build pass (existing bundle-size warning remains).

Teammate deployment: use this complete integrated source, preserve its Firebase configuration and named database, run npm ci then npm run dev, and open the displayed URL. The previous GitHub push was blocked by authentication, so a checkout may lack the Firestore role resolver. The teammate's exact installed version is unknown; remote resolution is not independently confirmed.
