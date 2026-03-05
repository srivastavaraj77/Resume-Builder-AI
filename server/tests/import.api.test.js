import request from "supertest";
import app from "../app.js";
import { registerAndLogin } from "./helpers.js";

describe("Import API", () => {
  it("returns validation error when preview called without file", async () => {
    const { token } = await registerAndLogin();

    const response = await request(app)
      .post("/api/import/resume-preview")
      .set("Authorization", `Bearer ${token}`)
      .field("title", "Imported Resume");

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("creates resume from confirmed parsed payload", async () => {
    const { token } = await registerAndLogin();

    const response = await request(app)
      .post("/api/import/resume-confirm")
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "Imported Resume",
        parsedResume: {
          professional_summary: "Backend engineer with strong API design skills.",
          skills: ["Node.js", "Express", "MongoDB"],
          personal_info: {
            full_name: "Imported User",
            email: "imported@example.com",
          },
          experience: [],
          education: [],
          project: [],
        },
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.resume.title).toBe("Imported Resume");
    expect(response.body.data.resume.skills).toContain("Node.js");
  });
});
