const router = require("express").Router();
const bcrypt = require("bcryptjs");
const { body } = require("express-validator");
const User = require("../models/User");
const validate = require("../middleware/validate");
const { asyncHandler } = require("../middleware/error");
const {
  COOKIE,
  cookieOptions,
  setAuthCookie,
  protect,
} = require("../middleware/auth");

const publicUser = (u) => ({ id: u._id, name: u.name, email: u.email });
// Used so a login for an unknown email takes as long as a real one.
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", 12);

router.post(
  "/register",
  [
    body("name")
      .isString()
      .trim()
      .isLength({ min: 2, max: 80 })
      .withMessage("Name must be 2–80 characters"),
    body("email")
      .isString()
      .trim()
      .toLowerCase()
      .isEmail()
      .withMessage("Enter a valid email address"),
    body("password")
      .isString()
      .isLength({ min: 8, max: 72 })
      .withMessage("Password must be 8–72 characters")
      .matches(/[A-Za-z]/)
      .withMessage("Password must contain a letter")
      .matches(/\d/)
      .withMessage("Password must contain a number"),
  ],
  validate,
  asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;
    if (await User.findOne({ email })) {
      return res
        .status(409)
        .json({ message: "An account with this email already exists" });
    }
    const user = await User.create({
      name,
      email,
      password: await bcrypt.hash(password, 12),
    });
    setAuthCookie(res, user._id);
    res.status(201).json({ user: publicUser(user) });
  }),
);

router.post(
  "/login",
  [
    body("email")
      .isString()
      .trim()
      .toLowerCase()
      .isEmail()
      .withMessage("Enter a valid email address"),
    body("password").isString().notEmpty().withMessage("Password is required"),
  ],
  validate,
  asyncHandler(async (req, res) => {
    const user = await User.findOne({ email: req.body.email }).select(
      "+password",
    );
    const ok = await bcrypt.compare(
      req.body.password,
      user ? user.password : DUMMY_HASH,
    );
    if (!user || !ok)
      return res.status(401).json({ message: "Incorrect email or password" });
    setAuthCookie(res, user._id);
    res.json({ user: publicUser(user) });
  }),
);

router.get("/me", protect, (req, res) =>
  res.json({ user: publicUser(req.user) }),
);

router.put(
  "/profile",
  protect,
  [
    body("name")
      .isString()
      .trim()
      .isLength({ min: 2, max: 80 })
      .withMessage("Name must be 2–80 characters"),
    body("email")
      .isString()
      .trim()
      .toLowerCase()
      .isEmail()
      .withMessage("Enter a valid email address"),
    body("currentPassword").optional({ values: "falsy" }).isString(),
    body("newPassword")
      .optional({ values: "falsy" })
      .isString()
      .isLength({ min: 8, max: 72 })
      .matches(/[A-Za-z]/)
      .matches(/\d/)
      .withMessage(
        "New password must be at least 8 characters and include a letter and number",
      ),
  ],
  validate,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).select("+password");
    const email = req.body.email.toLowerCase();
    const duplicate = await User.findOne({ email, _id: { $ne: user._id } });
    if (duplicate)
      return res.status(409).json({ message: "This email is already in use" });
    if (req.body.newPassword) {
      if (
        !req.body.currentPassword ||
        !(await bcrypt.compare(req.body.currentPassword, user.password))
      )
        return res
          .status(400)
          .json({ message: "Current password is incorrect" });
      user.password = await bcrypt.hash(req.body.newPassword, 12);
    }
    user.name = req.body.name;
    user.email = email;
    await user.save();
    res.json({ user: publicUser(user) });
  }),
);

router.post("/logout", (req, res) => {
  res.clearCookie(COOKIE, cookieOptions());
  res.json({ message: "Logged out" });
});

module.exports = router;
