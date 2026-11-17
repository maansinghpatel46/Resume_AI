const router = require("express").Router();
const rateLimit = require("express-rate-limit");
const { body } = require("express-validator");
const ai = require("../services/ai");
const validate = require("../middleware/validate");
const { protect } = require("../middleware/auth");
const { asyncHandler } = require("../middleware/error");

router.use(protect);
router.use(
  rateLimit({
    windowMs: 60 * 1000,
    limit: 20,
    keyGenerator: (req) => String(req.user._id),
    message: {
      message: "Too many AI requests. Please wait a minute and try again.",
    },
    standardHeaders: true,
    legacyHeaders: false,
  }),
);

const text = (field, max, min = 1) =>
  body(field)
    .isString()
    .withMessage(`${field} must be text`)
    .bail()
    .trim()
    .isLength({ min, max })
    .withMessage(`${field} must be ${min}–${max} characters`);
const resumeObj = body("resume")
  .isObject()
  .withMessage("Resume data is required");
const optional = (field, max) =>
  body(field)
    .optional({ values: "falsy" })
    .isString()
    .isLength({ max })
    .withMessage(`${field} is too long`);

router.post(
  "/summary",
  resumeObj,
  validate,
  asyncHandler(async (req, res) => {
    res.json({ summary: await ai.summary(req.body.resume) });
  }),
);

router.post(
  "/improve",
  [
    text("text", 4000, 5),
    body("context")
      .optional()
      .isIn(["summary", "bullets", "project", "general"])
      .withMessage("Invalid context"),
  ],
  validate,
  asyncHandler(async (req, res) => {
    res.json({ text: await ai.improve(req.body.text, req.body.context) });
  }),
);

router.post(
  "/grammar",
  [text("text", 4000, 2)],
  validate,
  asyncHandler(async (req, res) => {
    res.json({ text: await ai.grammar(req.body.text) });
  }),
);

router.post(
  "/bullets",
  [text("role", 100, 2), optional("company", 150), optional("details", 2000)],
  validate,
  asyncHandler(async (req, res) => {
    res.json({ bullets: await ai.bullets(req.body) });
  }),
);

router.post(
  "/match",
  [resumeObj, text("jobDescription", 8000, 30)],
  validate,
  asyncHandler(async (req, res) => {
    res.json({
      result: await ai.match(req.body.resume, req.body.jobDescription),
    });
  }),
);

router.post(
  "/suggestions",
  resumeObj,
  validate,
  asyncHandler(async (req, res) => {
    res.json({ result: await ai.suggestions(req.body.resume) });
  }),
);

router.post(
  "/ats-score",
  [resumeObj, optional("jobDescription", 8000)],
  validate,
  asyncHandler(async (req, res) => {
    res.json({
      result: await ai.atsScore(req.body.resume, req.body.jobDescription || ""),
    });
  }),
);

router.post(
  "/interview-questions",
  [
    resumeObj,
    optional("jobDescription", 8000),
    body("count").optional().isInt({ min: 5, max: 15 }),
  ],
  validate,
  asyncHandler(async (req, res) => {
    res.json({
      result: await ai.interviewQuestions(
        req.body.resume,
        req.body.jobDescription || "",
        req.body.count || 10,
      ),
    });
  }),
);

router.post(
  "/cover-letter",
  [resumeObj, text("jobDescription", 8000, 30), optional("company", 150)],
  validate,
  asyncHandler(async (req, res) => {
    res.json({
      result: await ai.coverLetter(
        req.body.resume,
        req.body.jobDescription,
        req.body.company || "",
      ),
    });
  }),
);

module.exports = router;
