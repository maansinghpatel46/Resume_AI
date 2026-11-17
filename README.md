# ResumeAI

An AI-powered resume builder. React + Vite frontend, Node/Express REST API, MongoDB (Mongoose), JWT auth in an httpOnly cookie, Google Gemini for the AI features, and server-side PDF generation with Puppeteer.

## Features

- Landing page, register / login / logout, bcrypt password hashing, per-user data isolation
- Resume builder: personal info, summary, education, experience, skills, projects, certifications, languages (add / edit / delete multiple entries)
- Autosave (2s after your last edit) plus a manual Save button
- Five templates (Modern, Classic, Minimal, Professional, Executive) with an instant live preview
- PDF download (A4, real text, automatic page breaks, no cut-off content)
- Dashboard: total resumes, last edited, recently edited list, create / edit / duplicate / delete
- AI (all calls go through the backend, the API key never reaches the browser):
  - Professional summary generator
  - Content improver (summary, experience bullets, project descriptions)
  - Bullet point generator
  - Grammar correction
  - Job description matching (score, matched / missing keywords, recommended edits)
  - Resume quality suggestions
  - ATS readiness checker (general or job-specific content analysis with score breakdown and recommendations)

AI output is shown as a suggestion; you choose to accept or discard it. The ATS score is an AI-generated estimate of resume content and keyword readiness; it is not a score from a real ATS and does not inspect uploaded document formatting.

## Project structure


resumeai/
├── server/
│   ├── src/
│   │   ├── config/db.js            MongoDB connection
│   │   ├── models/                 User.js, Resume.js
│   │   ├── middleware/             auth (JWT cookie), validate, error handling
│   │   ├── routes/                 auth.js, resumes.js, ai.js, pdf.js
│   │   ├── services/ai.js          Gemini client + prompts + response normalisation
│   │   └── index.js                Express app
│   ├── test/ai.test.js             AI service tests (mocked Gemini responses)
│   └── .env.example
└── client/
    └── src/
        ├── pages/                  Landing, Auth, Dashboard, Builder, AtsChecker
        ├── components/             ResumePreview, ListEditor, AiTextTools, AiReview, ...
        ├── context/                AuthContext, Toast
        └── styles/                 index.css (app), templates.css (resume templates, also used for the PDF)


## Prerequisites

- Node.js 18.11 or newer
- MongoDB running locally, or a free MongoDB Atlas connection string
- A Gemini API key from https://aistudio.google.com/apikey

## Setup

```bash
# 1. Install dependencies (Puppeteer downloads Chromium during this step)
npm run install:all

# 2. Configure the server
cp server/.env.example server/.env
#    then edit server/.env (see the table below)

# 3. Run both apps in two terminals
npm run dev:server     # API on http://localhost:5000
npm run dev:client     # App on http://localhost:5173
```

Open http://localhost:5173. The Vite dev server proxies `/api` to the backend, so the auth cookie works without any CORS setup.

## Environment variables (`server/.env`)

| Variable         | Required | Description                                                                                                                  |
| ---------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `MONGODB_URI`    | yes      | e.g. `mongodb://127.0.0.1:27017/resumeai` or an Atlas URI                                                                    |
| `JWT_SECRET`     | yes      | Long random string (32+ chars). Generate one with `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
| `GEMINI_API_KEY` | for AI   | Google AI Studio key. Without it every AI endpoint returns a clear 503 message                                               |
| `GEMINI_MODEL`   | no       | Defaults to `gemini-2.5-flash`. Change it if Google retires or renames the model                                             |
| `JWT_EXPIRES_IN` | no       | Default `7d` (the cookie lifetime is fixed at 7 days)                                                                        |
| `CLIENT_URL`     | no       | Allowed CORS origin, default `http://localhost:5173`                                                                         |
| `PORT`           | no       | Default `5000`                                                                                                               |
| `NODE_ENV`       | no       | Set to `production` when deploying (enables `secure` cookies, which need HTTPS)                                              |

The client needs no environment variables.

## Production build

```bash
npm run build                      # builds client/dist
NODE_ENV=production npm start      # Express serves the API and the built app on one origin
```

