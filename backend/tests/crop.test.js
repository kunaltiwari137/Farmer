const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../server");
const connectDB = require("../config/mongodb");

// MongoDB Atlas connection can sometimes take more than Jest's
// default 5-second hook timeout.
jest.setTimeout(15000);

beforeAll(async () => {
  await connectDB();
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe("Crop API", () => {

  test("GET /api/crops should return available crops", async () => {

    const response = await request(app)
      .get("/api/crops");

    expect(response.statusCode).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);

  });


  test("POST /api/crops without authentication should return 401", async () => {

    const response = await request(app)
      .post("/api/crops")
      .send({
        crop_name: "Wheat",
        quantity: 10,
        price: 100
      });

    expect(response.statusCode).toBe(401);
  });


  test("POST /api/crops with missing crop data should not create crop", async () => {

    const response = await request(app)
      .post("/api/crops")
      .send({});

    expect([400, 401]).toContain(response.statusCode);

  });


  test("PUT /api/crops/:id without authentication should return 401", async () => {

    const response = await request(app)
      .put("/api/crops/invalid-id")
      .send({
        crop_name: "Wheat"
      });

    expect(response.statusCode).toBe(401);
  });


  test("DELETE /api/crops/:id without authentication should return 401", async () => {

    const response = await request(app)
      .delete("/api/crops/invalid-id");

    expect(response.statusCode).toBe(401);
  });


  test("GET /api/crops/:id with invalid ID should return an error response", async () => {

    const response = await request(app)
      .get("/api/crops/invalid-id");

    expect(response.statusCode).toBe(500);

    expect(response.body.error)
      .toBe("Failed to fetch crop");

  });

});