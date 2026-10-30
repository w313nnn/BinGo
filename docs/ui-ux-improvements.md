# BinGo UI/UX improvements

## Changes

- Mobile screens fill the available width, including 430px portrait phones and short landscape screens. Desktop retains the centered frame.
- Removed simulated clock/network/battery bars from login and resident screens so real phone UI is not duplicated.
- Header actions have 44px minimum touch targets; navigation buttons have 48px minimum height and a visible selected background. Screen readers receive current-page state and names for profile, notifications, rewards, and close controls.
- The Google account history picker uses BinGo branding, clear per-browser history wording, a first-use empty state, and a button that opens actual Google authentication. Removed the imitation Google email form and dead policy/help links in that picker.
- Account and disposal dialogs support Escape and keyboard focus containment/restoration. Registration uses a native labelled terms checkbox; login/registration fields have accessible names and autocomplete hints.
- Tab navigation resets the shared content scroll position. Reduced-motion preferences now also apply to Motion animations.
- AI option copy identifies its current demo status; no actual image model integration is claimed.

## Checks completed

- TypeScript check and production build pass. Existing large JavaScript bundle warning remains.
- Local browser preview at 320×568, 430×932, 390×844 and 844×390. No horizontal document overflow at the measured small/large/landscape viewports; navigation remains within the phone viewport.
- Checked empty login validation, registration field/checkbox semantics, resident Home/Guide navigation, disposal sheet open/Escape dismissal and Google account dialog keyboard wrap/Escape dismissal.
- Browser preview replaced Firestore subscription/write functions with local stubs and used a temporary resident preview. These test files and bypasses are excluded from this project ZIP. No reports, points or account records were written to the connected project by these checks.

## Remaining validation

Actual Google OAuth, Firestore persistence, map navigation and physical-device accessibility require live integration checks. These UI changes do not alter Firebase authorized domains. Other app sheets still need a complete focus/keyboard audit. The existing email/phone login and AI/QR flows contain prototype behavior documented in ui-ux-review.md.


## Centered icons and Morphicons

- Added explicit shared classes for single-icon buttons/containers throughout resident, login, admin, map, address and back controls. Icon-only buttons use centered flex layout and a 44px minimum touch target. Text-plus-icon controls keep their original label alignment.
- Corrected the notification tray close icon and removed duplicate plus text from report actions: one Plus glyph followed by Report.
- Installed `morphicons` and version-aligned `lucide` icon data. `src/AnimatedIcon.tsx` provides a shared MorphIcon with smooth spring animation and `reducedMotion="user"`.
- Morphs are used for notification/profile/disposal toggles, three password visibility controls, admin expand/collapse and pin/unpin actions, and the address catalog toggle. Static icons remain static.
- Added a 180ms transition when tab content mounts, disabled for reduced-motion users.
- Local isolated browser checks at 390px width verified the password toggle, notification tray and report button. Measured notification close SVG/button center difference: 0px horizontally and vertically. TypeScript and production build pass; the existing large-bundle warning remains. These are UI checks, not live OAuth/database verification.

After extracting this version, run `npm.cmd install` in the folder containing package.json before starting Vite; the new packages must be installed.
