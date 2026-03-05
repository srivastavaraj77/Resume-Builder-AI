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
});
