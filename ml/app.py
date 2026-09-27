from flask import Flask, request, jsonify
from flask_cors import CORS
from tensorflow.keras.models import load_model
from PIL import Image
import numpy as np

app = Flask(__name__)
CORS(app)

# Load model
print("Loading model...")

model = load_model("model.h5", compile=False)

print("Model loaded successfully!")


@app.route("/")
def home():
    return "AgriConnect ML API is running"


@app.route("/predict", methods=["POST"])
def predict():

    # Check image
    if "image" not in request.files:
        return jsonify({
            "error": "No image uploaded"
        }), 400

    file = request.files["image"]

    try:
        # Open image
        image = Image.open(file).convert("RGB")

        # Resize
        image = image.resize((128, 128))

        # Convert to numpy
        image = np.array(image)

        # Normalize
        image = image / 255.0

        # Add batch dimension
        image = np.expand_dims(image, axis=0)

        # Predict
        prediction = model.predict(image, verbose=0)

        # Get class
        class_id = int(np.argmax(prediction))

        # Get confidence
        confidence = float(np.max(prediction) * 100)

        return jsonify({
            "class_id": class_id,
            "confidence": round(confidence, 2)
        })

    except Exception as e:

        return jsonify({
            "error": str(e)
        }), 500


if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=8000,
        debug=False
    )