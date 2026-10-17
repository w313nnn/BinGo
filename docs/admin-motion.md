# Administrator dashboard motion

Implemented using gsap and @gsap/react, following the gsap-react skill. AdminLiveData.tsx uses scoped refs and useGSAP with revertOnUpdate for cleanup on changes and unmount. Counter and progress animations react only to the data supplied by the existing app; this update does not create a new sensor feed or change refresh frequency.

Animated values: report totals and status counts, reward counts, truck progress and bin capacity. Numbers retain tabular spacing. Progress fills animate transforms instead of layout width. Rapid updates start from the displayed value. Reduced-motion settings show final values immediately. Accessible values always expose the current exact number.

Validation: existing administrator credentials successfully opened the panel. An isolated test update changed report count 4 to 5 and bin capacity to 83%; the progress fill settled at scaleX(0.83). Navigating to Reports and back retained the updated values. Test controls and Firebase write stubs were excluded from the project. TypeScript and production build pass; existing bundle-size warning remains.

To run after updating dependencies: stop Vite, run npm.cmd install in BinGo-main, then npm.cmd run dev.
