import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api, { errMsg } from "../api";
import Navbar from "../components/Navbar";
import Spinner from "../components/Spinner";

const labels = {
  content: "Content quality",
  keywords: "Keyword alignment",
  sections: "Section structure",
  readability: "Readability",
  completeness: "Completeness",
};

function ScoreRing({ value }) {
  const radius = 43;
  const circumference = 2 * Math.PI * radius;
  return (
    <div
      className="ats-score-ring"
      role="img"
      aria-label={`Estimated ATS readiness score: ${value} out of 100`}
    >
      <svg viewBox="0 0 110 110" aria-hidden="true">
        <circle className="ats-ring-track" cx="55" cy="55" r={radius} />
        <circle
          className="ats-ring-value"
          cx="55"
          cy="55"
          r={radius}
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - value / 100)}
        />
      </svg>
      <div>
        <strong>{value}</strong>
        <span>/100</span>
      </div>
    </div>
  );
}

function ResultList({ title, items, kind = "" }) {
  if (!items?.length) return null;
  return (
    <section className="ats-result-card">
      <h3>{title}</h3>
      <ul className={kind === "chips" ? "ats-chips" : "ats-list"}>
        {items.map((item, index) => (
          <li key={`${item}-${index}`}>{item}</li>
        ))}
      </ul>
    </section>
  );
}

export default function AtsChecker() {
  const [resumes, setResumes] = useState([]);
  const [resumeId, setResumeId] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [loadingResumes, setLoadingResumes] = useState(true);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  useEffect(() => {
    let active = true;
    api
      .get("/resumes")
      .then(({ data }) => {
        if (!active) return;
        const list = data.resumes || [];
        setResumes(list);
        if (list[0]) setResumeId(list[0]._id);
      })
      .catch((e) => active && setError(errMsg(e)))
      .finally(() => active && setLoadingResumes(false));
    return () => {
      active = false;
    };
  }, []);

  const runCheck = async (event) => {
    event.preventDefault();
    if (!resumeId) {
      setError("Please create a resume first.");
      return;
    }
    if (jobDescription.trim() && jobDescription.trim().length < 30) {
      setError(
        "Job description should contain at least 30 characters, or leave it empty for a general check.",
      );
      return;
    }
    setChecking(true);
    setError("");
    setResult(null);
    try {
      const [{ data: resumeData }] = await Promise.all([
        api.get(`/resumes/${resumeId}`),
      ]);
      const { data } = await api.post("/ai/ats-score", {
        resume: resumeData.resume,
        jobDescription: jobDescription.trim(),
      });
      setResult(data.result);
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setChecking(false);
    }
  };

  return (
    <>
      <Navbar />
      <main className="container ats-page">
        <div className="ats-heading">
          <div>
            <Link to="/dashboard" className="ats-back">
              ← Dashboard
            </Link>
            <p className="eyebrow">AI CAREER TOOL</p>
            <h1>ATS Score Checker</h1>
            <p className="muted">
              Check your resume content, keywords and section completeness
              before applying.
            </p>
          </div>
          <span className="ats-heading-icon" aria-hidden="true">
            ✦
          </span>
        </div>

        <form className="panel ats-form" onSubmit={runCheck}>
          <h2>Analyze your resume</h2>
          <p className="muted">
            Choose a saved resume. Add a job description for a role-specific
            keyword review, or leave it blank for a general review.
          </p>
          {loadingResumes ? (
            <Spinner label="Loading resumes" />
          ) : resumes.length === 0 ? (
            <div className="ats-empty">
              <p>You haven't created a resume yet.</p>
              <Link className="btn btn-primary" to="/dashboard">
                Create a resume
              </Link>
            </div>
          ) : (
            <>
              <label className="field">
                <span>Select resume</span>
                <select
                  value={resumeId}
                  onChange={(e) => {
                    setResumeId(e.target.value);
                    setResult(null);
                  }}
                >
                  {resumes.map((resume) => (
                    <option value={resume._id} key={resume._id}>
                      {resume.title || "Untitled resume"}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>
                  Job description <small>(optional)</small>
                </span>
                <textarea
                  rows={7}
                  maxLength={8000}
                  value={jobDescription}
                  onChange={(e) => {
                    setJobDescription(e.target.value);
                    setResult(null);
                  }}
                  placeholder="Paste the job description here to check keyword alignment…"
                />
                <small className="field-hint">
                  {jobDescription.length}/8000 characters · Minimum 30
                  characters if provided.
                </small>
              </label>
              <button
                className="btn btn-ai btn-lg"
                type="submit"
                disabled={checking || !resumeId}
              >
                {checking ? "Analyzing resume…" : "✦ Check ATS readiness"}
              </button>
            </>
          )}
          {error && (
            <div className="alert alert-error" role="alert">
              {error}
            </div>
          )}
        </form>

        {checking && (
          <div className="ats-loading">
            <Spinner label="Analyzing resume" />
            <p className="muted">
              AI is reviewing your resume content. This can take a few moments.
            </p>
          </div>
        )}

        {result && (
          <section className="ats-results" aria-live="polite">
            <div className="ats-overview panel">
              <ScoreRing value={result.score} />
              <div>
                <p className="eyebrow">
                  {result.assessmentType === "job-specific"
                    ? "JOB-SPECIFIC REVIEW"
                    : "GENERAL REVIEW"}
                </p>
                <h2>Estimated ATS readiness</h2>
                <p className="muted">
                  This is an AI-generated content estimate, not a score from a
                  real applicant tracking system.
                </p>
              </div>
            </div>
            <section className="panel">
              <h2>Score breakdown</h2>
              <div className="ats-breakdown">
                {Object.entries(labels).map(([key, label]) => (
                  <div className="ats-breakdown-row" key={key}>
                    <div>
                      <span>{label}</span>
                      <strong>{result.breakdown?.[key] ?? 0}/100</strong>
                    </div>
                    <div className="ats-progress">
                      <span
                        style={{ width: `${result.breakdown?.[key] ?? 0}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>
            <div className="ats-result-grid">
              <ResultList title="Your strengths" items={result.strengths} />
              <ResultList
                title="Missing keywords"
                items={result.missingKeywords}
                kind="chips"
              />
              <ResultList title="Issues to fix" items={result.issues} />
              <ResultList
                title="Recommended improvements"
                items={result.recommendations}
              />
            </div>
          </section>
        )}
        <p className="ats-disclaimer">
          Tip: Only add skills and keywords that genuinely match your
          experience. Never add information just to increase a score.
        </p>
      </main>
    </>
  );
}
