from app.document_tools import summarize, answer_question, compare_documents

def test_summary_returns_points():
    result = summarize("Privacy is important. The system uses encryption. Human review is required.")
    assert "summary" in result
    assert isinstance(result["key_points"], list)

def test_question_retrieves_matching_passage():
    text = "Privacy notice\n\nThe organization collects personal data and obtains consent before processing applicant information."
    result = answer_question(text, "What does it say about privacy and consent?")
    assert result["grounded"] is True
    assert result["sources"]

def test_compare_detects_topic_presence():
    result = compare_documents("Privacy notice and encryption.", "Privacy notice and human oversight.")
    assert result["similarity_percent"] >= 0
    assert any(x["topic"] == "Human oversight" and x["status"] == "added_in_second" for x in result["topic_changes"])
