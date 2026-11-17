import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api, { errMsg } from "../api";
import Navbar from "../components/Navbar";
import Spinner from "../components/Spinner";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/Toast";
import { timeAgo } from "../utils";

const TEMPLATE_LABEL = {
  modern: "Modern",
  classic: "Classic",
  minimal: "Minimal",
};

function ResumeCard({ resume, busy, onDuplicate, onDelete }) {
  const sub = [resume.personal?.fullName, resume.personal?.jobTitle]
    .filter(Boolean)
    .join(" · ");
  return (
    <article className="resume-card">
      <div className={`card-thumb thumb-${resume.template}`} aria-hidden="true">
        <div className="t-head" />
        <div className="t-line" />
        <div className="t-line s" />
        <div className="t-h" />
        <div className="t-line" />
      </div>
      <div className="card-body">
        <div className="card-title">
          <Link to={`/resume/${resume._id}`}>{resume.title}</Link>
          <span className="tag">
            {TEMPLATE_LABEL[resume.template] || "Modern"}
          </span>
        </div>
        {sub && <p className="card-sub">{sub}</p>}
        <p className="card-meta">Edited {timeAgo(resume.updatedAt)}</p>
        <div className="card-actions">
          <Link to={`/resume/${resume._id}`} className="btn btn-primary btn-sm">
            Edit
          </Link>
          <button
            className="btn btn-outline btn-sm"
            disabled={busy}
            onClick={() => onDuplicate(resume)}
          >
            Duplicate
          </button>
          <button
            className="btn btn-danger-ghost btn-sm"
            disabled={busy}
            onClick={() => onDelete(resume)}
          >
            Delete
          </button>
        </div>
      </div>
    </article>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [resumes, setResumes] = useState(null);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");
  const [creating, setCreating] = useState(false);

  const load = () => {
    setError("");
    api
      .get("/resumes")
      .then((r) => setResumes(r.data.resumes))
      .catch((e) => setError(errMsg(e)));
  };
  useEffect(load, []);

  const stats = useMemo(() => {
    if (!resumes) return null;
    const week = Date.now() - 7 * 24 * 3600 * 1000;
    return {
      total: resumes.length,
      last: resumes[0] ? timeAgo(resumes[0].updatedAt) : "–",
      week: resumes.filter((r) => new Date(r.updatedAt).getTime() > week)
        .length,
    };
  }, [resumes]);

  const create = async () => {
    setCreating(true);
    try {
      const { data } = await api.post("/resumes", {});
      navigate(`/resume/${data.resume._id}`);
    } catch (e) {
      toast(errMsg(e), "error");
      setCreating(false);
    }
  };

  const duplicate = async (r) => {
    setBusyId(r._id);
    try {
      const { data } = await api.post(`/resumes/${r._id}/duplicate`);
      setResumes((list) => [data.resume, ...list]);
      toast("Resume duplicated");
    } catch (e) {
      toast(errMsg(e), "error");
    } finally {
      setBusyId("");
    }
  };

  const remove = async (r) => {
    if (!window.confirm(`Delete "${r.title}"? This cannot be undone.`)) return;
    setBusyId(r._id);
    try {
      await api.delete(`/resumes/${r._id}`);
      setResumes((list) => list.filter((x) => x._id !== r._id));
      toast("Resume deleted");
    } catch (e) {
      toast(errMsg(e), "error");
    } finally {
      setBusyId("");
    }
  };

  const recent = resumes?.slice(0, 3) || [];
  const older = resumes?.slice(3) || [];
  const card = (r) => (
    <ResumeCard
      key={r._id}
      resume={r}
      busy={busyId === r._id}
      onDuplicate={duplicate}
      onDelete={remove}
    />
  );

  return (
    <>
      <Navbar />
      <main className="container dash">
        <div className="dash-head">
          <div>
            <h1>Hi, {user.name.split(" ")[0]}</h1>
            <p className="muted">Create, edit and download your resumes.</p>
          </div>
          <div className="dash-head-actions">
            <Link to="/ats-checker" className="btn btn-ai btn-lg">
              ✦ ATS Checker
            </Link>
            <button
              className="btn btn-primary btn-lg"
              onClick={create}
              disabled={creating}
            >
              {creating ? "Creating…" : "+ Create new resume"}
            </button>
          </div>
        </div>

        <section className="tool-shortcuts" aria-label="AI tools">
          <Link to="/job-matcher" className="tool-shortcut">
            <strong>AI Job Matcher</strong>
            <span>Compare your resume with a job</span>
          </Link>
          <Link to="/interview-prep" className="tool-shortcut">
            <strong>Interview Prep</strong>
            <span>Practice tailored questions</span>
          </Link>
          <Link to="/cover-letter" className="tool-shortcut">
            <strong>Cover Letter</strong>
            <span>Create a targeted application letter</span>
          </Link>
        </section>

        {error && (
          <div className="alert alert-error" role="alert">
            {error}{" "}
            <button className="link-btn" onClick={load}>
              Retry
            </button>
          </div>
        )}
        {!resumes && !error && <Spinner />}

        {stats && (
          <>
            <div className="stats">
              <div className="stat">
                <span>Total resumes</span>
                <strong>{stats.total}</strong>
              </div>
              <div className="stat">
                <span>Last edited</span>
                <strong>{stats.last}</strong>
              </div>
              <div className="stat">
                <span>Edited this week</span>
                <strong>{stats.week}</strong>
              </div>
            </div>

            {resumes.length === 0 ? (
              <div className="empty">
                <h3>No resumes yet</h3>
                <p>
                  Create your first resume. We will fill in your name and email
                  to get you started.
                </p>
                <button
                  className="btn btn-primary"
                  onClick={create}
                  disabled={creating}
                >
                  Create your first resume
                </button>
              </div>
            ) : (
              <>
                <h2 className="dash-h">Recently edited</h2>
                <div className="card-grid">{recent.map(card)}</div>
                {older.length > 0 && (
                  <>
                    <h2 className="dash-h">All other resumes</h2>
                    <div className="card-grid">{older.map(card)}</div>
                  </>
                )}
              </>
            )}
          </>
        )}
      </main>
    </>
  );
}
