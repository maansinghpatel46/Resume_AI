import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { errMsg } from "../api";
import { EMAIL_RE } from "../utils";
import Logo from "../components/Logo";
import { Input } from "../components/Fields";

export default function Auth({ mode }) {
  const isLogin = mode === "login";
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [busy, setBusy] = useState(false);

  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  const validate = () => {
    const e = {};
    if (!isLogin && form.name.trim().length < 2)
      e.name = "Enter your name (at least 2 characters)";
    if (!EMAIL_RE.test(form.email.trim()))
      e.email = "Enter a valid email address";
    if (isLogin) {
      if (!form.password) e.password = "Enter your password";
    } else if (
      form.password.length < 8 ||
      !/[A-Za-z]/.test(form.password) ||
      !/\d/.test(form.password)
    ) {
      e.password = "Use at least 8 characters with a letter and a number";
    }
    return e;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    setServerError("");
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) return;
    setBusy(true);
    try {
      if (isLogin) await login(form.email.trim(), form.password);
      else await register(form.name.trim(), form.email.trim(), form.password);
      navigate(location.state?.from || "/dashboard", { replace: true });
    } catch (err) {
      setServerError(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-page">
      <aside className="auth-aside">
        <Link to="/">
          <Logo />
        </Link>
        <h2>Your next application starts here.</h2>
        <p>
          Build, tailor and download resumes in one place. Every resume is
          private to your account.
        </p>
      </aside>
      <main className="auth-main">
        <form className="auth-card" onSubmit={submit} noValidate>
          <h1>{isLogin ? "Welcome back" : "Create your account"}</h1>
          <p className="muted">
            {isLogin
              ? "Log in to continue to your resumes."
              : "It takes less than a minute."}
          </p>
          {serverError && (
            <div className="alert alert-error" role="alert">
              {serverError}
            </div>
          )}
          {!isLogin && (
            <Input
              label="Full name"
              value={form.name}
              onChange={set("name")}
              error={errors.name}
              maxLength={80}
              full
            />
          )}
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={set("email")}
            error={errors.email}
            maxLength={120}
            full
          />
          <Input
            label="Password"
            type="password"
            value={form.password}
            onChange={set("password")}
            error={errors.password}
            maxLength={72}
            full
          />
          <button className="btn btn-primary btn-block" disabled={busy}>
            {busy ? "Please wait…" : isLogin ? "Log in" : "Create account"}
          </button>
          <p className="auth-switch">
            {isLogin ? (
              <>
                New to ResumeAI? <Link to="/register">Create an account</Link>
              </>
            ) : (
              <>
                Already have an account? <Link to="/login">Log in</Link>
              </>
            )}
          </p>
        </form>
      </main>
    </div>
  );
}
