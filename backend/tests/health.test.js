const request = require("supertest");
const app = require("../server");

describe("AgriConnect API", () => {
  test("GET / should return API running message", async () => {
    const response = await request(app).get("/");

    expect(response.statusCode).toBe(200);
    expect(response.text).toContain("AgriConnect API is running");
  });
});