import request from "supertest";
import app from "../app.js";

describe("Auth API", () => {
  it("registers a user and returns token + user data", async () => {
    const response = await request(app).post("/api/users/register").send({
      name: "Raj",
      email: "raj@example.com",
      password: "Password123",
    });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.token).toBeDefined();
    expect(response.body.data.user.email).toBe("raj@example.com");
  });

  it("logs in with valid credentials", async () => {
    await request(app).post("/api/users/register").send({
      name: "Raj",
      email: "raj@example.com",
      password: "Password123",
    });

    const response = await request(app).post("/api/users/login").send({
      email: "raj@example.com",
      password: "Password123",
    });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.token).toBeDefined();
  });

  it("rejects invalid login", async () => {
    const response = await request(app).post("/api/users/login").send({
      email: "wrong@example.com",
      password: "Password123",
    });

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe("INVALID_CREDENTIALS");
  });
});
