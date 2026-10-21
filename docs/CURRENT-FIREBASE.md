# Current shared Firebase backend

Effective 21 October 2026, integration/ui-map-data uses teammate project bingo-integrated-test-74597 and Firestore (default). Applied from feature/bingo-web-config at 2ea1cbe after the user confirmed successful testing. Its branch was imported from a ZIP and has unrelated Git history, so the reviewed configuration was applied without replacing the integration code or merging unrelated histories.

The app config, default CLI alias and both Firestore deployment configs target the new backend. No cloud deployment, account migration or live database changes were performed during this switch. Old Firebase accounts, UIDs and history are not copied. Use accounts and roles in the new project.

Older documents referencing shining-display-s6tvw are historical and must not be used for deployment. Do not deploy to that project unless explicitly performing a rollback. Consult this file first.

Run npm ci --ignore-scripts if dependencies changed, then npm run dev. Stop and restart Vite after pulling this configuration. Keep local secrets outside Git. Phone/email OTP and reward-service feature flags stay disabled until their services are configured in the new project.

Deployment must always state --project bingo-integrated-test-74597 and the intended --only service. Hosting setup in firebase.json is configuration only; no hosting site is published by this commit. Review current live rules before separately deploying rules.
