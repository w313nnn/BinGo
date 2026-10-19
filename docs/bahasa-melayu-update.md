# Bahasa Melayu completion — 19 October 2026

This update changes language presentation only and adds a brief language-switch loading animation.
- Shared English-to-Malay phrase catalogue covers navigation, resident screens, sorting guide and all 16 materials, item types, forms, rewards, reminders, validation/error messages, and admin controls.
- English remains the original source text. Status values, filters, backend fields, booking payloads and report transitions remain in their original canonical form.
- Names, e-mail addresses, addresses and resident-authored free-text feedback are retained as entered. Third-party map content and newly authored database content need their own translated copy; no external translation service receives user data.
- Malay language preference persists in browser storage. HTML language and displayed date/time text follow the selection.
- Malay material names and rules can be searched without changing category identifiers.
- Reminder options keep canonical values; their labels are translated at render time so switching languages does not change the saved timing choice.
- GSAP language transition uses scoped useGSAP cleanup and respects reduced motion. Existing layout classes, colours, sizes and interactions are retained.

Verification: 1,976 existing design attributes and 300 existing interaction handlers match the pre-change source, excluding the language-switch action. TypeScript, existing regression tests, and the production build pass. Language tests cover phrase coverage, exact English output, locale persistence, times, preserved names and immutable status identifiers. Browser verified: Malay startup after reload, translated home/guide/details/reminder/rewards, search using 'plastik', switch animation, switching back to English, and no horizontal page overflow.

Core data, authentication, map coordinates, Firestore rules and Firebase settings were not changed by this update.
