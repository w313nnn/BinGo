# Specular status and morphing filters

Added a local SpecularButton component using the supplied property API as a visual reference. Default mode is a real button; NEXT and fleet ETA use its noninteractive span mode. Green NEXT and pale gold ETA surfaces include a subtle sweep and pointer proximity highlight. The optional sparkle glyphs are disabled on these badges. They do not imply a new click action. Effects stop off-screen, in hidden documents and for reduced-motion preferences. Pointer bounds are cached outside the move handler; a few visible badges listen within the app shell, without global mouse listeners.

Existing morphicons dependency reused. Map, Activity report and Guide category chips morph filter/check icons as selection changes. Administrator status and history dropdowns morph filter/close and expose aria-expanded. Filter behaviour and selected states remain intact.

Startup now uses the shared app viewport and app-shell sizing, safe areas and desktop frame. Compact phones fill their viewport. The initial 650ms animation behaviour is unchanged; reduced motion skips the minimum delay.

Validation: TypeScript and build pass. Browser checked fleet ETA and NEXT surfaces, Pending report filtering, startup desktop frame, and a 320x568 startup shell matching the viewport exactly. Temporary startup preview routing and Firebase stubs excluded from delivery. Existing large app chunk warning remains.
