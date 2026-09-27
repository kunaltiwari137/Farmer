import requests

url = "http://localhost:8000/predict"

image_path = "test.jpg"

with open(image_path, "rb") as image:
    response = requests.post(
        url,
        files={"image": image}
    )

print("Status Code:", response.status_code)
print("Response:", response.json())