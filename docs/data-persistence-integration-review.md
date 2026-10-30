# Data persistence integration review

Merged feature/data-persistence at b99928c into integration/ui-map-data, preserving 9462c94 collector evidence, staff IDs, admin UI and approved-point notifications.

Resolved four file conflicts. Consolidated overlapping capacity rules (Firestore allows a request if any matching rule allows it). Preserved the live feedback subscription and guarded demo writes instead of maintaining two feedback pipelines. Restored demo-only notification samples, preserved personal notifications, and derive unread state from IDs rather than a count. Enforced report status transitions inside the approval transaction as well as the admin UI. Invalid model confidence values now fail safely into manual selection. Confirmed the bundled model hash matches its attribution file.

Validation: TypeScript, full npm test suite (including capacity and collector transaction checks), production build, and git diff --check. Browser end-to-end classification and live capacity writes were not exercised. This merge does not deploy Firestore rules or change live account roles.

Limitations: ONNX model plus WASM require roughly 20 MB on initial use. Vite reports the existing large application chunk and ineffective workflow dynamic import. npm audit reports four high-severity findings in the existing Firebase/grpc dependency chain; its proposed fix downgrades Firebase to v9, so no blind forced downgrade was applied.
