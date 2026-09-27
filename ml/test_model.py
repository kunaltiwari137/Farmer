from tensorflow.keras.models import load_model
from PIL import Image
import numpy as np

print("Loading model...")

model = load_model("model.h5", compile=False)

print("Model loaded successfully!")

# Load image
image = Image.open("test.jpg").convert("RGB")

print("Image loaded!")

# Resize to model input size
image = image.resize((128, 128))

# Convert image to numpy array
image = np.array(image)

# Normalize
image = image / 255.0

# Add batch dimension
image = np.expand_dims(image, axis=0)

print("Image prepared:", image.shape)

# Prediction
prediction = model.predict(image, verbose=0)

print("Prediction:", prediction)

# Find class
class_id = np.argmax(prediction)

# Find confidence
confidence = np.max(prediction) * 100

print("Class ID:", class_id)
print("Confidence:", round(confidence, 2), "%")