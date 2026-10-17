# Motion and UX update - 18 October 2026

## Motion
- Applied gsap-performance, gsap-react and gsap-utils. Scoped useGSAP contexts revert on updates/unmount. Event handlers use quickTo tweens created inside the context. No new tweens are created on each pointer move.
- Map capacity displays share a single animated model for their percentage and transform fill. gsap.utils clamp/mapRange/snap normalize finite values to 0-100 and 0-1 scales. Off-screen/background displays settle immediately; reduced motion skips animation.
- Admin animation also stops when off-screen. CSS loops pause while the document is hidden.
- Analysis uses transforms instead of continuously changing width/height. Photo preparation uses scaleX. Stepper sizing updates once rather than animating flex layout on every frame.
- App loads behind a short startup screen, in parallel with its animation. Admin code is split into a lazy chunk. Reduced motion removes the minimum startup delay. The large app bundle warning remains; no physical-device FPS benchmark was performed.
- Login uses the supplied Orb API as an original lightweight green SVG interpretation with cursor-follow, rotation and a light trail. Keeps the requested edge arc rather than a circle behind the logo; no WebGL dependency.

## Interaction
- Greeting uses the browser's local hour: morning 05:00-11:59, afternoon 12:00-17:59, evening otherwise. Updates every 30 seconds and on focus/visibility changes.
- All rewards open a details page: benefit, validity, delivery, stores/use locations, eligible products/minimum spend, availability, usage and terms. The catalogue is a demo: merchant details are explicitly unconfigured. Existing 30-day demo validity is retained; redemption now records an expiry date. Reward costs are deducted from the session balance and local availability increments after redemption.
- Map legend has its own wrapping row. Removed an incorrectly centred icon-container wrapper and corrected the map/frame height mismatch that clipped its top.

## Verification
- TypeScript and production build pass.
- Eight greeting boundary checks and seven finite/clamped capacity cases pass.
- Isolated browser preview: startup then login; 12 reward detail entry points; ZUS details and insufficient-points state; all legend labels inside the frame at 320px; 390px reward/map/login screenshots.
- Firebase writes stubbed during verification; test configuration excluded from delivery.
