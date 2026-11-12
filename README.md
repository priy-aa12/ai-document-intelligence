# AI Document Intelligence & Risk Analyzer

A portfolio prototype demonstrating a Python API and React interface for document intelligence and preliminary AI governance screening.

## Features
- Upload PDF or TXT documents (up to 8 MB)
- Extract text using PyMuPDF
- Generate an extractive summary and key points
- Ask questions and retrieve relevant passages from an analyzed document
- Screen six governance areas: privacy, security, transparency, human oversight, retention, and fairness
- Show evidence excerpts and remediation suggestions
- Compare two documents for governance-topic coverage and approximate text similarity
- Store assessment history and extracted text locally
- Export an assessment report as TXT

## Important implementation note
This version does **not** call a generative AI/LLM service. Summarization is extractive, document Q&A uses keyword-based passage retrieval, comparison uses selected terms and text similarity, and risk scoring is rule-based. This keeps the prototype runnable without API keys and makes the logic inspectable. Do not describe these features as LLM-powered until an LLM integration is implemented and tested.

This is a demonstrator, not legal advice or a certified compliance assessment. Results require human review.

## Stack
- Backend: Python, FastAPI, Pydantic
- PDF parsing: PyMuPDF
- Frontend: React, Vite, Lucide icons, CSS
- Prototype storage: local JSON files

## Run locally

### Backend (Windows PowerShell)
```powershell
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```
API docs: http://127.0.0.1:8000/docs

### Frontend (second terminal)
```powershell
cd frontend
npm install
npm run dev
```
Open the URL printed by Vite (usually http://localhost:5173).

## Demo
1. Analyze `sample_documents/ai_resume_screening_policy.txt`.
2. Review the document summary and governance findings.
3. Open **Chat with document** and ask about privacy or human oversight.
4. Open **Compare documents**, upload two different policy TXT/PDF files, and compare governance-topic coverage.

## Known limitations
- Scanned PDF OCR is not included.
- Q&A is retrieval-only and does not synthesize a natural-language answer using an LLM.
- Governance checks are keyword heuristics and may miss relevant controls or flag wording that is not substantive evidence.
- Local JSON storage is for demonstration only; use a database and access controls for real deployments.
- No authentication, tenant isolation, or production security hardening is included.

## Resume wording (only after you have run, tested, and understood it)
**AI Document Intelligence & Risk Analyzer** — Built a full-stack document analysis prototype using Python, FastAPI, and React. Implemented PDF/TXT ingestion, extractive summarization, keyword-based document Q&A, governance risk screening with evidence excerpts, document comparison, and report export through REST APIs.
