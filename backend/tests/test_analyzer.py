from app.analyzer import analyze_document

def test_missing_controls_raise_risk():
    result = analyze_document("A short description of an AI tool.", "test.txt")
    assert result["risk_score"] == 100
    assert result["risk_level"] == "High"

def test_controls_reduce_risk():
    text = """
    Privacy notice and personal data are documented. Encryption and access control
    are required. Human oversight and human review are available. The retention
    period and data deletion process are defined. Fairness and bias are evaluated.
    Explainability and transparency are documented.
    """
    result = analyze_document(text, "policy.txt")
    assert result["risk_score"] == 0
    assert result["risk_level"] == "Low"
