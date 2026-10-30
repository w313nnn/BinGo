# Dashboard updates

Reports, capacities, schedules, notices, fleet and rewards retain their Firestore onSnapshot listeners. Confirmed changes animate through scoped GSAP timelines with reduced-motion and offscreen fallbacks. Numbers and meters remain exact for assistive technology.

Admin header Refresh performs explicit getDocsFromServer reads for active dashboard subscriptions and reuses their existing mapping callbacks. The button is locked during the request; errors do not display success or clear existing data. Newer listener events take precedence over a late manual response. Unsubscribed views and changed authentication sessions cannot receive late results. The action reads data only: it neither creates percentages nor adds sample records.

This does not connect physical sensors. Genuine capacity detection requires a trusted sensor/backend to write valid binCapacities/{locationId} records. Existing sample readings remain samples. Review-page job reload remains its own existing Refresh action.

Validation: TypeScript, complete test suite including dashboard server-refresh race/error tests, production build. No real sensor or end-to-end live-project update was exercised.
