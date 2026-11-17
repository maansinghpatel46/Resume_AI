import { Link, Route, Routes } from "react-router-dom";
import { Protected, PublicOnly } from "./components/RouteGuards";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Builder from "./pages/Builder";
import AtsChecker from "./pages/AtsChecker";
import AiCareerTools from "./pages/AiCareerTools";
import ProfileSettings from "./pages/ProfileSettings";
import ResumeHistory from "./pages/ResumeHistory";

function NotFound() {
  return (
    <div className="center-page">
      <h1>Page not found</h1>
      <p className="muted">The page you are looking for does not exist.</p>
      <Link to="/" className="btn btn-primary">
        Back to home
      </Link>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route
        path="/login"
        element={
          <PublicOnly>
            <Auth mode="login" />
          </PublicOnly>
        }
      />
      <Route
        path="/register"
        element={
          <PublicOnly>
            <Auth mode="register" />
          </PublicOnly>
        }
      />
      <Route
        path="/dashboard"
        element={
          <Protected>
            <Dashboard />
          </Protected>
        }
      />
      <Route
        path="/resume/:id"
        element={
          <Protected>
            <Builder />
          </Protected>
        }
      />
      <Route
        path="/ats-checker"
        element={
          <Protected>
            <AtsChecker />
          </Protected>
        }
      />
      <Route
        path="/job-matcher"
        element={
          <Protected>
            <AiCareerTools mode="matcher" />
          </Protected>
        }
      />
      <Route
        path="/interview-prep"
        element={
          <Protected>
            <AiCareerTools mode="interview" />
          </Protected>
        }
      />
      <Route
        path="/cover-letter"
        element={
          <Protected>
            <AiCareerTools mode="cover" />
          </Protected>
        }
      />
      <Route
        path="/settings"
        element={
          <Protected>
            <ProfileSettings />
          </Protected>
        }
      />
      <Route
        path="/resume/:id/history"
        element={
          <Protected>
            <ResumeHistory />
          </Protected>
        }
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
