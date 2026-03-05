import request from "supertest";
import { afterEach, vi } from "vitest";
import app from "../app.js";
import { registerAndLogin } from "./helpers.js";

describe("AI API", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("enhances summary successfully", async () => {
    const { token } = await registerAndLogin();

    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [
          {
            content: {
              parts: [
                { text: "Results-driven data scientist with 8 years of Python and SQL expertise." },
              ],
            },
          },
        ],
      }),
    });

    const response = await request(app)
      .post("/api/ai/enhance-summary")
      .set("Authorization", `Bearer ${token}`)
      .send({
        summary: "8 years experienced with python and sql data scientist",
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.enhancedSummary).toContain("data scientist");
  });

  it("rejects short summary", async () => {
    const { token } = await registerAndLogin();
    const response = await request(app)
      .post("/api/ai/enhance-summary")
      .set("Authorization", `Bearer ${token}`)
      .send({ summary: "too short" });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("analyzes ATS score using provided resume data", async () => {
    const { token } = await registerAndLogin();
    const response = await request(app)
      .post("/api/ai/ats-analyze")
      .set("Authorization", `Bearer ${token}`)
      .send({
        resumeData: {
          professional_summary:
            "Data scientist with 5 years of experience building production ML systems that improved forecast accuracy by 18%.",
          skills: ["Python", "SQL", "Machine Learning", "Pandas", "TensorFlow"],
          personal_info: {
            full_name: "Raj",
            email: "raj@example.com",
            phone: "9999999999",
            profession: "Data Scientist",
            linkedin: "linkedin.com/in/raj",
          },
          experience: [
            {
              company: "Acme",
              position: "Data Scientist",
              description:
                "Built forecasting models and automated ETL pipelines, reducing reporting time by 30% and improving decision quality.",
            },
          ],
          education: [{ institution: "ABC University", degree: "B.Tech" }],
          project: [
            {
              name: "Demand Forecasting",
              description: "Designed a demand forecasting system used by supply teams across 4 regions.",
            },
          ],
        },
        targetRole: "Data Scientist",
        includeAiFeedback: false,
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.score).toBeGreaterThanOrEqual(0);
    expect(response.body.data.score).toBeLessThanOrEqual(100);
    expect(Array.isArray(response.body.data.breakdown)).toBe(true);
    expect(Array.isArray(response.body.data.improvements)).toBe(true);
  });

  it("validates ATS request payload", async () => {
    const { token } = await registerAndLogin();
    const response = await request(app)
      .post("/api/ai/ats-analyze")
      .set("Authorization", `Bearer ${token}`)
      .send({});

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("improves ATS using ai feedback", async () => {
    const { token } = await registerAndLogin();

    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [
          {
            content: {
              parts: [
                {
                  text: JSON.stringify({
                    improvements: ["Use stronger action verbs in summary"],
                    keywordSuggestions: ["machine learning", "pandas", "sql"],
                    rewrittenSummary:
                      "Data scientist with 5 years of experience building ML systems and improving forecast accuracy by 18%.",
                  }),
                },
              ],
            },
          },
        ],
      }),
    });

    const response = await request(app)
      .post("/api/ai/ats-improve")
      .set("Authorization", `Bearer ${token}`)
      .send({
        resumeData: {
          professional_summary: "data scientist with python",
          skills: ["python"],
          personal_info: {
            full_name: "Raj",
            email: "raj@example.com",
            phone: "9999999999",
            profession: "Data Scientist",
          },
          experience: [],
          education: [{ institution: "ABC University", degree: "B.Tech" }],
          project: [{ name: "Forecasting", description: "Built demand forecasting model." }],
        },
        targetRole: "Data Scientist",
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.resume.professional_summary.length).toBeGreaterThan(20);
    expect(response.body.data.resume.skills.length).toBeGreaterThan(1);
    expect(response.body.data.atsAfter.score).toBeGreaterThanOrEqual(response.body.data.atsBefore.score);
  });

  it("stores and fetches ats history for resumeId based improvements", async () => {
    const { token } = await registerAndLogin();

    const createdResumeResponse = await request(app)
      .post("/api/resumes")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "History Resume" });

    const resumeId = createdResumeResponse.body?.data?.resume?._id;
    expect(resumeId).toBeTruthy();

    await request(app)
      .put(`/api/resumes/${resumeId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        professional_summary: "Data analyst skilled in SQL and Python",
        skills: ["SQL", "Python"],
        personal_info: {
          full_name: "History User",
          email: "history@example.com",
          phone: "9999999999",
          profession: "Data Analyst",
        },
        education: [{ institution: "ABC University", degree: "B.Tech" }],
        project: [{ name: "BI Dashboard", description: "Built dashboards for analytics reporting." }],
      });

    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [
          {
            content: {
              parts: [
                {
                  text: JSON.stringify({
                    improvements: ["Add measurable outcomes"],
                    keywordSuggestions: ["pandas", "statistics"],
                    rewrittenSummary:
                      "Data analyst with experience in SQL and Python, delivering measurable reporting improvements.",
                  }),
                },
              ],
            },
          },
        ],
      }),
    });

    const improveResponse = await request(app)
      .post("/api/ai/ats-improve")
      .set("Authorization", `Bearer ${token}`)
      .send({ resumeId, targetRole: "Data Analyst" });

    expect(improveResponse.status).toBe(200);
    expect(improveResponse.body.success).toBe(true);

    const historyResponse = await request(app)
      .get(`/api/ai/ats-history/${resumeId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(historyResponse.status).toBe(200);
    expect(historyResponse.body.success).toBe(true);
    expect(Array.isArray(historyResponse.body.data.history)).toBe(true);
    expect(historyResponse.body.data.history.length).toBeGreaterThan(0);
    expect(historyResponse.body.data.history[0].resumeId).toBe(resumeId);
  });
});
