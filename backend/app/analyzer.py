import re
from datetime import datetime, timezone

CHECKS = [
    {"id":"privacy","title":"Privacy notice and personal data handling","patterns":[r"\bprivacy notice\b",r"\bpersonal data\b",r"\bdata subject\b",r"\bconsent\b"],"weight":20,"recommendation":"Document what personal data is collected, why it is used, the applicable lawful basis or consent, and user rights."},
    {"id":"security","title":"Data security controls","patterns":[r"\bencryption\b",r"\baccess control\b",r"\bauthentication\b",r"\bsecurity control"],"weight":20,"recommendation":"Specify encryption, access controls, authentication, secure storage, and incident response procedures."},
    {"id":"transparency","title":"Transparency and explainability","patterns":[r"\bexplainab",r"\btransparen",r"\bdisclos",r"\buser notification\b"],"weight":15,"recommendation":"Explain when AI is used, its intended purpose, important limitations, and how decisions can be challenged."},
    {"id":"human_oversight","title":"Human oversight and escalation","patterns":[r"\bhuman oversight\b",r"\bhuman review\b",r"\bmanual review\b",r"\bescalation\b"],"weight":15,"recommendation":"Define when a qualified person reviews outputs, overrides decisions, and handles appeals or escalations."},
    {"id":"retention","title":"Data retention and deletion","patterns":[r"\bretention period\b",r"\bdata deletion\b",r"\bdelete data\b",r"\bretention policy\b"],"weight":15,"recommendation":"Set retention periods, deletion procedures, and rules for backups and third-party processors."},
    {"id":"fairness","title":"Bias and fairness evaluation","patterns":[r"\bfairness\b",r"\bbias\b",r"\bdisparate impact\b",r"\bdemographic group\b"],"weight":15,"recommendation":"Describe representative testing data, subgroup performance evaluation, bias monitoring, and mitigation."},
]

def _evidence(text, patterns):
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            start, end = max(0, match.start()-90), min(len(text), match.end()+150)
            return text[start:end].replace("\n", " ").strip()
    return ""

def analyze_document(text: str, filename: str) -> dict:
    score, findings = 0, []
    for check in CHECKS:
        evidence = _evidence(text, check["patterns"])
        present = bool(evidence)
        if not present:
            score += check["weight"]
        findings.append({
            "id": check["id"], "title": check["title"],
            "status": "evidence_found" if present else "potential_gap",
            "weight": check["weight"], "evidence": evidence,
            "recommendation": check["recommendation"],
        })
    score = min(score, 100)
    level = "Low" if score < 30 else "Medium" if score < 60 else "High"
    return {
        "id": datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S%f"),
        "filename": filename, "created_at": datetime.now(timezone.utc).isoformat(),
        "risk_score": score, "risk_level": level,
        "summary": f"Screening identified {sum(f['status']=='potential_gap' for f in findings)} potential gap(s) across {len(findings)} governance areas.",
        "findings": findings,
        "disclaimer": "Heuristic screening only. A missing keyword does not prove a control is absent, and a matching keyword does not prove a control is effective. Human review is required."
    }
