from pathlib import Path
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from .analyzer import analyze_document
from .document_tools import summarize, answer_question, compare_documents
from .storage import save_assessment, list_assessments, save_document, get_document

app = FastAPI(title="AI Document Intelligence API", description="Document summarization, grounded Q&A, comparison and governance screening.", version="2.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True, allow_methods=["*"], allow_headers=["*"],
)
MAX_BYTES = 8 * 1024 * 1024
ALLOWED_TYPES = {".pdf", ".txt"}

class ChatRequest(BaseModel):
    document_id: str
    question: str

def extract_text(filename: str, raw: bytes):
    suffix = Path(filename or "").suffix.lower()
    if suffix not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail="Only PDF and TXT files are supported.")
    if not raw:
        raise HTTPException(status_code=400, detail="The uploaded file is empty.")
    if len(raw) > MAX_BYTES:
        raise HTTPException(status_code=413, detail="File is too large. Maximum size is 8 MB.")
    try:
        if suffix == ".pdf":
            import fitz
            doc = fitz.open(stream=raw, filetype="pdf")
            text = "\n".join(page.get_text() for page in doc)
            doc.close()
        else:
            text = raw.decode("utf-8-sig")
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Could not read document: {exc}")
    if len(text.strip()) < 30:
        raise HTTPException(status_code=422, detail="Not enough extractable text. Scanned PDF OCR is not included yet.")
    return text

@app.get("/")
def home():
    return {"message": "AI Document Intelligence API is running", "version": "2.0.0"}

@app.get("/api/health")
def health():
    return {"status": "healthy"}

@app.post("/api/analyze")
async def analyze(file: UploadFile = File(...)):
    text = extract_text(file.filename or "uploaded-document", await file.read())
    result = analyze_document(text, file.filename or "uploaded-document")
    result["document_id"] = result["id"]
    result["document_summary"] = summarize(text)
    save_assessment(result)
    save_document(result["id"], result["filename"], text)
    return result

@app.post("/api/chat")
def chat(payload: ChatRequest):
    if not payload.question.strip():
        raise HTTPException(status_code=400, detail="Please enter a question.")
    doc = get_document(payload.document_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found. Upload and analyze it again.")
    return {"filename": doc["filename"], **answer_question(doc["text"], payload.question)}

@app.post("/api/compare")
async def compare(first: UploadFile = File(...), second: UploadFile = File(...)):
    text_a = extract_text(first.filename or "first-document", await first.read())
    text_b = extract_text(second.filename or "second-document", await second.read())
    return {
        "first_filename": first.filename, "second_filename": second.filename,
        **compare_documents(text_a, text_b)
    }

@app.get("/api/assessments")
def assessments():
    return {"items": list_assessments()}
