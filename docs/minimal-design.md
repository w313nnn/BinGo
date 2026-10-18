# Minimal BinGo design

## Reference interpretation

Both user-provided videos were inspected as animation references. 858 uses a connected step track: the active pill expands to show its label and previous steps become checkmarks. 869 uses a glowing tile that morphs between a wide rectangle and a square, with moving dots and changing status text. BinGo recreates those interaction ideas using its own green palette and concise labels; the video assets are not bundled.

## Implemented

- Shared white/neutral surfaces, flat cards, one green accent, cleaner login/admin/resident headers and no simulated phone hardware.
- Next collection is the first home action; collection fleet details are collapsed.
- Notifications, sorting examples/rules, impact statistics, account-history notes and preparation instructions reveal supporting information only when opened. Report list descriptions live in the existing detail view.
- The photo/manual wizard uses expanding step pills with completion ticks. Steps describe the real user workflow and cannot skip required validation.
- Separate Take photo and Upload controls, local image preview, remove/retry, file type/size validation and read/decode progress. This prototype prepares the photo locally; it does not upload to a cloud storage service.
- A green shape-changing tile and dot wave replace the spinner during the analysis preview. OS reduced-motion preferences are respected. Cancelling/closing the flow clears its timer and file-reading callbacks.
- Existing sample analysis is clearly labelled Demo. The unsupported 92% confidence claim was removed. A real AI service is still required before image classification can be treated as live.

## Files

FlowStepper.tsx, PhotoInput.tsx, AnalysisMotion.tsx and DetailsDisclosure.tsx provide the reusable patterns. App.tsx connects the workflow and disclosures; index.css applies the shared theme. LoginFlow.tsx, AdminPanel.tsx and SimeDarbyAddressPicker.tsx use the updated design language.

## Validation

- TypeScript and production build checks pass; existing large JavaScript chunk warning remains.
- Isolated local browser preview at 390×844 and 320×568: main screens and photo step have no horizontal document overflow.
- Tested local image selection/decode, image preview, enabling Analyse, back/retry, progression to sample result, and expandable guide details.
- Verified stepper widths after transitions; removed layout projection that caused a transient pill offset when the sheet height changed.
- Preview used temporary local stubs for Firestore writes/subscriptions. The stubs, authentication preview and decoder tools are excluded from the deliverable.
- Physical camera permission behavior, live OAuth, cloud storage and AI service calls remain separate integration checks.

Use the existing outputs/BinGo-main project folder. New source files are picked up by Vite; refresh if necessary. No new app dependencies were added in this pass.
