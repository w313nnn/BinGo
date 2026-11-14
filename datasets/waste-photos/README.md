# BinGo photo dataset

## Collect photos

Ask volunteers to take and share ordinary phone photos for BinGo model testing and improvement. Explain that participation is optional and who can access the photos. Keep originals in a restricted folder. Copy only approved photos into this kit. Leave out faces, addresses, shipping labels, number plates and other identifying details. Strip GPS and other unnecessary metadata from shared copies, preserving the displayed orientation. Keep participant names and consent records outside the dataset.

Use both BinGo paths during testing: Take photo and Upload. Ask volunteers for one waste item per photo, taken as they normally would. Gather examples from different phones, homes, lighting and backgrounds. Include dirty, crushed and partly hidden items. Photograph different physical items, especially lookalikes such as clear glass and clear plastic. Keep photos with multiple items, unrelated subjects, unsupported materials or unusable views for a separate rejection check.

Start with 10–20 distinct physical items per class as a pilot. A few different photos of each item help test consistency, but the item is still one independent example. Grow the dataset after reviewing which classes and conditions are missing.

## Label the photos

1. Copy an approved JPG, PNG or WebP photo to photos/. Use anonymous filenames such as p0001.jpg.
2. Add one JSON record per line to labels.jsonl. Start with one of these shapes:

       {"photo":"photos/p0001.jpg","item_id":"item001","session_id":"session001","source":"upload","label":"plastic","split":"train"}
       {"photo":"photos/p0002.jpg","item_id":"item002","session_id":"session002","source":"camera","label":"reject","split":"test"}

3. Set source to the BinGo path used for that photo. Reuse item_id for every view of the same physical item and session_id for all photos from the same capture session. Use anonymous IDs. Any photos linked by item or session must stay in the same split. The example rows are illustrative.
4. Have a second person check the photo label without seeing BinGo's prediction. Resolve disagreements by checking the actual object or its packaging. Mark it reject if its material still cannot be determined.

| Label | Use it for |
| --- | --- |
| battery | A standalone household battery |
| biological | Food scraps and identifiable organic waste |
| cardboard | Corrugated boxes and visibly stiff paperboard |
| glass | Identifiable glass bottles and jars |
| metal | Metal cans, foil and other clearly identifiable metal waste |
| paper | Newspaper, office paper and other clearly identifiable paper |
| plastic | Clearly identifiable plastic bottles, tubs and bags |
| trash | Recognizable residual waste such as used tissues |
| reject | Mixed materials without a clear primary material, several items, unsupported waste, non-waste or unusable photos |

These labels describe what the image shows. Local disposal rules are a separate decision. Use reject for a confusing or unsupported photo instead of guessing trash.

## Verify and measure

From this folder, run python check_dataset.py. The checker verifies filenames, labels, splits, and exact duplicate files. It also flags any physical item or session that crosses splits. Review near-duplicates and label quality by hand.

Assign whole groups to train, validation or test. A starting allocation is 70/15/15 by group. Aim for all eight classes and both capture paths in the test set. Reserve some contributors entirely for testing if possible. Use train for fine-tuning, validation for choosing the model and cutoff, and lock test labels before tuning. Keep a fresh test set for the later 99% milestone.

Run the current BinGo scanner as a baseline. For supported test photos, report raw top-1 accuracy over all photos and separately report correct suggestions divided by all photos, suggestion accuracy among photos that receive one, and coverage. Count mistakes and abstentions explicitly. For reject photos, report how often BinGo mistakenly suggests a class. Break results down by material and by camera versus upload. Use confidence intervals that account for repeated views of the same item.

Treat the pilot as a way to find mistakes. Before claiming 95%, expand to hundreds of independent held-out items, check the accuracy and confidence interval, and inspect weak classes and both capture paths. Fine-tune on training photos that reflect the mistakes, then verify the exported browser model on the locked test set.
