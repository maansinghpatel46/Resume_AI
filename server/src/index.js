require("dotenv").config();
const dns = require("dns");

dns.setServers(["8.8.8.8", "1.1.1.1"]);

const fs = require("fs");
const path = require("path");
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");
const connectDB = require("./config/db");
const { notFound, errorHandler } = require("./middleware/error");

for (const key of ["MONGODB_URI", "JWT_SECRET"]) {
  if (!process.env[key]) {
    console.error(
      `Missing required environment variable: ${key}. Copy server/.env.example to server/.env.`,
    );
    process.exit(1);
  }
}
if (process.env.JWT_SECRET.length < 16) {
  console.error("JWT_SECRET is too short. Use at least 32 random characters.");
  process.exit(1);
}
if (
  !(process.env.GROQ_API_KEY && process.env.GROQ_MODEL) &&
  !(process.env.OPENROUTER_API_KEY && process.env.OPENROUTER_MODEL)
) {
  console.warn(
    "Warning: No AI provider configured. Set Groq and/or OpenRouter variables in server/.env.",
  );
}

const app = express();
app.set("trust proxy", 1);
app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  }),
);
app.use(express.json({ limit: "2mb" }));
app.use(cookieParser());

app.get("/api/health", (req, res) => res.json({ status: "ok" }));
app.use(
  "/api/auth",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 50,
    message: { message: "Too many attempts. Please try again later." },
  }),
  require("./routes/auth"),
);
app.use("/api/resumes", require("./routes/resumes"));
app.use("/api/ai", require("./routes/ai"));
app.use("/api/pdf", require("./routes/pdf"));
app.use("/api", notFound);

// In production the built React app is served by Express (single origin, so cookies just work).
const dist = path.join(__dirname, "../../client/dist");
if (fs.existsSync(dist)) {
  app.use(express.static(dist));
  app.get("*", (req, res) => res.sendFile(path.join(dist, "index.html")));
}

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
connectDB()
  .then(() =>
    app.listen(PORT, () =>
      console.log(`ResumeAI API listening on http://localhost:${PORT}`),
    ),
  )
  .catch((e) => {
    console.error("Failed to start server:", e.message);
    process.exit(1);
  });
