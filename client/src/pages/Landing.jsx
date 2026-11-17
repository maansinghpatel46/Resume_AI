import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Logo from "../components/Logo";
import { useAuth } from "../context/AuthContext";

const FEATURES = [
  [
    "✦",
    "Summary generator",
    "Turns your title, skills and experience into a tight professional summary.",
  ],
  [
    "↻",
    "Content improver",
    "Rewrites weak lines so they sound clear and confident, without changing the facts.",
  ],
  [
    "•",
    "Bullet point writer",
    "Give it a role and it drafts achievement-focused bullets you can edit.",
  ],
  [
    "Aa",
    "Grammar correction",
    "Fixes spelling and punctuation while keeping your own wording.",
  ],
  [
    "◎",
    "Job description match",
    "Scores your resume against a job post and lists the keywords you are missing.",
  ],
  [
    "★",
    "Quality review",
    "A recruiter-style checklist of what to fix before you apply.",
  ],
];

const STEPS = [
  [
    "Fill in your details",
    "Add your experience, education, skills and projects. Everything saves automatically.",
  ],
  [
    "Let AI sharpen it",
    "Generate a summary, polish bullet points and check your fit for a specific job.",
  ],
  [
    "Pick a template, download",
    "Switch templates with one click and export a clean A4 PDF.",
  ],
];

const TEMPLATES = [
  ["modern", "Modern", "Navy header with purple accents and skill chips."],
  [
    "classic",
    "Classic",
    "Traditional serif layout that suits formal industries.",
  ],
  ["minimal", "Minimal", "Light, airy and easy to scan."],
  [
    "professional",
    "Professional",
    "Clean green accents for a polished business look.",
  ],
  [
    "executive",
    "Executive",
    "Refined charcoal and gold styling for senior roles.",
  ],
];

export default function Landing() {
  const { user } = useAuth();
  const cta = user ? "/dashboard" : "/register";

  return (
    <>
      <Navbar landing />
      <main>
        <section className="hero">
          <div className="container hero-grid">
            <div className="hero-copy">
              <h1>Write a resume that gets read.</h1>
              <p className="lead">
                ResumeAI drafts your summary, sharpens your bullet points and
                checks your resume against the job you want. Then it exports a
                clean PDF.
              </p>
              <div className="hero-actions">
                <Link to={cta} className="btn btn-primary btn-lg">
                  {user ? "Go to dashboard" : "Build my resume"}
                </Link>
                <a href="#how" className="btn btn-outline btn-lg">
                  See how it works
                </a>
              </div>
              <p className="hero-note">Free to use. No credit card needed.</p>
            </div>

            <div className="hero-visual" aria-hidden="true">
              <div className="mock">
                <div className="mock-head">
                  <div className="mock-name" />
                  <div className="mock-role" />
                </div>
                <div className="mock-body">
                  <div className="mock-h" />
                  <div className="mock-line w100" />
                  <div className="mock-line w90" />
                  <div className="mock-line w60" />
                  <div className="mock-h" />
                  <div className="mock-line w80" />
                  <div className="mock-line w100" />
                  <div className="mock-line w70" />
                  <div className="mock-chips">
                    <i />
                    <i />
                    <i />
                    <i />
                  </div>
                </div>
              </div>
              <div className="mock-ai">
                <b>✦ AI suggestion</b>
                <span>
                  Led a team of 5 to ship a payments feature that cut checkout
                  time by 30%.
                </span>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="section">
          <div className="container">
            <h2 className="section-title">
              Everything you need to write it well
            </h2>
            <p className="section-sub">
              Six AI tools built into the editor, working on your real content.
            </p>
            <div className="feature-grid">
              {FEATURES.map(([icon, title, text]) => (
                <article className="feature" key={title}>
                  <span className="feature-icon">{icon}</span>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="how" className="section section-tint">
          <div className="container">
            <h2 className="section-title">
              From blank page to PDF in three steps
            </h2>
            <ol className="steps">
              {STEPS.map(([title, text], i) => (
                <li key={title}>
                  <span className="step-n">{i + 1}</span>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="templates" className="section">
          <div className="container">
            <h2 className="section-title">Five professional templates</h2>
            <p className="section-sub">
              Your content stays the same. Switch templates and the preview
              updates instantly.
            </p>
            <div className="tpl-grid">
              {TEMPLATES.map(([key, name, text]) => (
                <div className="tpl-card" key={key}>
                  <div className={`tpl-thumb thumb-${key}`} aria-hidden="true">
                    <div className="t-head" />
                    <div className="t-line" />
                    <div className="t-line s" />
                    <div className="t-h" />
                    <div className="t-line" />
                    <div className="t-line s" />
                  </div>
                  <h3>{name}</h3>
                  <p>{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="cta-band">
          <div className="container cta-inner">
            <h2>Ready to build your resume?</h2>
            <Link to={cta} className="btn btn-light btn-lg">
              {user ? "Go to dashboard" : "Create a free account"}
            </Link>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="container footer-inner">
          <Logo />
          <p>
            © {new Date().getFullYear()} ResumeAI. Your resumes are private to
            your account.
          </p>
        </div>
      </footer>
    </>
  );
}
