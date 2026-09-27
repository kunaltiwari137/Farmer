const request = require("supertest");
const app = require("../server");

describe("Authentication API", () => {

  test("Signup should reject missing fields", async () => {

    const response = await request(app)
      .post("/api/auth/signup")
      .send({});

    expect(response.statusCode).toBe(400);

    expect(response.body)
      .toHaveProperty("error");
  });


  test("Signup should reject invalid role", async () => {

    const response = await request(app)
      .post("/api/auth/signup")
      .send({
        name: "Test User",
        email: "test@example.com",
        password: "123456",
        role: "admin"
      });

    expect(response.statusCode).toBe(400);

    expect(response.body.error)
      .toBe("Role must be 'farmer' or 'buyer'");
  });


  test("Login should reject invalid email format", async () => {

    const response = await request(app)
      .post("/api/auth/login")
      .send({
        email: "wrong-email",
        password: "123456"
      });

    expect(response.statusCode).toBe(400);

    expect(response.body.error)
      .toBe("Must be a valid email");
  });


  test("Login should reject missing password", async () => {

    const response = await request(app)
      .post("/api/auth/login")
      .send({
        email: "test@example.com"
      });

    expect(response.statusCode).toBe(400);

    expect(response.body.error)
      .toBe("Password is required");
  });

});