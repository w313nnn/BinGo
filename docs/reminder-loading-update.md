# Compact reminder and loading-line update

The reminder overview now contains the collection summary and one timing field. Selecting the field opens a separate popup with six short timing options. Choosing a time returns to the overview; Save confirms it. Dismissal leaves the saved preference unchanged. The popup supports arrow keys, Escape, focus trapping and focus restoration. Background notifications remain outside this UI update; timing preferences are session-only.

The supplied 4.73-second recording was reviewed as a motion reference: varied objects rise along a shared baseline. The new loader uses eleven original inline SVG illustrations: plastic bottles, aluminium cans, glass, plastic containers, sofa, refrigerator, phone and laptop. No plant/flower/bee assets were copied.

GSAP `toArray`, `distribute`, `wrap` and `mapRange` drive a scoped stagger with small variations in rise and tilt. Transforms and opacity animate; reduced motion renders the row immediately. Loading continues to the app after the short entrance completes. Decorative animation pauses when the document is hidden and cleans up on unmount.

Validated in the running app: timing options hidden initially; select → overview; Save → updated home button; reopen → saved choice; Remove → cleared preference; arrow-key selection; Escape cancels an unconfirmed picker selection; focus returns to the timing field. Phone-width reminder and loading screenshots were inspected. DOM observations confirmed items appear sequentially and finish visible without horizontal overflow at 390 px. TypeScript/build and existing regression checks are recorded in the handoff.

Final checks: `npm.cmd run lint`, `npm.cmd test` and `npm.cmd run build` passed. Vite retains the previously documented large App chunk warning. No Firebase rules, backend permissions or deployed GitHub code were changed by this UI update.

## Shared sign-in / loading identity

Startup and authentication now render the same `BrandIdentity` component: white rounded leaf/recycle mark, dark `Bin`, emerald `Go` and the exact tagline “Waste less. Recycle more.”. The loader's waste illustrations use a pale mint/sage/ivory palette with soft green outlines and a light backdrop. Its varied-height stagger remains inspired by the supplied video. The main application's darker green theme is preserved.

The updated loader was visually checked at phone width: all eleven items fit, the logo and tagline remain readable, and document width matches the 390-pixel viewport. Temporary preview files are excluded from the handoff.
