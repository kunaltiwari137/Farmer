const request = require("supertest");
const app = require("../server");

describe("Disease Detection API", () => {

  test("POST /api/disease/predict without image should return 400", async () => {

    const response = await request(app)
      .post("/api/disease/predict");

    expect(response.statusCode).toBe(400);

    expect(response.body.error)
      .toBe("No image uploaded");
  });


  test("POST /api/disease/predict should return prediction", async () => {

    const response = await request(app)
      .post("/api/disease/predict")
      .attach(
        "image",
        "../ml/test.jpg"
      );

    expect(response.statusCode).toBe(200);

    expect(response.body).toHaveProperty("class_id");
    expect(response.body).toHaveProperty("confidence");

    expect([0, 1]).toContain(response.body.class_id);

    expect(response.body.confidence)
      .toBeGreaterThanOrEqual(0);

    expect(response.body.confidence)
      .toBeLessThanOrEqual(100);
  });

});