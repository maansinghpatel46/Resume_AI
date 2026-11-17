import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { Link, useParams } from "react-router-dom";
import api, { errMsg } from "../api";
import Navbar from "../components/Navbar";
import Spinner from "../components/Spinner";
import ListEditor from "../components/ListEditor";
import SkillsEditor from "../components/SkillsEditor";
import AiTextTools from "../components/AiTextTools";
import AiReview from "../components/AiReview";
import ResumePreview from "../components/ResumePreview";
import { Input, Select, Textarea } from "../components/Fields";
import { useToast } from "../context/Toast";
import { EMAIL_RE } from "../utils";
import templatesCss from "../styles/templates.css?raw";

const EDITABLE = [
  "title",
  "template",
  "customStyle",
  "personal",
  "summary",
  "education",
  "experience",
  "skills",
  "projects",
  "certifications",
  "languages",
];
const pickEditable = (r) => EDITABLE.reduce((o, k) => ((o[k] = r[k]), o), {});
const snap = (r) => JSON.stringify(pickEditable(r));

const TABS = [
  ["personal", "Personal"],
  ["summary", "Summary"],
  ["experience", "Experience"],
  ["education", "Education"],
  ["skills", "Skills"],
  ["projects", "Projects"],
  ["certifications", "Certifications"],
  ["languages", "Languages"],
  ["design", "Customize style"],
  ["ai", "AI review"],
];
const TEMPLATES = [
  ["modern", "Modern"],
  ["classic", "Classic"],
  ["minimal", "Minimal"],
  ["professional", "Professional"],
  ["executive", "Executive"],
  ["tech", "Tech"],
  ["elegant", "Elegant"],
  ["creative", "Creative"],
  ["clean", "Clean"],
];
const LEVELS = ["Native", "Fluent", "Advanced", "Intermediate", "Basic"];
const PAPER_PX = 794; // 210mm at 96dpi
const DEFAULT_STYLE = {
  accentColor: "#2563eb",
  fontFamily: "Arial",
  fontSize: "medium",
  spacing: "comfortable",
  headerStyle: "classic",
};

const PRINT_CSS = `
@page { size: A4; margin: 14mm; }
html, body { margin: 0; padding: 0; background: #fff; }
* { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.resume { width: auto !important; min-height: 0 !important; padding: 0 !important; margin: 0 !important; box-shadow: none !important; }
`;

