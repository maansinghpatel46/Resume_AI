const mongoose = require("mongoose");

const str = (max = 200) => ({
  type: String,
  trim: true,
  maxlength: max,
  default: "",
});
const maxLen = (n) => ({
  validator: (v) => v.length <= n,
  message: `Too many entries (maximum ${n})`,
});

const education = new mongoose.Schema({
  school: str(150),
  degree: str(100),
  field: str(100),
  startDate: str(10),
  endDate: str(10),
  description: str(1000),
});
const experience = new mongoose.Schema({
  company: str(150),
  role: str(100),
  location: str(100),
  startDate: str(10),
  endDate: str(10),
  current: { type: Boolean, default: false },
  description: str(3000),
});
const project = new mongoose.Schema({
  name: str(120),
  link: str(200),
  tech: str(200),
  description: str(1500),
});
const certification = new mongoose.Schema({
  name: str(150),
  issuer: str(120),
  date: str(10),
});
const language = new mongoose.Schema({ name: str(50), level: str(30) });

const resumeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, "Resume title is required"],
      trim: true,
      maxlength: 100,
      default: "Untitled Resume",
    },
    template: {
      type: String,
      enum: [
        "modern",
        "classic",
        "minimal",
        "professional",
        "executive",
        "tech",
        "elegant",
        "creative",
        "clean",
      ],
      default: "modern",
    },
    customStyle: {
      accentColor: {
        type: String,
        default: "#2563eb",
        match: /^#[0-9a-fA-F]{6}$/,
      },
      fontFamily: {
        type: String,
        enum: ["Arial", "Georgia", "Verdana", "Tahoma", "Trebuchet MS"],
        default: "Arial",
      },
      fontSize: {
        type: String,
        enum: ["small", "medium", "large"],
        default: "medium",
      },
      spacing: {
        type: String,
        enum: ["compact", "comfortable", "airy"],
        default: "comfortable",
      },
      headerStyle: {
        type: String,
        enum: ["classic", "centered", "banner", "minimal"],
        default: "classic",
      },
    },
    personal: {
      fullName: str(100),
      jobTitle: str(100),
      email: {
        ...str(120),
        match: [/^\S+@\S+\.\S+$/, "Enter a valid email address"],
      },
      phone: str(40),
      location: str(100),
      website: str(200),
      linkedin: str(200),
    },
    summary: str(2000),
    education: { type: [education], validate: maxLen(15) },
    experience: { type: [experience], validate: maxLen(15) },
    skills: {
      type: [{ type: String, trim: true, maxlength: 50 }],
      validate: maxLen(60),
    },
    projects: { type: [project], validate: maxLen(15) },
    certifications: { type: [certification], validate: maxLen(20) },
    languages: { type: [language], validate: maxLen(15) },
    versions: { type: [mongoose.Schema.Types.Mixed], default: [] },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Resume", resumeSchema);