Because the `secure` cookie flag is on in production, serve it over HTTPS (any host with a TLS proxy works). To try a production build locally over plain HTTP, leave `NODE_ENV` unset.

## API overview

| Method             | Path                                                                                          | Purpose                              |
| ------------------ | --------------------------------------------------------------------------------------------- | ------------------------------------ |
| POST               | `/api/auth/register`, `/api/auth/login`, `/api/auth/logout`                                   | Auth                                 |
| GET                | `/api/auth/me`                                                                                | Current user                         |
| GET / POST         | `/api/resumes`                                                                                | List (own) / create                  |
| GET / PUT / DELETE | `/api/resumes/:id`                                                                            | Read / update / delete (owner only)  |
| POST               | `/api/resumes/:id/duplicate`                                                                  | Duplicate                            |
| POST               | `/api/ai/summary`, `/improve`, `/grammar`, `/bullets`, `/match`, `/suggestions`, `/ats-score` | AI features                          |
| POST               | `/api/pdf`                                                                                    | Render the preview HTML to an A4 PDF |

## Security notes

- Passwords are hashed with bcrypt (cost 12); the hash is never returned by the API.
- The JWT lives in an httpOnly, SameSite=Lax cookie, so page scripts cannot read it.
- Every resume query filters by the logged-in user's id, so other users' resumes return 404.
- Input is validated with express-validator and Mongoose schema limits; unknown fields are dropped.
- Auth, AI and PDF endpoints are rate limited. Helmet sets security headers.
- The PDF endpoint renders HTML with JavaScript and all network requests disabled.
- Secrets come only from environment variables; `.env` is git-ignored.

## Tests

```bash
npm test
```

Runs the AI service tests with mocked Gemini responses (response parsing, normalisation, error mapping, key handling). They do not call the real API.

## Troubleshooting

- **"AI is not configured"**: set `GEMINI_API_KEY` in `server/.env` and restart the server.
- **"The AI request was rejected"**: the key or `GEMINI_MODEL` is wrong or no longer available.
- **PDF fails on Linux or in Docker**: Chromium needs system libraries (`libnss3`, `libatk-bridge2.0-0`, `libgbm1`, `libxkbcommon0`, `fonts-liberation`). Install them, or use the official `ghcr.io/puppeteer/puppeteer` base image.
- **Puppeteer did not download Chromium**: run `npx puppeteer browsers install chrome` inside `server/`.
- **Logged out immediately in production**: the secure cookie requires HTTPS.

## Additional career tools

- **ATS Score Checker** (`/ats-checker`): an AI-generated, content-only ATS-readiness estimate with score breakdown and recommendations. It does not parse the exported PDF or simulate a specific ATS vendor.
- **AI Job Matcher** (`/job-matcher`): compares a saved resume with a pasted job description.
- **AI Interview Questions** (`/interview-prep`): creates tailored technical, behavioral and project questions, optionally using a job description.
- **Cover Letter Generator** (`/cover-letter`): drafts a role-specific letter from a saved resume and job description.
- **Resume templates**: Modern, Classic, Minimal, Professional and Executive.
- **Version history**: resume saves retain up to 20 previous snapshots; open Version history from the builder to restore one.
- **Profile settings** (`/settings`): update name/email and optionally change password after confirming the current password.
- **Dark mode**: use the theme toggle in the signed-in navigation; the choice is stored in this browser.

AI tools require a valid `GEMINI_API_KEY` and `GEMINI_MODEL` in `server/.env`. AI output is a draft/estimate: review it for accuracy before using it in applications. Version history is per resume and is not a substitute for an external backup.

### Resume design styles

The builder includes nine live-preview and PDF designs: Modern, Classic, Minimal, Professional, Executive, Tech, Elegant, Creative, and Clean. Choose a design from the design picker in the resume editor; the selection is saved with the resume and used when exporting the PDF.

### Resume style customization

Inside the resume builder, open the **Customize style** tab to personalize the selected design. You can change the accent color, font family, font size, content spacing, and header style. These settings are saved with the resume and are used by both the live preview and PDF export.
