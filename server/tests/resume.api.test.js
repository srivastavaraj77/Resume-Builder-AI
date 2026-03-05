import request from "supertest";
import app from "../app.js";
import User from "../models/User.js";
import { registerAndLogin } from "./helpers.js";

describe("Resume API", () => {
  it("creates, fetches, updates, toggles visibility, reads public, and deletes a resume", async () => {
    const { token } = await registerAndLogin();

    const createResponse = await request(app)
      .post("/api/resumes")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "My Resume" });

    expect(createResponse.status).toBe(201);
    const resumeId = createResponse.body.data.resume._id;
    expect(resumeId).toBeDefined();

    const listResponse = await request(app)
      .get("/api/resumes")
      .set("Authorization", `Bearer ${token}`);
    expect(listResponse.status).toBe(200);
    expect(listResponse.body.data.resumes.length).toBe(1);

    const updateResponse = await request(app)
      .put(`/api/resumes/${resumeId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        professional_summary: "Experienced backend engineer",
        skills: ["Node.js", "MongoDB"],
      });
    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.data.resume.professional_summary).toContain("backend");

    const visibilityResponse = await request(app)
      .patch(`/api/resumes/${resumeId}/visibility`)
      .set("Authorization", `Bearer ${token}`)
      .send({ isPublic: true });
    expect(visibilityResponse.status).toBe(200);
    expect(visibilityResponse.body.data.resume.public).toBe(true);

    const publicResponse = await request(app).get(`/api/resumes/public/${resumeId}`);
    expect(publicResponse.status).toBe(200);
    expect(publicResponse.body.data.resume._id).toBe(resumeId);

    const deleteResponse = await request(app)
      .delete(`/api/resumes/${resumeId}`)
      .set("Authorization", `Bearer ${token}`);
    expect(deleteResponse.status).toBe(200);
    expect(deleteResponse.body.success).toBe(true);
  });

  it("blocks premium template updates but allows download access for free users", async () => {
    const { token } = await registerAndLogin();

    const createResponse = await request(app)
      .post("/api/resumes")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Free Plan Resume" });

    const resumeId = createResponse.body.data.resume._id;

    const premiumTemplateResponse = await request(app)
      .put(`/api/resumes/${resumeId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ template: "modern" });
    expect(premiumTemplateResponse.status).toBe(403);

    const downloadAccessResponse = await request(app)
      .get(`/api/resumes/${resumeId}/download-access`)
      .set("Authorization", `Bearer ${token}`);
    expect(downloadAccessResponse.status).toBe(200);
    expect(downloadAccessResponse.body.data.allowed).toBe(true);
  });

  it("allows premium template and download for pro users", async () => {
    const { token, user } = await registerAndLogin();

    await User.findByIdAndUpdate(user._id, {
      plan: "pro",
      subscriptionStatus: "active",
    });

    const createResponse = await request(app)
      .post("/api/resumes")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Pro Plan Resume" });

    const resumeId = createResponse.body.data.resume._id;

    const premiumTemplateResponse = await request(app)
      .put(`/api/resumes/${resumeId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ template: "modern" });
    expect(premiumTemplateResponse.status).toBe(200);

    const downloadAccessResponse = await request(app)
      .get(`/api/resumes/${resumeId}/download-access`)
      .set("Authorization", `Bearer ${token}`);
    expect(downloadAccessResponse.status).toBe(200);
    expect(downloadAccessResponse.body.data.allowed).toBe(true);
  });
});
