import { forwardRef } from "react";
import { fmtMonth } from "../utils";

const range = (s, e, current) =>
  [fmtMonth(s), current ? "Present" : fmtMonth(e)].filter(Boolean).join(" – ");
const lines = (t) =>
  (t || "")
    .split("\n")
    .map((l) => l.replace(/^\s*[-•*▪–]\s*/, "").trim())
    .filter(Boolean);

const Section = ({ title, children }) => (
  <section className="sec">
    <h2>{title}</h2>
    {children}
  </section>
);

// The three templates share one structure and differ in CSS (styles/templates.css).
const ResumePreview = forwardRef(function ResumePreview({ resume }, ref) {
  const p = resume.personal || {};
  const contact = [p.email, p.phone, p.location, p.website, p.linkedin].filter(
    Boolean,
  );
  const exp = (resume.experience || []).filter(
    (e) => e.role || e.company || e.description,
  );
  const edu = (resume.education || []).filter((e) => e.school || e.degree);
  const proj = (resume.projects || []).filter((x) => x.name || x.description);
  const certs = (resume.certifications || []).filter((c) => c.name);
  const langs = (resume.languages || []).filter((l) => l.name);
  const skills = resume.skills || [];
  const custom = {
    accentColor: "#2563eb",
    fontFamily: "Arial",
    fontSize: "medium",
    spacing: "comfortable",
    headerStyle: "classic",
    ...(resume.customStyle || {}),
  };
  const customVars = {
    "--custom-accent": custom.accentColor,
    "--custom-font":
      custom.fontFamily === "Trebuchet MS"
        ? "'Trebuchet MS', Arial, sans-serif"
        : custom.fontFamily,
    "--custom-font-size":
      custom.fontSize === "small"
        ? "9.5pt"
        : custom.fontSize === "large"
          ? "11.5pt"
          : "10.5pt",
    "--custom-section-gap":
      custom.spacing === "compact"
        ? "10px"
        : custom.spacing === "airy"
          ? "22px"
          : "15px",
    "--custom-entry-gap":
      custom.spacing === "compact"
        ? "5px"
        : custom.spacing === "airy"
          ? "14px"
          : "9px",
  };

  return (
    <div
      ref={ref}
      style={customVars}
      data-header={custom.headerStyle}
      data-font-size={custom.fontSize}
      className={`resume tpl-${resume.template || "modern"} custom-font-${custom.fontFamily.toLowerCase().replace(/[^a-z]+/g, "-")}`}
    >
      <header className="head">
        <h1 className={p.fullName ? "" : "ph"}>{p.fullName || "Your Name"}</h1>
        {p.jobTitle && <div className="role">{p.jobTitle}</div>}
        {contact.length > 0 && (
          <div className="contact">
            {contact.map((c, i) => (
              <span key={i}>{c}</span>
            ))}
          </div>
        )}
      </header>

      {resume.summary?.trim() && (
        <Section title="Summary">
          <p className="summary">{resume.summary}</p>
        </Section>
      )}

      {exp.length > 0 && (
        <Section title="Experience">
          {exp.map((e, i) => (
            <div className="entry" key={i}>
              <div className="entry-top">
                <div>
                  <strong>{e.role}</strong>
                  {e.company && (
                    <span className="sub">
                      {e.role ? ", " : ""}
                      {e.company}
                    </span>
                  )}
                  {e.location && <span className="sub"> · {e.location}</span>}
                </div>
                <span className="date">
                  {range(e.startDate, e.endDate, e.current)}
                </span>
              </div>
              {lines(e.description).length > 0 && (
                <ul>
                  {lines(e.description).map((l, j) => (
                    <li key={j}>{l}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </Section>
      )}

      {edu.length > 0 && (
        <Section title="Education">
          {edu.map((e, i) => (
            <div className="entry" key={i}>
              <div className="entry-top">
                <div>
                  <strong>
                    {[e.degree, e.field].filter(Boolean).join(" in ")}
                  </strong>
                  {e.school && (
                    <span className="sub">
                      {e.degree || e.field ? ", " : ""}
                      {e.school}
                    </span>
                  )}
                </div>
                <span className="date">{range(e.startDate, e.endDate)}</span>
              </div>
              {e.description && <p className="desc">{e.description}</p>}
            </div>
          ))}
        </Section>
      )}

      {proj.length > 0 && (
        <Section title="Projects">
          {proj.map((x, i) => (
            <div className="entry" key={i}>
              <div className="entry-top">
                <div>
                  <strong>{x.name}</strong>
                  {x.tech && <span className="sub"> · {x.tech}</span>}
                </div>
                {x.link && <span className="date">{x.link}</span>}
              </div>
              {x.description && <p className="desc">{x.description}</p>}
            </div>
          ))}
        </Section>
      )}

      {skills.length > 0 && (
        <Section title="Skills">
          <ul className="skills">
            {skills.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </Section>
      )}

      {certs.length > 0 && (
        <Section title="Certifications">
          {certs.map((c, i) => (
            <div className="entry" key={i}>
              <div className="entry-top">
                <div>
                  <strong>{c.name}</strong>
                  {c.issuer && <span className="sub">, {c.issuer}</span>}
                </div>
                <span className="date">{fmtMonth(c.date)}</span>
              </div>
            </div>
          ))}
        </Section>
      )}

      {langs.length > 0 && (
        <Section title="Languages">
          <ul className="skills">
            {langs.map((l, i) => (
              <li key={i}>
                {l.name}
                {l.level ? ` (${l.level})` : ""}
              </li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  );
});

export default ResumePreview;
