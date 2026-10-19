import ortWasmUrl from "../node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.wasm?url";
import ortWasmModuleUrl from "../node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.mjs?url";

const MODEL_LABELS = ["battery", "biological", "cardboard", "glass", "metal", "paper", "plastic", "trash"] as const;

export type WasteLabel = (typeof MODEL_LABELS)[number];
export type WastePrediction = { label: WasteLabel; score: number };
export const BIN_GO_CATEGORY_BY_LABEL: Record<WasteLabel, { category: string; itemType?: string } | null> = {
  battery: { category: "E-Waste", itemType: "Household Batteries" },
  biological: null,
  cardboard: { category: "Paper / Cardboard" },
  glass: { category: "Glass" },
  metal: { category: "Metal / Tin" },
  paper: { category: "Paper / Cardboard" },
  plastic: { category: "Plastic" },
  trash: { category: "General Waste" },
};

let sessionPromise: Promise<import("onnxruntime-web/wasm").InferenceSession> | null = null;

async function getSession() {
  if (!sessionPromise) {
    sessionPromise = (async () => {
      const ort = await import("onnxruntime-web/wasm");
      ort.env.wasm.wasmPaths = { wasm: ortWasmUrl, mjs: ortWasmModuleUrl };
      ort.env.wasm.numThreads = 1;
      return ort.InferenceSession.create(`${import.meta.env.BASE_URL}models/wastewise-garbage-cls.onnx`, {
        executionProviders: ["wasm"],
        graphOptimizationLevel: "all",
      });
    })().catch(error => {
      sessionPromise = null;
      throw error;
    });
  }
  return sessionPromise;
}

function loadImage(source: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("The selected photo could not be decoded for analysis."));
    image.src = source;
  });
}

function preprocessImage(image: HTMLImageElement, Tensor: typeof import("onnxruntime-web/wasm").Tensor) {
  const canvas = document.createElement("canvas");
  canvas.width = 224;
  canvas.height = 224;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("This browser could not prepare the photo for analysis.");
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(image, 0, 0, 224, 224);
  const { data } = context.getImageData(0, 0, 224, 224);
  const planeSize = 224 * 224;
  const tensorData = new Float32Array(3 * planeSize);
  for (let pixel = 0; pixel < planeSize; pixel++) {
    tensorData[pixel] = data[pixel * 4] / 255;
    tensorData[planeSize + pixel] = data[pixel * 4 + 1] / 255;
    tensorData[2 * planeSize + pixel] = data[pixel * 4 + 2] / 255;
  }
  return new Tensor("float32", tensorData, [1, 3, 224, 224]);
}

export async function classifyWasteImage(imageSource: string): Promise<WastePrediction> {
  if (typeof window === "undefined" || typeof document === "undefined") {
    throw new Error("Image recognition is available in a browser only.");
  }
  const [ort, session, image] = await Promise.all([
    import("onnxruntime-web/wasm"),
    getSession(),
    loadImage(imageSource),
  ]);
  const output = await session.run({ images: preprocessImage(image, ort.Tensor) });
  const scores = output.output0?.data;
  if (!scores || scores.length !== MODEL_LABELS.length) {
    throw new Error("The waste model returned an unexpected result. You can continue by choosing the material manually.");
  }
  let bestIndex = 0;
  let bestScore = Number(scores[0]);
  for (let index = 1; index < scores.length; index++) {
    const score = Number(scores[index]);
    if (score > bestScore) {
      bestIndex = index;
      bestScore = score;
    }
  }
  if (!Number.isFinite(bestScore) || bestScore < 0 || bestScore > 1) {
    throw new Error("The waste model returned an invalid confidence score. You can continue by choosing the material manually.");
  }
  return { label: MODEL_LABELS[bestIndex], score: bestScore };
}
