const fs = require("fs");

async function testDisease() {

  const image = fs.readFileSync(
    "../ml/test.jpg"
  );

  const blob = new Blob(
    [image],
    { type: "image/jpeg" }
  );

  const formData = new FormData();

  formData.append(
    "image",
    blob,
    "test.jpg"
  );

  const response = await fetch(
    "http://localhost:5000/api/disease/predict",
    {
      method: "POST",
      body: formData
    }
  );

  const result = await response.json();

  console.log("Status:", response.status);
  console.log("Result:", result);
}

testDisease();