import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api, { errMsg } from "../api";
import Navbar from "../components/Navbar";
export default function ResumeHistory() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [versions, setVersions] = useState([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const load = () =>
    api
      .get(`/resumes/${id}/versions`)
      .then((r) => setVersions(r.data.versions))
      .catch((e) => setError(errMsg(e)));
  useEffect(() => {
    load();
  }, [id]);
  const restore = async (index) => {
    if (
      !window.confirm(
        "Restore this version? Your current resume will first be saved as a version.",
      )
    )
      return;
    setBusy(true);
    try {
      await api.post(`/resumes/${id}/versions/${index}/restore`);
      navigate(`/resume/${id}`);
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <Navbar />
      <main className="container narrow-page">
        <Link to={`/resume/${id}`} className="back-link">
          ← Back to resume
        </Link>
        <h1>Resume version history</h1>
        <p className="muted">
          Previous saved states are kept automatically, up to 20 versions.
        </p>
        {error && <div className="alert alert-error">{error}</div>}
        {versions.length === 0 ? (
          <div className="panel empty">
            <h3>No previous versions yet</h3>
            <p>
              Versions are created whenever you save changes to this resume.
            </p>
          </div>
        ) : (
          <div className="panel history-list">
            {versions.map((v) => (
              <div className="history-row" key={v.index}>
                <div>
                  <strong>{v.title}</strong>
                  <p className="muted">
                    {new Date(v.savedAt).toLocaleString()}
                  </p>
                </div>
                <button
                  className="btn btn-outline btn-sm"
                  disabled={busy}
                  onClick={() => restore(v.index)}
                >
                  Restore
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
