import re
from collections import Counter
from difflib import SequenceMatcher

STOPWORDS = {
    "the","and","for","that","with","this","from","are","was","were","have","has",
    "will","shall","can","could","should","would","into","about","your","their",
    "they","them","there","then","than","when","where","what","which","while",
    "who","how","why","not","but","all","any","our","its","you","are","a","an",
    "of","to","in","on","by","as","at","or","be","is","it","we","if","do","does"
}

def clean_text(text: str) -> str:
    return re.sub(r"[ \t]+", " ", re.sub(r"\n{3,}", "\n\n", text)).strip()

def split_sentences(text: str):
    return [s.strip() for s in re.split(r"(?<=[.!?])\s+|\n+", clean_text(text)) if len(s.strip()) > 25]

def summarize(text: str, max_sentences: int = 6):
    sentences = split_sentences(text)
    if not sentences:
        return {"summary": "No readable text was available to summarize.", "key_points": []}
    words = re.findall(r"\b[a-zA-Z][a-zA-Z'-]{2,}\b", text.lower())
    frequencies = Counter(w for w in words if w not in STOPWORDS)
    scored = []
    for index, sentence in enumerate(sentences):
        terms = re.findall(r"\b[a-zA-Z][a-zA-Z'-]{2,}\b", sentence.lower())
        score = sum(frequencies[t] for t in terms if t not in STOPWORDS) / max(len(terms), 1)
        scored.append((score, index, sentence))
    chosen = sorted(sorted(scored, reverse=True)[:max_sentences], key=lambda x: x[1])
    points = [item[2] for item in chosen]
    return {"summary": " ".join(points), "key_points": points}

def _tokens(text: str):
    return {w for w in re.findall(r"\b[a-zA-Z][a-zA-Z'-]{2,}\b", text.lower()) if w not in STOPWORDS}

def answer_question(text: str, question: str):
    paragraphs = [p.strip() for p in re.split(r"\n\s*\n", clean_text(text)) if len(p.strip()) > 35]
    if not paragraphs:
        paragraphs = split_sentences(text)
    q_tokens = _tokens(question)
    ranked = []
    for p in paragraphs:
        p_tokens = _tokens(p)
        overlap = len(q_tokens & p_tokens)
        if overlap:
            ranked.append((overlap / max(len(q_tokens), 1), p))
    ranked.sort(key=lambda x: x[0], reverse=True)
    if not ranked:
        return {
            "answer": "I couldn't find a relevant passage in this document to answer that question. Try asking about a topic or phrase that appears in the document.",
            "sources": [],
            "grounded": False
        }
    sources = [p for _, p in ranked[:3]]
    return {
        "answer": "Here are the most relevant passages I found. This answer is based only on text extracted from the uploaded document; it is not an independently verified conclusion.",
        "sources": sources,
        "grounded": True
    }

def compare_documents(text_a: str, text_b: str):
    topics = {
        "Privacy and personal data": ["privacy", "personal data", "consent", "data subject"],
        "Security controls": ["encryption", "access control", "authentication", "security"],
        "Transparency and explainability": ["transparency", "explainability", "disclosure", "notification"],
        "Human oversight": ["human oversight", "human review", "manual review", "escalation"],
        "Retention and deletion": ["retention", "deletion", "delete data"],
        "Bias and fairness": ["bias", "fairness", "disparate impact", "demographic"],
    }
    a, b = text_a.lower(), text_b.lower()
    topic_changes = []
    for label, terms in topics.items():
        a_found = [t for t in terms if t in a]
        b_found = [t for t in terms if t in b]
        if not a_found and b_found:
            status = "added_in_second"
        elif a_found and not b_found:
            status = "missing_in_second"
        elif a_found and b_found:
            status = "present_in_both"
        else:
            status = "not_detected"
        topic_changes.append({"topic": label, "status": status, "first_terms": a_found, "second_terms": b_found})
    ratio = SequenceMatcher(None, a[:50000], b[:50000]).ratio()
    return {
        "similarity_percent": round(ratio * 100),
        "topic_changes": topic_changes,
        "summary": "The comparison checks for selected governance-related terms and overall text similarity. It does not determine whether either document is legally compliant."
    }
