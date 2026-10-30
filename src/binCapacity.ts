export const BIN_CAPACITY_STALE_AFTER_MS = 7 * 24 * 60 * 60 * 1000;
export const BIN_CAPACITY_FUTURE_CLOCK_SKEW_TOLERANCE_MS = 60 * 1000;

export function isValidFillPercentage(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 100;
}

/** Convert Firestore Timestamp values (and the serialized millisecond form used by the UI) safely. */
export function capacityTimestampToMillis(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (value && typeof value === "object" && "toMillis" in value && typeof value.toMillis === "function") {
    try {
      const milliseconds = value.toMillis();
      return Number.isFinite(milliseconds) ? milliseconds : null;
    } catch {
      return null;
    }
  }
  return null;
}

export function isCapacityStale(updatedAt: unknown, now = Date.now()): boolean {
  const updatedAtMs = capacityTimestampToMillis(updatedAt);
  return updatedAtMs === null
    || updatedAtMs - now > BIN_CAPACITY_FUTURE_CLOCK_SKEW_TOLERANCE_MS
    || now - updatedAtMs > BIN_CAPACITY_STALE_AFTER_MS;
}

/** Prevent an older listener snapshot from replacing a newer server-confirmed reading. */
export function mergeCapacityRecords<T extends { updatedAtMs: number | null }>(
  current: Record<string, T>,
  incoming: Record<string, T>,
): Record<string, T> {
  const merged = { ...current };
  for (const [locationId, candidate] of Object.entries(incoming)) {
    const existing = merged[locationId];
    if (!existing
      || (candidate.updatedAtMs !== null
        && (existing.updatedAtMs === null || candidate.updatedAtMs >= existing.updatedAtMs))) {
      merged[locationId] = candidate;
    }
  }
  return merged;
}

/** Apply a capacity to UI state only after the persistence operation confirms success. */
export async function saveCapacityAndApplyConfirmed<T>(
  save: () => Promise<T>,
  applyConfirmed: (saved: T) => void,
): Promise<void> {
  const saved = await save();
  applyConfirmed(saved);
}
