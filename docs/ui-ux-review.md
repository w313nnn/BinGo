# UI/UX review

## Implemented changes

- Removed the unused direct esbuild dependency that conflicted with Vite during installation.
- Fixed registration OTP resend so its countdown effect restarts.
- All three phone frames share `.app-shell`: they follow the dynamic viewport height, fit up to 850px on desktop, and account for iOS safe areas. The viewport metadata enables safe-area insets on notched phones.
- Login/loading/app wrappers share `.app-viewport`; short landscape screens use the available height and scroll content inside the frame. Modal height limits follow the dynamic viewport.
- Responsive CSS supports widths down to 320px; check 320px, 360px, 390px, and 430px portrait layouts plus a 390px-wide landscape phone. CSS cannot guarantee identical rendering on every device/browser, so physical-device checks remain necessary.
- Scrollable flex children can shrink so content scrolls inside the frame.
- OTP fields shrink to fit narrow rows; computed Google icon sizes no longer depend on undetectable dynamic Tailwind utility names.
- Shared keyboard focus, disabled cursor, text selection for inputs, mobile form font sizing and CSS reduced-motion support. Motion JavaScript animations still require a separate component-level audit.
- Rendering exceptions show a reload action and explain unsaved-state loss. This boundary does not catch async callback errors or module-initialization failures.

## Scope

Primary files: index.css, main.tsx, README.md. Minimal component edits were necessary to share frame sizing and fix OTP/icon sizing. No authentication, Firestore rules or business logic was redesigned.

## Findings requiring follow-up

These are observations from source review, not verified backend behavior.

- Email sign-in automatically creates an unknown resident account and stores credentials in local storage. Admin credentials are in client code. Replace prototype authentication with server-enforced authentication/roles before production.
- Registration OTP checks only six-digit length; password reset switches local UI state. These do not establish SMS delivery or reset-email delivery.
- Registration resend timer now restarts through a resend counter dependency; verify repeated expiry/resend in the browser.
- Some Google dialog help/privacy/terms links cancel navigation; users cannot reach their stated destinations.
- Terms agreement uses a clickable div. Replace with a labelled checkbox; audit icon button names, dialog focus trapping, Escape handling and focus restoration across components.
- Map geolocation, quota failure, station selection and navigation need browser/device checks with a restricted development key. Do not treat simulated fleet/navigation or QR verification as live service confirmation.
- Firestore write failures and success messages need integration checks so optimistic local updates do not imply confirmed persistence.

## Manual integration matrix (pending execution)

Use a disposable Firebase project; never submit test reports/rewards against shared production data. Test at 320x568, 390x844, 768x600, 1440x900 and 200% browser zoom. Record browser, viewport, steps, expected/actual result and evidence.

| Flow | Checks and expected result |
| --- | --- |
| Login / registration | Invalid and empty fields show errors; password toggle and remember choice work; back preserves intended state; OTP cells fit; resend ticks; distinguish simulated verification. |
| Forgot password | Validate email and back navigation; confirm actual reset delivery only after backend implementation. |
| Resident navigation | Open all five tabs; scroll to final content; footer remains reachable; long text does not overlap. |
| Item disposal | Exercise manual/AI paths, cancel/back, missing photo/details and successful review; verify one submission and activity entry. |
| Incident report | Require evidence/location; deny geolocation; cancel/retry; confirm persisted report appears in resident and admin views. |
| Maps | Missing/invalid key, denied location, station selection, filters, directions and return; fallback must remain usable. |
| Rewards | Insufficient points, out of stock, cancel and confirm; prevent duplicate deductions; verify persistence after reload. |
| Admin | Filter and open reports; update status/comment; resident receives update; sign out returns to login. |
| Modal / accessibility | Keyboard-only navigation, visible focus, accessible names, trapped/restored focus, Escape, screen reader errors and reduced-motion setting. |
| Recovery | Development-only rendering exception shows reload screen; reload restarts; inspect console for unexpected exceptions. |

## Validation record

Source review completed. `npm install --ignore-scripts --no-audit --no-fund`, `npm run lint` (TypeScript) and `npm run build` passed on 17 October 2026. The production build warns about a JavaScript chunk above 500 kB (approximately 1.28 MB uncompressed). Browser interaction, visual QA and live backend integration are pending; no end-to-end pass is claimed. The supplied Firebase project can seed data automatically, so use a disposable development project before running those tests.


## Google account chooser behavior

The app now lists only Google identities that completed Firebase Google sign-in in this browser's local storage, newest first. Selecting a saved entry sends its email as a Google `login_hint`; Firebase still performs OAuth, the returned email must match the selected account, and only the authenticated identity is saved. Manually entered email is also verified through Google OAuth. Removed the seeded demo account and legacy mock account IDs, so they no longer appear as login history.

Browser local storage is scoped to an origin and browser profile. `http://192.168.0.10:3000`, `http://localhost:3000`, another browser, and another device have separate histories. The app cannot read Google's account history from a different device. The native Google chooser can still list accounts currently signed in to that device; BinGo's own list appears first after a successful BinGo sign-in in that browser.


## Google sign-in recovery

Mobile browsers now use Firebase's redirect sign-in flow; desktop uses the popup flow. Redirect results are resumed after the browser returns. User-facing errors distinguish unauthorized domains, disabled Google provider, blocked popup and network failure. A provider still needs to be enabled in Firebase Console and the app origin must be authorized; code cannot change remote Firebase project settings. For phone tests on a LAN IP, add that host if Firebase accepts it, or serve the build from Firebase Hosting/an authorized HTTPS domain.
