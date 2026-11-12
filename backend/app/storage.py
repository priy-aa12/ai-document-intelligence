import json
from pathlib import Path

BASE = Path(__file__).resolve().parent.parent
DATA_FILE = BASE / "assessments.json"
DOCS_FILE = BASE / "documents.json"

def _read(path):
    if not path.exists():
        return []
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return []

def list_assessments():
    return _read(DATA_FILE)

def save_assessment(item: dict):
    items = list_assessments()
    items.insert(0, item)
    DATA_FILE.write_text(json.dumps(items[:50], indent=2), encoding="utf-8")

def save_document(doc_id: str, filename: str, text: str):
    docs = _read(DOCS_FILE)
    docs = [d for d in docs if d.get("id") != doc_id]
    docs.insert(0, {"id": doc_id, "filename": filename, "text": text})
    DOCS_FILE.write_text(json.dumps(docs[:20], indent=2), encoding="utf-8")

def get_document(doc_id: str):
    return next((d for d in _read(DOCS_FILE) if d.get("id") == doc_id), None)
