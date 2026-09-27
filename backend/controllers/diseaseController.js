const detectDisease = async (req, res) => {
  try {
    // Check whether image was uploaded
    if (!req.file) {
      return res.status(400).json({
        error: "No image uploaded",
      });
    }

    // Create form data
    const formData = new FormData();

    const blob = new Blob(
      [req.file.buffer],
      {
        type: req.file.mimetype,
      }
    );

    formData.append(
      "image",
      blob,
      req.file.originalname
    );

    // Send image to Python ML server
    const response = await fetch(
      "http://127.0.0.1:8000/predict",
      {
        method: "POST",
        body: formData,
      }
    );

    const result = await response.json();

    // Check ML response
    if (!response.ok) {
      return res.status(500).json({
        error: result.error || "ML prediction failed",
      });
    }

    // Send result to frontend
    res.json({
      class_id: result.class_id,
      confidence: result.confidence,
    });

  } catch (error) {
    console.error("Disease detection error:", error);

    res.status(500).json({
      error: "Disease detection failed",
      message: error.message,
    });
  }
};

module.exports = {
  detectDisease,
};