function PreviewPane({ resume, paperRef }) {
  const wrap = useRef(null);
  const [scale, setScale] = useState(1);
  const [height, setHeight] = useState(1123);

  useLayoutEffect(() => {
    const measure = () => {
      const s = Math.min(1, wrap.current.clientWidth / PAPER_PX);
      setScale(s);
      if (paperRef.current) setHeight(paperRef.current.offsetHeight * s);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(wrap.current);
    if (paperRef.current) ro.observe(paperRef.current);
    return () => ro.disconnect();
  }, [paperRef]);

  return (
    <div className="preview-wrap" ref={wrap}>
      <div style={{ height }}>
        <div
          style={{
            width: PAPER_PX,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
          }}
        >
          <ResumePreview ref={paperRef} resume={resume} />
        </div>
      </div>
    </div>
  );
}

export default function Builder() {
  const { id } = useParams();
  const toast = useToast();
  const [resume, setResume] = useState(null);
  const [savedSnap, setSavedSnap] = useState("");
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [tab, setTab] = useState("personal");
  const [mobileView, setMobileView] = useState("edit");
  const [pdfBusy, setPdfBusy] = useState(false);
  const paperRef = useRef(null);
  const resumeRef = useRef(null);
  const savingRef = useRef(false);

  resumeRef.current = resume;

  useEffect(() => {
    let cancelled = false;
    api
      .get(`/resumes/${id}`)
      .then((r) => {
        if (!cancelled) {
          setResume(r.data.resume);
          setSavedSnap(snap(r.data.resume));
        }
      })
      .catch((e) => {
        if (!cancelled) setLoadError(errMsg(e));
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  // All edits go through here so a stale save error is cleared as soon as the user changes something.
  const edit = useCallback((fn) => {
    setSaveError("");
    setResume(fn);
  }, []);
  const setField = (k) => (v) => edit((r) => ({ ...r, [k]: v }));
  const setPersonal = (k) => (v) =>
    edit((r) => ({ ...r, personal: { ...r.personal, [k]: v } }));

  const dirty = resume ? snap(resume) !== savedSnap : false;

  const save = useCallback(
    async (silent = false) => {
      const r = resumeRef.current;
      if (!r || savingRef.current) return false;
      if (!r.title.trim()) {
        setSaveError("Give your resume a title before saving.");
        return false;
      }
      if (r.personal?.email && !EMAIL_RE.test(r.personal.email)) {
        setSaveError(
          "Fix the email address in Personal details before saving.",
        );
        return false;
      }
      const sent = snap(r);
      savingRef.current = true;
      setSaving(true);
      setSaveError("");
      try {
        await api.put(`/resumes/${id}`, pickEditable(r));
        setSavedSnap(sent);
        if (!silent) toast("Resume saved");
        return true;
      } catch (e) {
        setSaveError(errMsg(e));
        if (!silent) toast(errMsg(e), "error");
        return false;
      } finally {
        savingRef.current = false;
        setSaving(false);
      }
    },
    [id, toast],
  );

  // Autosave 2s after the last change. A failed save stops retrying until the next edit.
  useEffect(() => {
    if (!dirty || saving || saveError) return undefined;
    const t = setTimeout(() => save(true), 2000);
    return () => clearTimeout(t);
  }, [resume, dirty, saving, saveError, save]);

  useEffect(() => {
    const warn = (e) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const downloadPdf = async () => {
    if (!paperRef.current) return;
    setPdfBusy(true);
    try {
      const html = `<!doctype html><html><head><meta charset="utf-8"><style>${templatesCss}${PRINT_CSS}</style></head><body>${paperRef.current.outerHTML}</body></html>`;
      const filename = (
        resume.personal?.fullName ||
        resume.title ||
        "resume"
      ).trim();
      const res = await api.post(
        "/pdf",
        { html, filename },
        { responseType: "blob" },
      );
      const url = URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${filename.replace(/[^a-z0-9 _-]/gi, "").trim() || "resume"}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast("PDF downloaded");
    } catch (e) {
      let msg = errMsg(e);
      if (e.response?.data instanceof Blob) {
        try {
          msg = JSON.parse(await e.response.data.text()).message || msg;
        } catch {
          /* keep default */
        }
      }
      toast(msg, "error");
    } finally {
      setPdfBusy(false);
    }
  };

  if (loadError) {
    return (
      <>
        <Navbar />
        <div className="center-page">
          <h1>Could not open this resume</h1>
          <p className="muted">{loadError}</p>
          <Link to="/dashboard" className="btn btn-primary">
            Back to dashboard
          </Link>
        </div>
      </>
    );
  }
  if (!resume) return <Spinner full />;

  const status = saving
    ? "Saving…"
    : saveError
      ? "Not saved"
      : dirty
        ? "Unsaved changes"
        : "All changes saved";

  const list = (key) => (items) => edit((r) => ({ ...r, [key]: items }));

  const renderTab = () => {
    switch (tab) {
      case "design": {
        const style = { ...DEFAULT_STYLE, ...(resume.customStyle || {}) };
        const updateStyle = (key, value) =>
          edit((r) => ({
            ...r,
            customStyle: {
              ...DEFAULT_STYLE,
              ...(r.customStyle || {}),
              [key]: value,
            },
          }));
        return (
          <div className="design-customizer">
            <div className="section-heading">
              <h2>Customize your resume</h2>
              <p className="muted">
                Change colors, typography and spacing. Preview and PDF update
                automatically.
              </p>
            </div>
            <label className="custom-control">
              <span>Accent color</span>
              <div className="color-control">
                <input
                  type="color"
                  value={style.accentColor}
                  onChange={(e) => updateStyle("accentColor", e.target.value)}
                />
                <code>{style.accentColor.toUpperCase()}</code>
              </div>
            </label>
            <label className="custom-control">
              <span>Font family</span>
              <select
                value={style.fontFamily}
                onChange={(e) => updateStyle("fontFamily", e.target.value)}
              >
                <option value="Arial">Arial — Clean</option>
                <option value="Georgia">Georgia — Classic</option>
                <option value="Verdana">Verdana — Modern</option>
                <option value="Tahoma">Tahoma — Compact</option>
                <option value="Trebuchet MS">Trebuchet — Contemporary</option>
              </select>
            </label>
            <label className="custom-control">
              <span>Font size</span>
              <select
                value={style.fontSize}
                onChange={(e) => updateStyle("fontSize", e.target.value)}
              >
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
              </select>
            </label>
            <label className="custom-control">
              <span>Content spacing</span>
              <select
                value={style.spacing}
                onChange={(e) => updateStyle("spacing", e.target.value)}
              >
                <option value="compact">Compact</option>
                <option value="comfortable">Comfortable</option>
                <option value="airy">Spacious</option>
              </select>
            </label>
            <label className="custom-control">
              <span>Header style</span>
              <select
                value={style.headerStyle}
                onChange={(e) => updateStyle("headerStyle", e.target.value)}
              >
                <option value="classic">Classic</option>
                <option value="centered">Centered</option>
                <option value="banner">Color banner</option>
                <option value="minimal">Minimal line</option>
              </select>
            </label>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() =>
                edit((r) => ({ ...r, customStyle: { ...DEFAULT_STYLE } }))
              }
            >
              Reset custom style
            </button>
            <p className="muted design-note">
              Tip: For ATS-friendly applications, use a simple font, clear
              headings and a restrained accent color.
            </p>
          </div>
        );
      }
      case "personal":
        return (
          <div className="grid-2">
            <Input
              label="Full name"
              value={resume.personal.fullName}
              onChange={setPersonal("fullName")}
              maxLength={100}
            />
            <Input
              label="Job title"
              value={resume.personal.jobTitle}
              onChange={setPersonal("jobTitle")}
              maxLength={100}
              placeholder="e.g. Full Stack Developer"
            />
            <Input
              label="Email"
              type="email"
              value={resume.personal.email}
              onChange={setPersonal("email")}
              maxLength={120}
              error={
                resume.personal.email && !EMAIL_RE.test(resume.personal.email)
                  ? "Enter a valid email address"
                  : ""
              }
            />
            <Input
              label="Phone"
              value={resume.personal.phone}
              onChange={setPersonal("phone")}
              maxLength={40}
            />
            <Input
              label="Location"
              value={resume.personal.location}
              onChange={setPersonal("location")}
              maxLength={100}
              placeholder="City, Country"
            />
            <Input
              label="Website"
              value={resume.personal.website}
              onChange={setPersonal("website")}
              maxLength={200}
            />
            <Input
              label="LinkedIn"
              value={resume.personal.linkedin}
              onChange={setPersonal("linkedin")}
              maxLength={200}
              full
            />
          </div>
        );
      case "summary":
        return (
          <>
            <Textarea
              label="Professional summary"
              rows={6}
              maxLength={2000}
              value={resume.summary}
              onChange={setField("summary")}
              hint="3–4 sentences that sum up who you are and what you do best."
            />
            <AiTextTools
              value={resume.summary}
              onChange={setField("summary")}
              context="summary"
              generate={{
                label: "Generate summary",
                fn: async () =>
                  (
                    await api.post("/ai/summary", {
                      resume: pickEditable(resume),
                    })
                  ).data.summary,
              }}
            />
          </>
        );
      case "experience":
        return (
          <ListEditor
            title="Position"
            items={resume.experience}
            onChange={list("experience")}
            addLabel="Add experience"
            blank={{
              company: "",
              role: "",
              location: "",
              startDate: "",
              endDate: "",
              current: false,
              description: "",
            }}
            emptyText="No work experience added yet."
            renderFields={(it, up) => (
              <>
                <Input
                  label="Job title"
                  value={it.role}
                  onChange={(v) => up({ role: v })}
                  maxLength={100}
                />
                <Input
                  label="Company"
                  value={it.company}
                  onChange={(v) => up({ company: v })}
                  maxLength={150}
                />
                <Input
                  label="Location"
                  value={it.location}
                  onChange={(v) => up({ location: v })}
                  maxLength={100}
                />
                <div />
                <Input
                  label="Start date"
                  type="month"
                  value={it.startDate}
                  onChange={(v) => up({ startDate: v })}
                />
                <div className="date-end">
                  <Input
                    label="End date"
                    type="month"
                    value={it.current ? "" : it.endDate}
                    onChange={(v) => up({ endDate: v })}
                  />
                  <label className="check">
                    <input
                      type="checkbox"
                      checked={!!it.current}
                      onChange={(e) =>
                        up({
                          current: e.target.checked,
                          endDate: e.target.checked ? "" : it.endDate,
                        })
                      }
                    />{" "}
                    I currently work here
                  </label>
                </div>
                <Textarea
                  label="Responsibilities and achievements"
                  rows={5}
                  maxLength={3000}
                  value={it.description}
                  onChange={(v) => up({ description: v })}
                  hint="One bullet per line."
                />
                <div className="full">
                  <AiTextTools
                    value={it.description}
                    onChange={(v) => up({ description: v })}
                    context="bullets"
                    generate={{
                      label: "Write bullet points",
                      fn: async () => {
                        if (!it.role.trim())
                          throw new Error(
                            "Add a job title for this position first.",
                          );
                        const { data } = await api.post("/ai/bullets", {
                          role: it.role,
                          company: it.company,
                          details: it.description,
                        });
                        return data.bullets.join("\n");
                      },
                    }}
                  />
                </div>
              </>
            )}
          />
        );
      case "education":
        return (
          <ListEditor
            title="Education"
            items={resume.education}
            onChange={list("education")}
            addLabel="Add education"
            blank={{
              school: "",
              degree: "",
              field: "",
              startDate: "",
              endDate: "",
              description: "",
            }}
            emptyText="No education added yet."
            renderFields={(it, up) => (
              <>
                <Input
                  label="School / University"
                  value={it.school}
                  onChange={(v) => up({ school: v })}
                  maxLength={150}
                  full
                />
                <Input
                  label="Degree"
                  value={it.degree}
                  onChange={(v) => up({ degree: v })}
                  maxLength={100}
                  placeholder="e.g. B.Tech"
                />
                <Input
                  label="Field of study"
                  value={it.field}
                  onChange={(v) => up({ field: v })}
                  maxLength={100}
                />
                <Input
                  label="Start date"
                  type="month"
                  value={it.startDate}
                  onChange={(v) => up({ startDate: v })}
                />
                <Input
                  label="End date (or expected)"
                  type="month"
                  value={it.endDate}
                  onChange={(v) => up({ endDate: v })}
                />
                <Textarea
                  label="Details (optional)"
                  rows={3}
                  maxLength={1000}
                  value={it.description}
                  onChange={(v) => up({ description: v })}
                />
              </>
            )}
          />
        );
      case "skills":
        return (
          <SkillsEditor
            skills={resume.skills}
            onChange={(s) => edit((r) => ({ ...r, skills: s }))}
          />
        );
      case "projects":
        return (
          <ListEditor
            title="Project"
            items={resume.projects}
            onChange={list("projects")}
            addLabel="Add project"
            blank={{ name: "", link: "", tech: "", description: "" }}
            emptyText="No projects added yet."
            renderFields={(it, up) => (
              <>
                <Input
                  label="Project name"
                  value={it.name}
                  onChange={(v) => up({ name: v })}
                  maxLength={120}
                />
                <Input
                  label="Link"
                  value={it.link}
                  onChange={(v) => up({ link: v })}
                  maxLength={200}
                />
                <Input
                  label="Technologies"
                  value={it.tech}
                  onChange={(v) => up({ tech: v })}
                  maxLength={200}
                  placeholder="React, Node.js, MongoDB"
                  full
                />
                <Textarea
                  label="Description"
                  rows={4}
                  maxLength={1500}
                  value={it.description}
                  onChange={(v) => up({ description: v })}
                />
                <div className="full">
                  <AiTextTools
                    value={it.description}
                    onChange={(v) => up({ description: v })}
                    context="project"
                  />
                </div>
              </>
            )}
          />
        );
      case "certifications":
        return (
          <ListEditor
            title="Certification"
            items={resume.certifications}
            onChange={list("certifications")}
            addLabel="Add certification"
            max={20}
            blank={{ name: "", issuer: "", date: "" }}
            emptyText="No certifications added yet."
            renderFields={(it, up) => (
              <>
                <Input
                  label="Certification"
                  value={it.name}
                  onChange={(v) => up({ name: v })}
                  maxLength={150}
                  full
                />
                <Input
                  label="Issuer"
                  value={it.issuer}
                  onChange={(v) => up({ issuer: v })}
                  maxLength={120}
                />
                <Input
                  label="Date"
                  type="month"
                  value={it.date}
                  onChange={(v) => up({ date: v })}
                />
              </>
            )}
          />
        );
      case "languages":
        return (
          <ListEditor
            title="Language"
            items={resume.languages}
            onChange={list("languages")}
            addLabel="Add language"
            blank={{ name: "", level: "" }}
            emptyText="No languages added yet."
            renderFields={(it, up) => (
              <>
                <Input
                  label="Language"
                  value={it.name}
                  onChange={(v) => up({ name: v })}
                  maxLength={50}
                />
                <Select
                  label="Proficiency"
                  value={it.level}
                  onChange={(v) => up({ level: v })}
                  options={LEVELS}
                />
              </>
            )}
          />
        );
      default:
        return <AiReview resume={pickEditable(resume)} />;
    }
  };

  return (
    <div className="builder-page">
      <Navbar />
      <div className="builder-bar">
        <Link to="/dashboard" className="btn btn-ghost btn-sm">
          ← Dashboard
        </Link>
        <Link to={`/resume/${id}/history`} className="btn btn-outline btn-sm">
          Version history
        </Link>
        <input
          className="title-input"
          value={resume.title}
          maxLength={100}
          aria-label="Resume title"
          onChange={(e) => setField("title")(e.target.value)}
        />
        <div
          className="template-picker"
          role="group"
          aria-label="Choose resume design"
        >
          <span className="template-label">Design:</span>
          {TEMPLATES.map(([key, label]) => (
            <button
              type="button"
              key={key}
              className={`template-option ${resume.template === key ? "active" : ""}`}
              aria-pressed={resume.template === key}
              onClick={() => setField("template")(key)}
            >
              {label}
            </button>
          ))}
        </div>
        <span
          className={`save-status ${saveError ? "bad" : dirty ? "warn" : ""}`}
        >
          {status}
        </span>
        <button
          className="btn btn-outline btn-sm"
          onClick={() => save(false)}
          disabled={saving || !dirty}
        >
          Save
        </button>
        <button
          className="btn btn-primary btn-sm"
          onClick={downloadPdf}
          disabled={pdfBusy}
        >
          {pdfBusy ? "Preparing PDF…" : "Download PDF"}
        </button>
      </div>
      {saveError && (
        <div className="alert alert-error bar-alert" role="alert">
          {saveError}
        </div>
      )}

      <div className="mobile-toggle">
        <button
          className={mobileView === "edit" ? "active" : ""}
          onClick={() => setMobileView("edit")}
        >
          Edit
        </button>
        <button
          className={mobileView === "preview" ? "active" : ""}
          onClick={() => setMobileView("preview")}
        >
          Preview
        </button>
      </div>

      <div className={`builder show-${mobileView}`}>
        <section className="editor">
          <nav className="tabs" aria-label="Resume sections">
            {TABS.map(([key, label]) => (
              <button
                key={key}
                className={`tab ${tab === key ? "active" : ""} ${key === "ai" ? "tab-ai" : ""}`}
                onClick={() => setTab(key)}
              >
                {label}
              </button>
            ))}
          </nav>
          <div className="editor-body">{renderTab()}</div>
        </section>
        <section className="preview" aria-label="Live preview">
          <PreviewPane resume={resume} paperRef={paperRef} />
        </section>
      </div>
    </div>
  );
}
