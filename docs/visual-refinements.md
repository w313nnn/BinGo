# Visual refinements - 18 October

- Pale yellow recycling tips. Shine cycle shortened from 8 to 6.5 seconds.
- Stepper remembers the furthest visited step when earlier answers remain unchanged. Changing photo, category, item, condition, weight, description or route locks later steps until the flow is completed again. New sessions reset progress. Submission stays behind the final confirmation button.
- Report statuses use visible wrapping filter chips with accessible pressed states.
- Station cards and map popups use circular directions links, labelled with their destination for screen readers.
- Login has a green animated edge arc instead of the central circle. Decorative motion respects reduced-motion preferences and does not capture clicks.

Validation: TypeScript and production build pass. In an isolated preview, verified report filtering; reaching step 3, returning to step 1 and jumping back without edits; editing weight at step 1 locks later steps; phone map cards and login arc. No live records submitted. Existing large bundle warning remains.

Visual inspiration: user screenshots and React Bits Orb (https://reactbits.dev/backgrounds/orb). The arc and shine are local CSS/SVG interpretations, not installed third-party components. The supplied recording was not available at its path.
