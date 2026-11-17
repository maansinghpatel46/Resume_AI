const router = require("express").Router();
const rateLimit = require("express-rate-limit");
const { body } = require("express-validator");
const puppeteer = require("puppeteer");
const validate = require("../middleware/validate");
const { protect } = require("../middleware/auth");
const { asyncHandler } = require("../middleware/error");

let browserPromise = null;
function getBrowser() {
  if (!browserPromise) {
    browserPromise = puppeteer
      .launch({
        headless: true,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
        ],
      })
      .then((b) => {
        b.on("disconnected", () => {
          browserPromise = null;
        });
        return b;
      })
      .catch((e) => {
        browserPromise = null;
        throw e;
      });
  }
  return browserPromise;
}

router.post(
  "/",
  protect,
  rateLimit({
    windowMs: 60 * 1000,
    limit: 15,
    keyGenerator: (req) => String(req.user._id),
    message: { message: "Too many PDF exports. Please wait a minute." },
  }),
  [
    body("html")
      .isString()
      .isLength({ min: 20, max: 1500000 })
      .withMessage("Resume HTML is required"),
    body("filename").optional().isString().isLength({ max: 120 }),
  ],
  validate,
  asyncHandler(async (req, res) => {
    const safeName =
      String(req.body.filename || "resume")
        .replace(/[^a-z0-9 _-]/gi, "")
        .trim()
        .slice(0, 60) || "resume";
    let page;
    try {
      const browser = await getBrowser();
      page = await browser.newPage();
      // The HTML comes from the logged-in user's own preview; still render it with scripts and network disabled.
      await page.setJavaScriptEnabled(false);
      await page.setRequestInterception(true);
      page.on("request", (r) =>
        r.url().startsWith("data:") || r.url() === "about:blank"
          ? r.continue()
          : r.abort(),
      );
      await page.setContent(req.body.html, {
        waitUntil: "load",
        timeout: 20000,
      });
      const pdf = await page.pdf({
        format: "A4",
        printBackground: true,
        preferCSSPageSize: true,
      });
      res.set({
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${safeName}.pdf"`,
        "Content-Length": pdf.length,
      });
      res.send(Buffer.from(pdf));
    } catch (e) {
      console.error("PDF generation failed:", e.message);
      const err = new Error("Could not generate the PDF. Please try again.");
      err.status = 500;
      err.expose = true;
      throw err;
    } finally {
      if (page) await page.close().catch(() => {});
    }
  }),
);

module.exports = router;
