const jwt = require("jsonwebtoken");
const User = require("../models/User");

const COOKIE = "resumeai_token";

const cookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
});

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

const setAuthCookie = (res, userId) =>
  res.cookie(COOKIE, signToken(userId), {
    ...cookieOptions(),
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

const protect = async (req, res, next) => {
  try {
    const token = req.cookies?.[COOKIE];
    if (!token)
      return res.status(401).json({ message: "Please log in to continue" });
    const { id } = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(id);
    if (!user)
      return res
        .status(401)
        .json({ message: "Account not found. Please log in again." });
    req.user = user;
    next();
  } catch {
    res
      .status(401)
      .json({ message: "Your session has expired. Please log in again." });
  }
};

module.exports = { COOKIE, cookieOptions, setAuthCookie, protect };
