import { useState } from "react";
import api, { errMsg } from "../api";

function Score({ value }) {
  const r = 36;
  const c = 2 * Math.PI * r;
  return (
    <div className="score" aria-label={`Score ${value} out of 100`}>
      <svg width="92" height="92" viewBox="0 0 92 92">
        <circle cx="46" cy="46" r={r} className="ring-bg" />
        <circle
          cx="46"
          cy="46"
          r={r}
          className="ring"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - value / 100)}
          transform="rotate(-90 46 46)"
        />
      </svg>
      <span>{value}</span>
    </div>
  );
}

const List = ({ title, items }) =>
  items?.length ? (
    <div className="result-block">
      <h4>{title}</h4>
      <ul className="plain-list">
        {items.map((t, i) => (
          <li key={i}>{t}</li>
        ))}
      </ul>
    </div>
  ) : null;

export default function AiReview({ resume }) {
  const [jd, setJd] = useState("");
  const [match, setMatch] = useState(null);
  const [matchBusy, setMatchBusy] = useState(false);
  const [matchErr, setMatchErr] = useState("");
  const [sugg, setSugg] = useState(null);
  const [suggBusy, setSuggBusy] = useState(false);
  const [suggErr, setSuggErr] = useState("");

  const runMatch = async () => {
    if (jd.trim().length < 30) {
      setMatchErr("Paste the full job description (at least 30 characters).");
      return;
    }
    setMatchBusy(true);
    setMatchErr("");
    try {
      setMatch(
        (await api.post("/ai/match", { resume, jobDescription: jd })).data
          .result,
      );
    } catch (e) {
      setMatchErr(errMsg(e));
    } finally {
      setMatchBusy(false);
    }
  };

  const runSugg = async () => {
    setSuggBusy(true);
    setSuggErr("");
    try {
      setSugg((await api.post("/ai/suggestions", { resume })).data.result);
    } catch (e) {
      setSuggErr(errMsg(e));
    } finally {
      setSuggBusy(false);
    }
  };

  return (
    <div className="ai-review">
      <section className="panel">
        <h3>Job description match</h3>
        <p className="muted">
          Paste a job posting to see how well your resume fits and which
          keywords are missing.
        </p>
        <label className="field full">
          <span>Job description</span>
          <textarea
            rows={7}
            value={jd}
            maxLength={8000}
            onChange={(e) => setJd(e.target.value)}
            placeholder="Paste the job description here…"
          />
        </label>
        <button className="btn btn-ai" onClick={runMatch} disabled={matchBusy}>
          {matchBusy ? "Analyzing…" : "✦ Analyze match"}
        </button>
        {matchErr && (
          <div className="alert alert-error" role="alert">
            {matchErr}
          </div>
        )}
        {match && (
          <div className="result">
            <div className="result-head">
              <Score value={match.score} />
              <div>
                <strong>Match score</strong>
                <p className="muted">How closely your resume fits this role.</p>
              </div>
            </div>
            {match.matchedKeywords.length > 0 && (
              <div className="result-block">
                <h4>Keywords you have</h4>
                <ul className="chips">
                  {match.matchedKeywords.map((k) => (
                    <li key={k} className="chip chip-good">
                      {k}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {match.missingKeywords.length > 0 && (
              <div className="result-block">
                <h4>Missing keywords</h4>
                <ul className="chips">
                  {match.missingKeywords.map((k) => (
                    <li key={k} className="chip chip-warn">
                      {k}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <List title="Strengths" items={match.strengths} />
            <List title="Gaps" items={match.gaps} />
            <List title="Recommended edits" items={match.recommendations} />
          </div>
        )}
      </section>

      <section className="panel">
        <h3>Resume quality review</h3>
        <p className="muted">
          Get specific suggestions on impact, clarity, structure and missing
          details.
        </p>
        <button className="btn btn-ai" onClick={runSugg} disabled={suggBusy}>
          {suggBusy ? "Reviewing…" : "✦ Review my resume"}
        </button>
        {suggErr && (
          <div className="alert alert-error" role="alert">
            {suggErr}
          </div>
        )}
        {sugg && (
          <div className="result">
            <div className="result-head">
              <Score value={sugg.overallScore} />
              <div>
                <strong>Overall quality</strong>
                <p className="muted">
                  Based on the content currently in your resume.
                </p>
              </div>
            </div>
            <ul className="suggestions">
              {sugg.suggestions.map((s, i) => (
                <li key={i}>
                  <span className={`badge badge-${s.priority}`}>
                    {s.priority}
                  </span>
                  <div>
                    <strong>{s.area}</strong>
                    <p>{s.tip}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </div>
  );
}
