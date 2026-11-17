import { useState } from "react";
import { Link } from "react-router-dom";
import api, { errMsg } from "../api";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/Toast";
export default function ProfileSettings() {
  const { user, refreshUser } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    currentPassword: "",
    newPassword: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const change = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const { data } = await api.put("/auth/profile", form);
      refreshUser?.(data.user);
      setForm((f) => ({ ...f, currentPassword: "", newPassword: "" }));
      toast("Profile updated successfully");
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
        <Link to="/dashboard" className="back-link">
          ← Dashboard
        </Link>
        <h1>Profile settings</h1>
        <p className="muted">Update your account details and password.</p>
        <form className="panel settings-form" onSubmit={submit}>
          {error && <div className="alert alert-error">{error}</div>}
          <label className="field">
            <span>Full name</span>
            <input
              name="name"
              value={form.name}
              onChange={change}
              minLength="2"
              maxLength="80"
              required
            />
          </label>
          <label className="field">
            <span>Email</span>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={change}
              required
            />
          </label>
          <hr />
          <h3>Change password (optional)</h3>
          <label className="field">
            <span>Current password</span>
            <input
              type="password"
              name="currentPassword"
              value={form.currentPassword}
              onChange={change}
              autoComplete="current-password"
            />
          </label>
          <label className="field">
            <span>New password</span>
            <input
              type="password"
              name="newPassword"
              value={form.newPassword}
              onChange={change}
              minLength="8"
              autoComplete="new-password"
              placeholder="At least 8 characters, including a letter and number"
            />
          </label>
          <button className="btn btn-primary" disabled={busy}>
            {busy ? "Saving…" : "Save changes"}
          </button>
        </form>
      </main>
    </>
  );
}
