import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Logo from "./Logo";

export default function Navbar({ landing = false }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [dark, setDark] = useState(
    () => localStorage.getItem("resumeai-theme") === "dark",
  );
  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.dataset.theme = next ? "dark" : "light";
    localStorage.setItem("resumeai-theme", next ? "dark" : "light");
  };

  const signOut = async () => {
    await logout();
    navigate("/");
  };

  return (
    <header className="nav">
      <div className="container nav-inner">
        <Link
          to={user && !landing ? "/dashboard" : "/"}
          aria-label="ResumeAI home"
        >
          <Logo />
        </Link>
        <button
          className="nav-toggle"
          aria-label="Toggle menu"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
        >
          <span />
          <span />
          <span />
        </button>
        <nav
          className={`nav-links ${open ? "open" : ""}`}
          onClick={() => setOpen(false)}
        >
          {landing && (
            <>
              <a href="#features">Features</a>
              <a href="#how">How it works</a>
              <a href="#templates">Templates</a>
            </>
          )}
          {user ? (
            <>
              <Link to="/dashboard">Dashboard</Link>
              <Link to="/settings">Settings</Link>
              <button
                className="btn btn-ghost btn-sm theme-toggle"
                onClick={toggleTheme}
                aria-label="Toggle dark mode"
              >
                {dark ? "☀ Light" : "☾ Dark"}
              </button>
              <span className="nav-user">{user.name}</span>
              <button className="btn btn-outline btn-sm" onClick={signOut}>
                Log out
              </button>
            </>
          ) : (
            <>
              <Link to="/login">Log in</Link>
              <Link to="/register" className="btn btn-primary btn-sm">
                Get started
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
