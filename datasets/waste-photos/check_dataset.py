"""Validate the BinGo photo manifest using only the Python standard library."""
import hashlib
import json
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parent
LABELS = set("battery biological cardboard glass metal paper plastic trash reject".split())
SPLITS = {"train", "validation", "test"}
SOURCES = {"camera", "upload"}


def main():
    errors = []
    assignments = {}
    counts = Counter()
    seen_paths = set()
    for number, line in enumerate((ROOT / "labels.jsonl").read_text(encoding="utf-8-sig").splitlines(), 1):
        if not line.strip():
            continue
        try:
            row = json.loads(line)
            fields = ("photo", "item_id", "session_id", "source", "label", "split")
            if not isinstance(row, dict) or any(
                not isinstance(row.get(key), str) or not row[key].strip()
                for key in fields
            ):
                raise ValueError("all six required fields must be non-empty strings")
            if row["label"] not in LABELS or row["split"] not in SPLITS or row["source"] not in SOURCES:
                raise ValueError("unknown label, split or source")
            photo = (ROOT / row["photo"]).resolve()
            if not photo.is_relative_to(ROOT / "photos") or photo.suffix.lower() not in {".jpg", ".jpeg", ".png", ".webp"}:
                raise ValueError("photo must be a JPG, PNG or WebP inside photos/")
            if photo in seen_paths:
                raise ValueError("photo already listed")
            digest = hashlib.sha256(photo.read_bytes()).hexdigest()
            for kind, value in (("item", row["item_id"]), ("session", row["session_id"]), ("file hash", digest)):
                previous = assignments.setdefault((kind, value), row["split"])
                if previous != row["split"]:
                    errors.append(f"Line {number}: {kind} appears in {previous} and {row['split']}")
            seen_paths.add(photo)
            counts[row["split"], row["label"], row["source"]] += 1
        except (ValueError, OSError) as error:
            errors.append(f"Line {number}: {error}")

    for error in errors:
        print(error)
    for (split, label, source), count in sorted(counts.items()):
        print(f"{split:10} {label:12} {source:6} {count}")
    if not counts and not errors:
        print("No photos labeled yet. Follow README.md to add your first batch.")
    elif not errors:
        print(f"Validated {sum(counts.values())} photo records.")
    return int(bool(errors))


if __name__ == "__main__":
    raise SystemExit(main())
