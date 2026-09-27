# 🌾 AgriConnect

AgriConnect is a web-based agriculture platform that connects farmers and buyers. 
It allows farmers to list their crops for sale, while buyers can browse, search, 
and purchase available agricultural products.

The project also includes an AI-based plant disease detection system that 
analyzes a plant leaf image and predicts whether the plant is diseased or healthy.

## 🚀 Features

### 👨‍🌾 Farmer
- Farmer registration and login
- Farmer profile
- List crops for sale
- Manage crops
- View farm orders
- Bulk order requests
- Plant disease detection
- Mandi information

### 🛒 Buyer
- Buyer registration and login
- Browse available crops
- Search and filter crops
- View crop details
- Add crops to cart
- Buy crops
- Bulk purchase
- Wishlist
- Order management

### 🤖 AI Plant Disease Detection
- Upload a plant leaf image
- Image is sent to the backend
- Backend communicates with the ML API
- TensorFlow/Keras model analyzes the image
- Predicts:
  - Diseased
  - Healthy
- Displays prediction confidence

## 🧠 Machine Learning

The project uses a trained TensorFlow/Keras model for plant disease detection.

**Model details:**
- Framework: TensorFlow / Keras
- Input size: 128 × 128 × 3
- Class 0: Diseased
- Class 1: Healthy
- Model file: `ml/model.h5`

### ML Flow

```text
Plant Image
     ↓
Frontend
     ↓
Node.js / Express Backend
     ↓
Flask ML API
     ↓
TensorFlow/Keras Model
     ↓
Prediction + Confidence
     ↓
Frontend
