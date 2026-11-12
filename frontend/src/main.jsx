import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  ShieldCheck, FileUp, LayoutDashboard, History, Settings, FileText,
  AlertTriangle, CheckCircle2, XCircle, Download, RefreshCw, Sparkles,
  ChevronRight, MessageCircle, GitCompareArrows, Send, Bot, User, BookOpen
} from "lucide-react";
import "./style.css";

const API = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

function App() {
  const [tab, setTab] = useState("Overview");
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [chatBusy, setChatBusy] = useState(false);
  const [firstFile, setFirstFile] = useState(null);
  const [secondFile, setSecondFile] = useState(null);
  const [comparison, setComparison] = useState(null);
  const [compareBusy, setCompareBusy] = useState(false);
  const [compareError, setCompareError] = useState("");

  async function loadHistory() {
    try {
      const res = await fetch(`${API}/api/assessments`);
      if (res.ok) setHistory((await res.json()).items || []);
    } catch {}
  }
  useEffect(() => { loadHistory(); }, []);

  async function analyze() {
    if (!file) return;
    setBusy(true); setError(""); setResult(null); setMessages([]);
    const body = new FormData(); body.append("file", file);
    try {
      const res = await fetch(`${API}/api/analyze`, { method: "POST", body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Analysis failed");
      setResult(data); await loadHistory();
    } catch (e) { setError(e.message || "Could not connect to the API. Is FastAPI running?"); }
    finally { setBusy(false); }
  }

  async function askQuestion(e) {
    e?.preventDefault();
    if (!question.trim() || !result?.document_id) return;
    const q = question.trim();
    setMessages(prev => [...prev, { role: "user", text: q }]);
    setQuestion(""); setChatBusy(true);
    try {
      const res = await fetch(`${API}/api/chat`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ document_id: result.document_id, question: q })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Question failed");
      setMessages(prev => [...prev, { role: "assistant", text: data.answer, sources: data.sources, grounded: data.grounded }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: "assistant", text: e.message }]);
    } finally { setChatBusy(false); }
  }

  async function compareDocs() {
    if (!firstFile || !secondFile) return;
    setCompareBusy(true); setCompareError(""); setComparison(null);
    const body = new FormData(); body.append("first", firstFile); body.append("second", secondFile);
    try {
      const res = await fetch(`${API}/api/compare`, { method: "POST", body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Comparison failed");
      setComparison(data);
    } catch (e) { setCompareError(e.message || "Could not compare documents."); }
    finally { setCompareBusy(false); }
  }

  function exportReport() {
    if (!result) return;
    const lines = [
      "AI DOCUMENT INTELLIGENCE — ASSESSMENT REPORT",
      `Document: ${result.filename}`, `Risk score: ${result.risk_score}/100`,
      `Risk level: ${result.risk_level}`, "", result.summary, "",
      "DOCUMENT SUMMARY", result.document_summary?.summary || "", "",
      ...result.findings.map(f => `${f.status === "potential_gap" ? "[POTENTIAL GAP]" : "[EVIDENCE FOUND]"} ${f.title}\nEvidence: ${f.evidence || "No matching evidence found"}\nRecommendation: ${f.recommendation}`),
      "", `Disclaimer: ${result.disclaimer}`
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a");
    a.href = url; a.download = "assessment-report.txt"; a.click(); URL.revokeObjectURL(url);
  }

  const gaps = result?.findings.filter(f => f.status === "potential_gap").length ?? 0;
  const nav = [
    ["Overview", LayoutDashboard], ["Chat with document", MessageCircle],
    ["Compare documents", GitCompareArrows], ["Assessment history", History], ["Settings", Settings]
  ];

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-icon"><ShieldCheck size={21}/></div><div><b>clarity<span>ai</span></b><small>DOCUMENT INTELLIGENCE</small></div></div>
      <div className="workspace"><span className="workspace-dot"/> PERSONAL WORKSPACE <ChevronRight size={14}/></div>
      <div className="nav-label">WORKSPACE</div>
      {nav.map(([label, Icon]) => <button key={label} className={`nav-item ${tab===label?"active":""}`} onClick={()=>setTab(label)}><Icon size={18}/> {label}</button>)}
      <div className="sidebar-bottom"><div className="avatar">AI</div><div><b>Demo workspace</b><small>Local prototype</small></div><span className="online-dot"/></div>
    </aside>

    <main className="main">
      <header className="topbar"><div className="crumb">Workspace <ChevronRight size={14}/> <b>{tab}</b></div><div className="top-actions"><span className="status"><i/> API prototype</span><div className="avatar small">AI</div></div></header>
      <div className="content">
        {tab === "Overview" && <>
          <div className="page-heading"><div><div className="eyebrow">AI GOVERNANCE WORKSPACE</div><h1>Document intelligence</h1><p>Summarize, question, compare and screen policy documents.</p></div><div className="date-chip"><Sparkles size={15}/> Responsible AI screening</div></div>
          <section className="welcome-banner"><div><div className="banner-tag"><span/> DOCUMENT ANALYSIS</div><h2>Make complex documents easier to understand.</h2><p>Upload a policy document to generate a summary, explore its contents, and screen for potential governance gaps.</p></div><div className="banner-art"><div className="art-orbit orbit-one"/><div className="art-orbit orbit-two"/><div className="art-shield"><ShieldCheck size={43}/></div></div></section>
          <div className="section-title"><div><h2>New assessment</h2><p>Start by uploading a PDF or TXT policy document.</p></div><span className="step-label">STEP 01 / 02</span></div>
          <section className="upload-panel">
            <div className="upload-zone"><input id="file" type="file" accept=".pdf,.txt,application/pdf,text/plain" onChange={e=>{setFile(e.target.files?.[0]||null);setError("");}}/>
              <label htmlFor="file" className="upload-label"><div className="upload-icon"><FileUp size={23}/></div><b>{file ? file.name : "Choose a document to analyze"}</b><span>{file ? `${(file.size/1024).toFixed(1)} KB · Ready to analyze` : "Browse a PDF or TXT file from your device"}</span><em>PDF or TXT · Maximum 8 MB</em><strong>Browse files</strong></label></div>
            <div className="upload-footer"><span><ShieldCheck size={15}/> Processed by your local backend</span><button className="primary" disabled={!file||busy} onClick={analyze}>{busy ? <><RefreshCw className="spin" size={16}/> Analyzing...</> : <><Sparkles size={16}/> Analyze document</>}</button></div>
            {error && <div className="error"><AlertTriangle size={16}/>{error}</div>}
          </section>
          {result ? <section className="results">
            <div className="section-title"><div><h2>Assessment results</h2><p>{result.filename} · {new Date(result.created_at).toLocaleString()}</p></div><button className="secondary" onClick={exportReport}><Download size={15}/> Export report</button></div>
            <div className="metrics">
              <div className="metric-card"><span>OVERALL RISK SCORE</span><div className="metric-value">{result.risk_score}<small>/100</small></div><div className={`risk-pill ${result.risk_level.toLowerCase()}`}>{result.risk_level} risk</div></div>
              <div className="metric-card"><span>POTENTIAL GAPS</span><div className="metric-value">{gaps}<small> / {result.findings.length}</small></div><p>Areas flagged for review</p></div>
              <div className="metric-card"><span>AREAS SCREENED</span><div className="metric-value">{result.findings.length}</div><p>Governance categories</p></div>
            </div>
            <div className="panel summary-panel"><div className="summary-icon"><Sparkles size={18}/></div><div><b>Screening summary</b><p>{result.summary}</p></div></div>
            <div className="panel document-summary"><div className="summary-heading"><BookOpen size={17}/><b>Document summary</b></div><p>{result.document_summary?.summary}</p><div className="key-points">{(result.document_summary?.key_points||[]).map((p,i)=><div key={i}><span>{i+1}</span>{p}</div>)}</div></div>
            <div className="quick-actions"><button className="secondary" onClick={()=>setTab("Chat with document")}><MessageCircle size={15}/> Ask this document</button><button className="secondary" onClick={()=>setTab("Compare documents")}><GitCompareArrows size={15}/> Compare another document</button></div>
            <div className="section-title findings-title"><div><h2>Governance findings</h2><p>Evidence excerpts and recommendations for human review.</p></div></div>
            <div className="findings">{result.findings.map(f=><div className="finding" key={f.id}><div className={`finding-status ${f.status}`}>{f.status==="potential_gap"?<XCircle size={18}/>:<CheckCircle2 size={18}/>}</div><div className="finding-body"><b>{f.title}</b><p>{f.status==="potential_gap"?"No matching evidence terms found in the extracted text.":"Related evidence term found in the extracted text."}</p>{f.evidence && <blockquote className="evidence">“{f.evidence}”</blockquote>}<div className="recommendation"><strong>Suggested next step</strong><span>{f.recommendation}</span></div></div><span className={`finding-tag ${f.status}`}>{f.status==="potential_gap"?"Potential gap":"Evidence found"}</span></div>)}</div>
            <div className="disclaimer"><AlertTriangle size={16}/><span>{result.disclaimer}</span></div>
          </section> : <div className="empty-state"><div className="empty-illustration"><FileText size={28}/></div><b>Your analysis will appear here</b><p>Upload a document to generate a summary, governance findings and recommendations.</p></div>}
        </>}

        {tab === "Chat with document" && <section className="feature-page">
          <div className="page-heading"><div><div className="eyebrow">DOCUMENT Q&A</div><h1>Chat with your document</h1><p>Ask questions and inspect relevant passages from your latest analyzed document.</p></div></div>
          {!result ? <div className="empty-state"><MessageCircle size={28}/><b>No analyzed document selected</b><p>Go to Overview, upload a PDF or TXT file, and click Analyze document first.</p><button className="primary" onClick={()=>setTab("Overview")}>Go to overview</button></div> :
            <div className="chat-panel"><div className="chat-context"><FileText size={17}/><div><b>{result.filename}</b><small>Answers are retrieved from this document's extracted text.</small></div><span className="risk-pill low">Document loaded</span></div>
              <div className="chat-messages">{messages.length===0 && <div className="chat-empty"><div className="bot-orb"><Bot size={26}/></div><b>Ask a question about your document</b><p>Try: “What does this document say about human oversight?”</p><div className="suggested-questions">{["What is the purpose of this document?","What does it say about privacy?","Are human review procedures mentioned?"].map(q=><button key={q} onClick={()=>setQuestion(q)}>{q}</button>)}</div></div>}
                {messages.map((m,i)=><div className={`message ${m.role}`} key={i}><div className="message-avatar">{m.role==="user"?<User size={15}/>:<Bot size={16}/>}</div><div className="message-content"><b>{m.role==="user"?"You":"Document assistant"}</b><p>{m.text}</p>{m.sources?.map((s,j)=><blockquote className="source-quote" key={j}>Source {j+1}: {s}</blockquote>)}</div></div>)}
                {chatBusy && <div className="message assistant"><div className="message-avatar"><Bot size={16}/></div><div className="message-content"><b>Document assistant</b><p>Finding relevant passages...</p></div></div>}
              </div>
              <form className="chat-input" onSubmit={askQuestion}><input value={question} onChange={e=>setQuestion(e.target.value)} placeholder="Ask something about this document..." /><button className="primary" disabled={!question.trim()||chatBusy}><Send size={16}/> Send</button></form>
              <div className="chat-note">Prototype retrieval uses keyword overlap, not a generative LLM. Answers are grounded in matching excerpts.</div>
            </div>}
        </section>}

        {tab === "Compare documents" && <section className="feature-page">
          <div className="page-heading"><div><div className="eyebrow">DOCUMENT DIFF</div><h1>Compare documents</h1><p>Compare two policy files for governance-topic coverage and text similarity.</p></div></div>
          <div className="compare-upload-grid">
            {[{label:"First document",value:firstFile,set:setFirstFile,id:"first"},{label:"Second document",value:secondFile,set:setSecondFile,id:"second"}].map(item=><div className="compare-upload" key={item.id}><FileUp size={22}/><b>{item.label}</b><span>{item.value?.name||"Choose PDF or TXT file"}</span><input id={item.id} type="file" accept=".pdf,.txt" onChange={e=>item.set(e.target.files?.[0]||null)}/><label htmlFor={item.id}>Browse files</label></div>)}
          </div>
          <button className="primary compare-button" disabled={!firstFile||!secondFile||compareBusy} onClick={compareDocs}>{compareBusy?<><RefreshCw className="spin" size={16}/> Comparing...</>:<><GitCompareArrows size={16}/> Compare documents</>}</button>
          {compareError && <div className="error">{compareError}</div>}
          {comparison && <div className="comparison-results"><div className="metrics"><div className="metric-card"><span>TEXT SIMILARITY</span><div className="metric-value">{comparison.similarity_percent}<small>%</small></div><p>Approximate character-level similarity</p></div><div className="metric-card"><span>TOPICS ADDED IN SECOND</span><div className="metric-value">{comparison.topic_changes.filter(x=>x.status==="added_in_second").length}</div></div><div className="metric-card"><span>MISSING IN SECOND</span><div className="metric-value">{comparison.topic_changes.filter(x=>x.status==="missing_in_second").length}</div></div></div>
            <div className="panel"><div className="summary-heading"><GitCompareArrows size={17}/><b>Governance topic comparison</b></div>{comparison.topic_changes.map(row=><div className="compare-row" key={row.topic}><b>{row.topic}</b><span className={`compare-status ${row.status}`}>{row.status==="added_in_second"?"Added in second":row.status==="missing_in_second"?"Not detected in second":row.status==="present_in_both"?"Detected in both":"Not detected"}</span></div>)}<p className="compare-disclaimer">{comparison.summary}</p></div>
          </div>}
        </section>}

        {tab === "Assessment history" && <><div className="page-heading"><div><div className="eyebrow">YOUR WORKSPACE</div><h1>Assessment history</h1><p>Previously analyzed documents stored on this machine.</p></div><button className="secondary" onClick={loadHistory}><RefreshCw size={15}/> Refresh</button></div><div className="panel history-list">{history.length ? history.map(item=><div className="history-row" key={item.id}><div className="file-icon"><FileText size={19}/></div><div className="history-name"><b>{item.filename}</b><small>{new Date(item.created_at).toLocaleString()}</small></div><span className={`risk-pill ${item.risk_level.toLowerCase()}`}>{item.risk_level} risk</span><b className="score-mini">{item.risk_score}/100</b></div>) : <div className="empty">No assessments yet. Analyze a document to see it here.</div>}</div></>}

        {tab === "Settings" && <><div className="page-heading"><div><div className="eyebrow">PREFERENCES</div><h1>Settings & limitations</h1><p>Prototype configuration and transparency notes.</p></div></div><div className="panel settings"><h3>API connection</h3><p>{API}</p><h3>Document processing</h3><p>PDF text extraction uses PyMuPDF. Scanned-PDF OCR is not currently included.</p><h3>Analysis approach</h3><p>Summaries use extractive sentence ranking. Q&A retrieves keyword-relevant passages. Risk screening uses transparent keyword rules. These features do not call an external LLM.</p><h3>Data storage</h3><p>Assessment history and the latest 20 extracted documents are stored locally as JSON files by the backend. Do not upload confidential documents to this demo.</p><h3>Responsible use</h3><p>Results are preliminary screening signals, not legal advice or proof of compliance. A qualified human must review all findings.</p></div></>}
        <footer>ClarityAI · Portfolio prototype <span>Not legal advice · Human review required</span></footer>
      </div>
    </main>
  </div>;
}

createRoot(document.getElementById("root")).render(<App />);
