const router = require("express").Router();
const { param } = require("express-validator");
const Resume = require("../models/Resume");
const validate = require("../middleware/validate");
const { protect } = require("../middleware/auth");
const { asyncHandler } = require("../middleware/error");

const MAX_RESUMES = 50;
const EDITABLE = [
  "title",
  "template",
  "customStyle",
  "personal",
  "summary",
  "education",
  "experience",
  "skills",
  "projects",
  "certifications",
  "languages",
];
const pick = (body = {}) =>
  EDITABLE.reduce(
    (o, k) => (body[k] !== undefined ? ((o[k] = body[k]), o) : o),
    {},
  );
const idRule = param("id").isMongoId().withMessage("Invalid resume id");

router.use(protect);

// Every query is scoped to req.user so users can only reach their own resumes.
const findOwned = (req) =>
  Resume.findOne({ _id: req.params.id, user: req.user._id });
const notFound = (res) => res.status(404).json({ message: "Resume not found" });

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const resumes = await Resume.find({ user: req.user._id })
      .select(
        "title template createdAt updatedAt personal.fullName personal.jobTitle",
      )
      .sort("-updatedAt");
    res.json({ resumes });
  }),
);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    if ((await Resume.countDocuments({ user: req.user._id })) >= MAX_RESUMES) {
      return res
        .status(400)
        .json({ message: `You can have up to ${MAX_RESUMES} resumes` });
    }
    const data = pick(req.body);
    data.personal = {
      fullName: req.user.name,
      email: req.user.email,
      ...(data.personal || {}),
    };
    const resume = await Resume.create({ ...data, user: req.user._id });
    res.status(201).json({ resume });
  }),
);

router.get(
  "/:id",
  idRule,
  validate,
  asyncHandler(async (req, res) => {
    const resume = await findOwned(req);
    if (!resume) return notFound(res);
    res.json({ resume });
  }),
);

router.put(
  "/:id",
  idRule,
  validate,
  asyncHandler(async (req, res) => {
    const resume = await findOwned(req);
    if (!resume) return notFound(res);
    const previous = resume.toObject();
    delete previous._id;
    delete previous.user;
    delete previous.versions;
    delete previous.__v;
    const latest = resume.versions?.[resume.versions.length - 1];
    const recentSnapshot =
      latest && Date.now() - new Date(latest.savedAt).getTime() < 2 * 60 * 1000;
    if (!recentSnapshot)
      resume.versions = [
        ...(resume.versions || []),
        { savedAt: new Date(), data: previous },
      ].slice(-20);
    resume.set(pick(req.body));
    await resume.save();
    res.json({ resume });
  }),
);

router.get(
  "/:id/versions",
  idRule,
  validate,
  asyncHandler(async (req, res) => {
    const resume = await findOwned(req);
    if (!resume) return notFound(res);
    res.json({
      versions: (resume.versions || [])
        .map((v, index) => ({
          index,
          savedAt: v.savedAt,
          title: v.data?.title || "Resume version",
        }))
        .reverse(),
    });
  }),
);

router.post(
  "/:id/versions/:version/restore",
  [idRule, param("version").isInt({ min: 0 })],
  validate,
  asyncHandler(async (req, res) => {
    const resume = await findOwned(req);
    if (!resume) return notFound(res);
    const version = resume.versions?.[Number(req.params.version)];
    if (!version?.data)
      return res.status(404).json({ message: "Resume version not found" });
    const current = resume.toObject();
    delete current._id;
    delete current.user;
    delete current.versions;
    delete current.__v;
    resume.versions = [
      ...(resume.versions || []),
      { savedAt: new Date(), data: current },
    ].slice(-20);
    resume.set(version.data);
    await resume.save();
    res.json({ resume });
  }),
);

router.delete(
  "/:id",
  idRule,
  validate,
  asyncHandler(async (req, res) => {
    const result = await Resume.deleteOne({
      _id: req.params.id,
      user: req.user._id,
    });
    if (!result.deletedCount) return notFound(res);
    res.json({ message: "Resume deleted" });
  }),
);

router.post(
  "/:id/duplicate",
  idRule,
  validate,
  asyncHandler(async (req, res) => {
    if ((await Resume.countDocuments({ user: req.user._id })) >= MAX_RESUMES) {
      return res
        .status(400)
        .json({ message: `You can have up to ${MAX_RESUMES} resumes` });
    }
    const src = await findOwned(req).lean();
    if (!src) return notFound(res);
    const copy = pick(src);
    copy.title = `${src.title} (Copy)`.slice(0, 100);
    const resume = await Resume.create({ ...copy, user: req.user._id });
    res.status(201).json({ resume });
  }),
);

module.exports = router;
