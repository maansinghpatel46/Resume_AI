import { useState } from "react";
import api, { errMsg } from "../api";

// AI actions for a text field. Results are shown as a proposal the user accepts or discards.
export default function AiTextTools({
  value,
  onChange,
  context = "general",
  generate,
}) {
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [proposal, setProposal] = useState(null);
  const hasText = (value || "").trim().length > 0;

  const run = async (key, fn) => {
    setBusy(key);
    setError("");
    setProposal(null);
    try {
      setProposal({ key, text: await fn() });
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setBusy("");
    }
  };

  const post = (url) => async () =>
    (await api.post(url, { text: value, context })).data.text;

  return (
    <div className="ai-tools">
      <div className="ai-actions">
        {generate && (
          <button
            type="button"
            className="btn btn-ai btn-sm"
            disabled={!!busy}
            onClick={() => run("generate", generate.fn)}
          >
            {busy === "generate" ? "Generating…" : `✦ ${generate.label}`}
          </button>
        )}
        <button
          type="button"
          className="btn btn-ai-ghost btn-sm"
          disabled={!!busy || !hasText}
          onClick={() => run("improve", post("/ai/improve"))}
        >
          {busy === "improve" ? "Improving…" : "Improve writing"}
        </button>
        <button
          type="button"
          className="btn btn-ai-ghost btn-sm"
          disabled={!!busy || !hasText}
          onClick={() => run("grammar", post("/ai/grammar"))}
        >
          {busy === "grammar" ? "Checking…" : "Fix grammar"}
        </button>
      </div>
      {error && (
        <div className="alert alert-error" role="alert">
          {error}
        </div>
      )}
      {proposal && (
        <div className="ai-proposal">
          <div className="ai-proposal-label">AI suggestion</div>
          <p>{proposal.text}</p>
          <div className="ai-actions">
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => {
                onChange(proposal.text);
                setProposal(null);
              }}
            >
              {proposal.key === "generate" && hasText
                ? "Replace text"
                : "Use this"}
            </button>
            {proposal.key === "generate" && hasText && (
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => {
                  onChange(`${value.trim()}\n${proposal.text}`);
                  setProposal(null);
                }}
              >
                Add below
              </button>
            )}
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setProposal(null)}
            >
              Discard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
