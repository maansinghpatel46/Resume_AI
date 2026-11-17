const test = require("node:test");
const assert = require("node:assert/strict");
const ai = require("../src/services/ai");

const completion =
  (content, ok = true, status = 200, headers = {}) =>
  async () => ({
    ok,
    status,
    headers: { get: (name) => headers[name.toLowerCase()] || null },
    json: async () =>
      ok
        ? { choices: [{ message: { content } }] }
        : { error: { message: "upstream failure" } },
  });
const resume = {
  personal: { fullName: "A B", jobTitle: "Developer" },
  skills: ["React", "Node.js"],
  experience: [{ role: "Dev", company: "Acme", description: "Built APIs" }],
};

test.beforeEach(() => {
  process.env.GROQ_API_KEY = "groq-test";
  process.env.GROQ_MODEL = "test-groq-model";
  process.env.OPENROUTER_API_KEY = "router-test";
  process.env.OPENROUTER_MODEL = "test-model:free";
  process.env.OPENROUTER_REQUIRE_ZDR = "true";
});
test.afterEach(() => {
  global.fetch = undefined;
});

test("missing provider configuration returns 503", async () => {
  delete process.env.GROQ_API_KEY;
  delete process.env.OPENROUTER_API_KEY;
  await assert.rejects(
    () => ai.grammar("hello there"),
    (e) => e.status === 503,
  );
});

test("Groq success uses OpenAI-compatible payload and keeps key in header", async () => {
  let seen;
  global.fetch = async (url, opts) => {
    seen = { url, opts };
    return completion("Corrected text")();
  };
  assert.equal(await ai.grammar("helo world"), "Corrected text");
  assert.match(seen.url, /api\.groq\.com/);
  assert.equal(seen.opts.headers.Authorization, "Bearer groq-test");
  assert.ok(!seen.url.includes("groq-test"));
  const body = JSON.parse(seen.opts.body);
  assert.equal(body.model, "test-groq-model");
  assert.equal(body.messages[0].role, "system");
});

test("falls back to OpenRouter when Groq is unavailable", async () => {
  const calls = [];
  global.fetch = async (url) => {
    calls.push(url);
    if (url.includes("groq.com")) return completion("", false, 503)();
    return completion("OpenRouter result")();
  };
  assert.equal(await ai.grammar("hello world"), "OpenRouter result");
  assert.ok(calls.some((url) => url.includes("groq.com")));
  assert.ok(calls.some((url) => url.includes("openrouter.ai")));
});

test("OpenRouter backup requires privacy-safe endpoints by default", async () => {
  let backupBody;
  global.fetch = async (url, opts) => {
    if (url.includes("groq.com")) return completion("", false, 503)();
    backupBody = JSON.parse(opts.body);
    return completion("Backup response")();
  };
  assert.equal(await ai.grammar("hello world"), "Backup response");
  assert.deepEqual(backupBody.provider, { data_collection: "deny", zdr: true });
});

test("JSON mode is sent for structured AI functions and bullets parses response", async () => {
  let body;
  global.fetch = async (_url, opts) => {
    body = JSON.parse(opts.body);
    return completion(
      '```json\n{"bullets":["Built APIs","Improved reliability"]}\n```',
    )();
  };
  assert.deepEqual(await ai.bullets({ role: "Developer" }), [
    "Built APIs",
    "Improved reliability",
  ]);
  assert.deepEqual(body.response_format, { type: "json_object" });
});

test("summary refuses empty resumes before calling provider", async () => {
  global.fetch = async () => {
    throw new Error("should not be called");
  };
  await assert.rejects(
    () => ai.summary({ personal: { fullName: "X" } }),
    (e) => e.status === 400,
  );
});

test("match normalises score and lists", async () => {
  global.fetch = completion(
    JSON.stringify({
      score: 140.4,
      matchedKeywords: ["React", 5],
      missingKeywords: "x",
      strengths: [],
      gaps: [],
      recommendations: ["Add AWS"],
    }),
  );
  const result = await ai.match(resume, "Looking for React and AWS");
  assert.equal(result.score, 100);
  assert.deepEqual(result.matchedKeywords, ["React"]);
});

test("suggestions normalises priority", async () => {
  global.fetch = completion(
    JSON.stringify({
      overallScore: 71,
      suggestions: [
        { area: "Experience", priority: "HIGH", tip: "Add metrics" },
        { tip: "Shorter summary", priority: "weird" },
      ],
    }),
  );
  const result = await ai.suggestions(resume);
  assert.equal(result.suggestions[0].priority, "high");
  assert.equal(result.suggestions[1].priority, "medium");
});

test("ATS score normalises returned values", async () => {
  global.fetch = completion(
    JSON.stringify({
      score: 87.6,
      breakdown: {
        content: 90,
        keywords: 80,
        sections: 110,
        readability: -5,
        completeness: "75",
      },
      strengths: ["Clear summary"],
      missingKeywords: ["AWS"],
      issues: ["No metrics"],
      recommendations: ["Add outcomes"],
    }),
  );
  const result = await ai.atsScore(resume, "React developer with AWS");
  assert.equal(result.score, 88);
  assert.equal(result.breakdown.sections, 100);
  assert.equal(result.breakdown.readability, 0);
});

test("interview questions returns structured questions", async () => {
  global.fetch = completion(
    JSON.stringify({
      questions: [
        {
          category: "Project",
          question: "Explain your API project",
          why: "Ownership",
          answerTips: ["Explain design"],
        },
      ],
    }),
  );
  const result = await ai.interviewQuestions(resume, "Node developer", 8);
  assert.equal(result.questions.length, 1);
});

test("cover letter requires job description", async () => {
  global.fetch = async () => {
    throw new Error("should not call");
  };
  await assert.rejects(
    () => ai.coverLetter(resume, ""),
    (e) => e.status === 400,
  );
  global.fetch = completion(
    "Dear Hiring Manager,\nI am interested in the role.",
  );
  assert.match(
    await ai.coverLetter(resume, "Seeking Node developer"),
    /Dear Hiring Manager/,
  );
});

test("429 switches provider instead of exhausting retry loop", async () => {
  const calls = [];
  global.fetch = async (url) => {
    calls.push(url);
    if (url.includes("groq.com")) return completion("", false, 429)();
    return completion("Backup worked")();
  };
  assert.equal(await ai.grammar("hello world"), "Backup worked");
  assert.equal(calls.length, 2);
});
