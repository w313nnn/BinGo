import assert from "node:assert/strict";
import { predictionFromScores } from "../src/wasteClassifierResults";

const prediction = predictionFromScores([0.01, 0.02, 0.03, 0.04, 0.05, 0.06, 0.75, 0.04]);
assert.deepEqual(prediction, { label: "plastic", score: 0.75 });
assert.deepEqual(predictionFromScores([1, 0, 0, 0, 0, 0, 0, 0]), { label: "battery", score: 1 });
assert.throws(() => predictionFromScores(undefined), /unexpected result/);
assert.throws(() => predictionFromScores([0.2, 0.3]), /unexpected result/);
assert.throws(() => predictionFromScores([0, 0, 0, 0, 0, 0, 0, Number.NaN]), /invalid confidence/);
assert.throws(() => predictionFromScores([0, 0, 0, 0, 0, 0, 0, 1.01]), /invalid confidence/);

console.log("PASS: waste model score decoding, label ordering and malformed output handling.");
