import assert from "node:assert/strict";
import { capacityTimestampToMillis, isCapacityStale, isValidFillPercentage, mergeCapacityRecords, saveCapacityAndApplyConfirmed, BIN_CAPACITY_STALE_AFTER_MS, BIN_CAPACITY_FUTURE_CLOCK_SKEW_TOLERANCE_MS } from "../src/binCapacity.ts";
import { SIME_DARBY_COLLECTION_POINTS } from "../src/simeDarbyData.ts";
import { recycleLocations } from "../src/appData.tsx";

for (const value of [0, 0.5, 50, 100]) assert.equal(isValidFillPercentage(value), true);
for (const value of [-0.1, 100.1, Number.NaN, Number.POSITIVE_INFINITY, "50", null]) {
  assert.equal(isValidFillPercentage(value), false);
}

const now = 2_000_000_000_000;
assert.equal(isCapacityStale(now, now), false);
assert.equal(isCapacityStale({ toMillis: () => now }, now), false, "Firestore Timestamp objects are fresh when recent");
assert.equal(isCapacityStale(now - BIN_CAPACITY_STALE_AFTER_MS, now), false);
assert.equal(isCapacityStale(now - BIN_CAPACITY_STALE_AFTER_MS - 1, now), true);
assert.equal(isCapacityStale(null, now), true);
assert.equal(isCapacityStale(undefined, now), true, "a missing timestamp is not fresh");
assert.equal(isCapacityStale("invalid", now), true, "an invalid timestamp is not fresh");
assert.equal(capacityTimestampToMillis({ toMillis: () => now }), now, "Firestore Timestamp values convert to milliseconds");
assert.equal(capacityTimestampToMillis({ toMillis: () => Number.NaN }), null, "invalid timestamp values remain unknown");
assert.equal(isCapacityStale(now + 1, now), false, "a newly saved timestamp slightly ahead of the browser clock is fresh");
assert.equal(isCapacityStale(now + BIN_CAPACITY_FUTURE_CLOCK_SKEW_TOLERANCE_MS, now), false, "the full allowed clock-skew tolerance is fresh");
assert.equal(isCapacityStale(now + BIN_CAPACITY_FUTURE_CLOCK_SKEW_TOLERANCE_MS + 1, now), true, "a timestamp beyond the tolerance is stale");

const confirmedRecord: { locationId: string; fillPercentage: number; updatedAtMs: number | null; updatedBy: string } = {
  locationId: "1", fillPercentage: 20, updatedAtMs: now, updatedBy: "admin",
};
let displayedRecord: typeof confirmedRecord | null = null;
await saveCapacityAndApplyConfirmed(async () => confirmedRecord, record => { displayedRecord = record; });
assert.equal(displayedRecord, confirmedRecord, "a confirmed save updates the displayed capacity record");
const justSaved = { "1": confirmedRecord };
const olderSnapshot = { "1": { ...confirmedRecord, fillPercentage: 85, updatedAtMs: now - 1 } };
const mergedAfterListener = mergeCapacityRecords(justSaved, olderSnapshot);
assert.equal(mergedAfterListener["1"], confirmedRecord, "an older listener snapshot cannot roll back the saved reading");
assert.equal(mergedAfterListener["1"].fillPercentage, 20, "overview and selected location retain the same confirmed record");
assert.equal(isCapacityStale(mergedAfterListener["1"].updatedAtMs, now), false, "the confirmed recent reading is not outdated");
assert.equal(mergeCapacityRecords(justSaved, { "1": { ...confirmedRecord, fillPercentage: 30, updatedAtMs: now + 1 } })["1"].fillPercentage, 30, "a newer server reading replaces the saved reading");
assert.equal(mergeCapacityRecords(justSaved, { "1": { ...confirmedRecord, fillPercentage: 30, updatedAtMs: null } })["1"], confirmedRecord, "a timestamp-less snapshot cannot replace confirmed freshness");
displayedRecord = null;
await assert.rejects(
  saveCapacityAndApplyConfirmed(async () => { throw new Error("Firestore write failed"); }, record => { displayedRecord = record; }),
  /Firestore write failed/,
);
assert.equal(displayedRecord, null, "a failed save does not apply a false success state");

const locationIds = SIME_DARBY_COLLECTION_POINTS.map(point => String(point.id));
assert.equal(new Set(locationIds).size, locationIds.length, "collection point IDs must be unique capacity document IDs");
assert.ok(locationIds.every(id => /^\d+$/.test(id)));
assert.ok(SIME_DARBY_COLLECTION_POINTS.every(point => point.fill === undefined), "static locations must not carry demo capacity percentages");
assert.ok(recycleLocations.every(point => point.fill === undefined), "derived locations must not reintroduce legacy demo capacity percentages");

console.log("Passed bin capacity validation, staleness, and location identity checks.");
