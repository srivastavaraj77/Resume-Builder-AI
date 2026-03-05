import request from "supertest";
import app from "../app.js";
import { registerAndLogin } from "./helpers.js";

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

  it("updates logged-in user profile", async () => {
    const { token } = await registerAndLogin();

    const response = await request(app)
      .put("/api/users/profile")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Updated User",
        phone: "9999999999",
        location: "Bengaluru",
        profession: "Frontend Developer",
        linkedin: "https://linkedin.com/in/updated-user",
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.user.name).toBe("Updated User");
    expect(response.body.data.user.phone).toBe("9999999999");
    expect(response.body.data.user.location).toBe("Bengaluru");
  });

  it("changes password and allows login with the new password", async () => {
    const { token, payload } = await registerAndLogin();

    const changeResponse = await request(app)
      .patch("/api/users/change-password")
      .set("Authorization", `Bearer ${token}`)
      .send({
        currentPassword: payload.password,
        newPassword: "NewPassword123",
        confirmNewPassword: "NewPassword123",
      });

    expect(changeResponse.status).toBe(200);
    expect(changeResponse.body.success).toBe(true);

    const oldLogin = await request(app).post("/api/users/login").send({
      email: payload.email,
      password: payload.password,
    });
    expect(oldLogin.status).toBe(401);

    const newLogin = await request(app).post("/api/users/login").send({
      email: payload.email,
      password: "NewPassword123",
    });
    expect(newLogin.status).toBe(200);
    expect(newLogin.body.success).toBe(true);
  });
});
