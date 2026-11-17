import { useState } from "react";

export default function SkillsEditor({ skills, onChange }) {
  const [text, setText] = useState("");

  const addFrom = (raw) => {
    const incoming = raw
      .split(/[,\n]/)
      .map((s) => s.trim().slice(0, 50))
      .filter(Boolean);
    if (!incoming.length) return;
    const existing = new Set(skills.map((s) => s.toLowerCase()));
    const merged = [...skills];
    incoming.forEach((s) => {
      if (!existing.has(s.toLowerCase()) && merged.length < 60) {
        merged.push(s);
        existing.add(s.toLowerCase());
      }
    });
    onChange(merged);
    setText("");
  };

  return (
    <div>
      <label className="field full">
        <span>Add skills</span>
        <div className="inline-add">
          <input
            value={text}
            maxLength={200}
            placeholder="e.g. React, Node.js, Project management"
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === ",") {
                e.preventDefault();
                addFrom(text);
              }
            }}
          />
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => addFrom(text)}
            disabled={!text.trim()}
          >
            Add
          </button>
        </div>
        <small className="field-hint">
          Press Enter or comma to add. Separate several skills with commas.
        </small>
      </label>
      {skills.length === 0 ? (
        <p className="empty-note">No skills added yet.</p>
      ) : (
        <ul className="chips">
          {skills.map((s, i) => (
            <li key={s + i} className="chip">
              {s}
              <button
                type="button"
                aria-label={`Remove ${s}`}
                onClick={() => onChange(skills.filter((_, idx) => idx !== i))}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
