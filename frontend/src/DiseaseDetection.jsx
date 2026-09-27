import React, { useState } from "react";

function DiseaseDetection() {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleImageChange = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    setImage(file);
    setPreview(URL.createObjectURL(file));
    setResult(null);
  };

  const detectDisease = async () => {
    if (!image) {
      alert("Please upload a plant image first");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("image", image);

      const response = await fetch(
        "http://localhost:5000/api/disease/predict",
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Prediction failed");
      }

      setResult(data);
    } catch (error) {
      console.error(error);
      alert("Disease detection failed");
    }

    setLoading(false);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "40px 20px",
        background: "#f5f7f2",
      }}
    >
      <div
        style={{
          maxWidth: "650px",
          margin: "auto",
          background: "white",
          padding: "35px",
          borderRadius: "18px",
          boxShadow: "0 5px 20px rgba(0,0,0,0.12)",
          textAlign: "center",
        }}
      >
        <h1
          style={{
            color: "#245c2a",
            marginBottom: "10px",
          }}
        >
          🌱 Plant Disease Detection
        </h1>

        <p style={{ color: "#555" }}>
          Upload a clear image of your plant leaf.
        </p>

        <input
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          style={{ marginTop: "15px" }}
        />

        {preview && (
          <div style={{ marginTop: "25px" }}>
            <img
              src={preview}
              alt="Plant preview"
              style={{
                width: "300px",
                height: "300px",
                objectFit: "cover",
                borderRadius: "12px",
              }}
            />
          </div>
        )}

        <button
          onClick={detectDisease}
          disabled={loading}
          style={{
            marginTop: "25px",
            padding: "13px 28px",
            fontSize: "16px",
            border: "none",
            borderRadius: "8px",
            cursor: loading ? "not-allowed" : "pointer",
            background: "#2e7d32",
            color: "white",
          }}
        >
          {loading ? "Detecting..." : "🔍 Detect Disease"}
        </button>

        {result && (
          <div
            style={{
              marginTop: "30px",
              padding: "25px",
              borderRadius: "12px",
              background:
                result.class_id === 0
                  ? "#fff3f3"
                  : "#f0f8f0",
            }}
          >
            <h2 style={{ color: "#333" }}>
              Detection Result
            </h2>

            {result.class_id === 0 ? (
              <>
                <h3 style={{ color: "#c62828" }}>
                  ⚠️ Disease Detected
                </h3>

                <p style={{ color: "#555" }}>
                  The uploaded plant appears to have a disease.
                </p>
              </>
            ) : (
              <>
                <h3 style={{ color: "#2e7d32" }}>
                  ✅ Healthy Plant
                </h3>

                <p style={{ color: "#555" }}>
                  No disease was detected in the uploaded image.
                </p>
              </>
            )}

            <p style={{ color: "#333" }}>
              <strong>Confidence:</strong>{" "}
              {result.confidence}%
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default DiseaseDetection;