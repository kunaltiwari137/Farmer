from tensorflow.keras.models import load_model
from PIL import Image
import numpy as np
import os

model = load_model("model.h5", compile=False)

test_folder = "../Dataset/Dataset/test"

correct = 0
total = 0

healthy_correct = 0
healthy_total = 0

disease_correct = 0
disease_total = 0

for class_name in ["Dieased", "Healthy"]:

    folder = os.path.join(test_folder, class_name)

    for file_name in os.listdir(folder):

        file_path = os.path.join(folder, file_name)

        try:
            image = Image.open(file_path).convert("RGB")
            image = image.resize((128, 128))

            image = np.array(image) / 255.0
            image = np.expand_dims(image, axis=0)

            prediction = model.predict(image, verbose=0)

            predicted_class = np.argmax(prediction)

            # Class 0 = Diseased
            # Class 1 = Healthy
            actual_class = 0 if class_name == "Dieased" else 1

            total += 1

            if class_name == "Healthy":
                healthy_total += 1

                if predicted_class == actual_class:
                    healthy_correct += 1

            else:
                disease_total += 1

                if predicted_class == actual_class:
                    disease_correct += 1

            if predicted_class == actual_class:
                correct += 1

        except Exception as e:
            print("Error:", file_name, e)


accuracy = (correct / total) * 100
healthy_accuracy = (healthy_correct / healthy_total) * 100
disease_accuracy = (disease_correct / disease_total) * 100

print("\n==============================")
print("MODEL TEST RESULT")
print("==============================")

print("Total Images:", total)
print("Overall Accuracy:", round(accuracy, 2), "%")

print("\nHealthy Images")
print("Correct:", healthy_correct)
print("Total:", healthy_total)
print("Accuracy:", round(healthy_accuracy, 2), "%")

print("\nDiseased Images")
print("Correct:", disease_correct)
print("Total:", disease_total)
print("Accuracy:", round(disease_accuracy, 2), "%")