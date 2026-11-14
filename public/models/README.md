# WasteWise browser classifier

The `wastewise-garbage-cls.onnx` file is the unmodified `wastewise-yolo.onnx` artifact from [SriramRokkam/wastewise-garbage-cls](https://huggingface.co/SriramRokkam/wastewise-garbage-cls), licensed under Apache-2.0. The accompanying `LICENSE-2.0.txt` contains the license text.

Model card: YOLOv8n-cls, ONNX opset 17, RGB 224 × 224 input scaled to `[0,1]`, output `output0` with eight class probabilities. Model card label order: `battery`, `biological`, `cardboard`, `glass`, `metal`, `paper`, `plastic`, `trash`.

Verified ONNX SHA-256: `2b46d491091dbc0ed98a0f1eaee7fe5739c8fd3eb5bd5935396c3b2712e1f7a6`.

The model card reports 94.4% validation top-1 accuracy on its custom office/public-kiosk dataset. This is the publisher's reported result and has not been independently evaluated by BinGo.

## Measuring BinGo accuracy

The scanner classifies one item per photo into the eight model classes. Build a labeled set from photos taken by BinGo users. Users can take or upload photos without labels in the app. For evaluation, collect consented photos and have reviewers assign the expected material independently of the scanner. Include different phones, backgrounds, lighting, item shapes, dirty or crushed items, and confusing materials. Keep mixed-item, unsupported and empty photos in a separate rejection test set. Split by physical item and capture session so near-duplicate photos cannot cross training, validation and test sets.

Exercise both Take photo and Upload on real phones, including portrait and landscape captures. Run the shipped browser model on the test photos and record the expected label, raw top prediction and score, and whether the scanner offered a suggestion. Report top-1 accuracy on every supported test photo, counting every wrong prediction, including rejected ones. Separately report suggestion accuracy, percentage of photos receiving suggestions, per-class results, a confusion matrix, and confidence intervals. The provisional 0.70 score cutoff is a UI decision, not a measured probability of being correct. Check unsupported-photo false accepts separately.

For the initial 95% target, measure the baseline, use training photos to fine-tune on BinGo materials, and use validation photos to compare models and tune the cutoff. Evaluate the exported browser model on held-out photos before claiming 95%. For 99%, collect more examples of the remaining mistakes and verify on a fresh held-out set. Track phone inference latency alongside accuracy.
