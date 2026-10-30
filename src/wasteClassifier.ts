import ortWasmUrl from "onnxruntime-web/ort-wasm-simd-threaded.wasm?url";
import ortWasmModuleUrl from "onnxruntime-web/ort-wasm-simd-threaded.mjs?url";
import { predictionFromScores, type WasteLabel, type WastePrediction } from "./wasteClassifierResults";

export { predictionFromScores };
export type { WasteLabel, WastePrediction };
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
      try {
        return await ort.InferenceSession.create(`${import.meta.env.BASE_URL}models/wastewise-garbage-cls.onnx`, {
          executionProviders: ["wasm"],
          graphOptimizationLevel: "all",
        });
      } catch (error) {
        const detail = error instanceof Error ? error.message : String(error);
        throw new Error(`Could not load the local waste recognition model. Check that public/models/wastewise-garbage-cls.onnx is available and your browser supports WebAssembly. (${detail})`);
      }
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
  const inputName = session.inputNames[0];
  const outputName = session.outputNames[0];
  if (!inputName || !outputName) {
    throw new Error("The waste model does not expose the input and output needed for image classification. You can continue by choosing the material manually.");
  }
  let output: import("onnxruntime-web/wasm").InferenceSession.OnnxValueMapType;
  try {
    output = await session.run({ [inputName]: preprocessImage(image, ort.Tensor) });
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(`The waste model could not analyze this photo. Try another clear image or continue by choosing the material manually. (${detail})`);
  }
  return predictionFromScores(output[outputName]?.data as ArrayLike<number> | undefined);
}
