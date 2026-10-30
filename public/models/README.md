# WasteWise browser classifier

The `wastewise-garbage-cls.onnx` file is the unmodified `wastewise-yolo.onnx` artifact from [SriramRokkam/wastewise-garbage-cls](https://huggingface.co/SriramRokkam/wastewise-garbage-cls), licensed under Apache-2.0. The accompanying `LICENSE-2.0.txt` contains the license text.

Model card: YOLOv8n-cls, ONNX opset 17, RGB 224 × 224 input scaled to `[0,1]`, output `output0` with eight class probabilities. Model card label order: `battery`, `biological`, `cardboard`, `glass`, `metal`, `paper`, `plastic`, `trash`.

Verified ONNX SHA-256: `2b46d491091dbc0ed98a0f1eaee7fe5739c8fd3eb5bd5935396c3b2712e1f7a6`.

The model card reports 94.4% validation top-1 accuracy on its custom office/public-kiosk dataset. This is the publisher's reported result and has not been independently evaluated by BinGo.
