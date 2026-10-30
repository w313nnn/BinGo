export const MODEL_LABELS = ["battery", "biological", "cardboard", "glass", "metal", "paper", "plastic", "trash"] as const;

export type WasteLabel = (typeof MODEL_LABELS)[number];
export type WastePrediction = { label: WasteLabel; score: number };

export function predictionFromScores(scores: ArrayLike<number> | undefined): WastePrediction {
  if (!scores || scores.length !== MODEL_LABELS.length) {
    throw new Error("The waste model returned an unexpected result. You can continue by choosing the material manually.");
  }
  let bestIndex = 0;
  let bestScore = Number(scores[0]);
  for (let index = 0; index < scores.length; index++) {
    const score = Number(scores[index]);
    if (!Number.isFinite(score) || score < 0 || score > 1) {
      throw new Error("The waste model returned an invalid confidence score. You can continue by choosing the material manually.");
    }
    if (score > bestScore) {
      bestIndex = index;
      bestScore = score;
    }
  }
  return { label: MODEL_LABELS[bestIndex], score: bestScore };
}
