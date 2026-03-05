import request from "supertest";
import app from "../app.js";

export const registerAndLogin = async (overrides = {}) => {
  const unique = Date.now();
  const payload = {
    name: "Test User",
    email: `test${unique}@example.com`,
    password: "Password123",
    ...overrides,
  };

  const registerResponse = await request(app).post("/api/users/register").send(payload);
  const token = registerResponse.body?.data?.token;
  const user = registerResponse.body?.data?.user;

  return { token, user, payload, registerResponse };
};
