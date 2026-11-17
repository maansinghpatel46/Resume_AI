import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api, { errMsg } from "../api";
import Navbar from "../components/Navbar";
import Spinner from "../components/Spinner";

export default function AiCareerTools({ mode = "matcher" }) {
  const [resumes, setResumes] = useState(null);
  const [resumeId, setResumeId] = useState("");
  const [resume, setResume] = useState(null);
  const [jobDescription, setJobDescription] = useState("");
  const [company, setCompany] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/resumes")
      .then(({ data }) => {
        setResumes(data.resumes);
        if (data.resumes[0]) setResumeId(data.resumes[0]._id);
      })
      .catch((e) => {
        setError(errMsg(e));
        setResumes([]);
      });
  }, []);
  useEffect(() => {
    if (!resumeId) {
      setResume(null);
      return;
    }
    api
      .get(`/resumes/${resumeId}`)
      .then(({ data }) => setResume(data.resume))
      .catch((e) => setError(errMsg(e)));
  }, [resumeId]);

  const run = async (e) => {
    e.preventDefault();
    setError("");
    setResult(null);
    setLoading(true);
    try {
      const path =
        mode === "matcher"
          ? "/ai/match"
          : mode === "interview"
            ? "/ai/interview-questions"
            : "/ai/cover-letter";
      const payload = {
        resume,
        jobDescription,
        ...(mode === "cover" ? { company } : {}),
      };
      const { data } = await api.post(path, payload);
      setResult(data.result);
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setLoading(false);
    }
  };
  const title =
    mode === "matcher"
      ? "AI Job Matcher"
      : mode === "interview"
        ? "AI Interview Questions"
        : "Cover Letter Generator";
  if (resumes === null)
    return (
      <>
        <Navbar />
        <Spinner />
      </>
    );
  return (
    <>
      <Navbar />
      <main className="container tool-page">
        <div className="tool-heading">
          <div>
            <Link to="/dashboard" className="back-link">
              ← Dashboard
            </Link>
            <p className="eyebrow">AI CAREER TOOLS</p>
            <h1>{title}</h1>
            <p className="muted">
              Use your saved resume to generate role-specific career insights.
            </p>
          </div>
        </div>
        {error && <div className="alert alert-error">{error}</div>}
        {resumes.length === 0 ? (
          <div className="panel empty">
            <h3>Create a resume first</h3>
            <p>You need at least one saved resume to use this tool.</p>
            <Link to="/dashboard" className="btn btn-primary">
              Go to dashboard
            </Link>
          </div>
        ) : (
          <form className="panel tool-form" onSubmit={run}>
            <label className="field">
              <span>Select resume</span>
              <select
                value={resumeId}
                onChange={(e) => {
                  setResumeId(e.target.value);
                  setResult(null);
                }}
                required
              >
                <option value="">Choose a resume</option>
                {(resumes || []).map((r) => (
                  <option key={r._id} value={r._id}>
                    {r.title}
                  </option>
                ))}
              </select>
            </label>
            {mode === "cover" && (
              <label className="field">
                <span>Company name (optional)</span>
                <input
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Company name"
                  maxLength={150}
                />
              </label>
            )}
            <label className="field">
              <span>
                Job description {mode === "interview" ? "(optional)" : ""}
              </span>
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                rows={8}
                maxLength={8000}
                placeholder="Paste the job description here..."
                required={mode !== "interview"}
                minLength={mode !== "interview" ? 30 : undefined}
              />
            </label>
            <button className="btn btn-primary" disabled={loading || !resume}>
              {loading
                ? "Generating…"
                : mode === "matcher"
                  ? "Match my resume"
                  : mode === "interview"
                    ? "Generate questions"
                    : "Generate cover letter"}
            </button>
          </form>
        )}
        {loading && <Spinner />}
        {result && (
          <section className="panel tool-result">
            <h2>
              {mode === "matcher"
                ? `Resume match: ${result.score}%`
                : mode === "interview"
                  ? "Your interview question set"
                  : "Your cover letter"}
            </h2>
            {mode === "matcher" && (
              <>
                <ResultList
                  title="Matched keywords"
                  items={result.matchedKeywords}
                />
                <ResultList
                  title="Missing keywords"
                  items={result.missingKeywords}
                />
                <ResultList title="Strengths" items={result.strengths} />
                <ResultList title="Gaps" items={result.gaps} />
                <ResultList
                  title="Recommendations"
                  items={result.recommendations}
                />
              </>
            )}
            {mode === "interview" &&
              (result.questions || []).map((q, i) => (
                <article className="question-card" key={i}>
                  <span className="tag">{q.category}</span>
                  <h3>
                    {i + 1}. {q.question}
                  </h3>
                  {q.why && <p className="muted">{q.why}</p>}
                  <ResultList title="Answer tips" items={q.answerTips} />
                </article>
              ))}
            {mode === "cover" && (
              <>
                <textarea
                  className="generated-letter"
                  readOnly
                  value={result}
                  rows={18}
                />
                <button
                  className="btn btn-outline"
                  onClick={() => navigator.clipboard.writeText(result)}
                >
                  Copy cover letter
                </button>
              </>
            )}
          </section>
        )}
      </main>
    </>
  );
}
function ResultList({ title, items = [] }) {
  return (
    <div className="result-list">
      <h3>{title}</h3>
      {items.length ? (
        <ul>
          {items.map((x, i) => (
            <li key={i}>{x}</li>
          ))}
        </ul>
      ) : (
        <p className="muted">No items returned.</p>
      )}
    </div>
  );
}
