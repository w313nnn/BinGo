/** Explicit local preview state. It never grants Firebase authentication or administrator access. */
let active = false;
export const isDemoSession = () => active;
export function setDemoSession(value: boolean) { active = value; }
export function requireLiveSession() {
  if (active) throw new Error("Demo account: sample data only. Sign in to a real account to save changes.");
}
