from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import uvicorn
import io
import os
from PIL import Image
import random
import database

from ml_model import ml_system

app = FastAPI(title="Radiosight API")

# Mount the images directory so the frontend can load similar case images
if os.path.exists("images"):
    app.mount("/images", StaticFiles(directory="images"), name="images")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Radiosight API is running"}

@app.post("/predict")
async def predict(
    file: UploadFile = File(...),
    patient_name: str = Form("Unknown"),
    patient_age: int = Form(0),
    patient_gender: str = Form("Unknown")
):
    # Read the image
    image_data = await file.read()
    image = Image.open(io.BytesIO(image_data)).convert("RGB")
    
    # Process image with the real EfficientNet-V2 & Grad-CAM pipeline
    try:
        result = ml_system.predict_disease_and_cam(image)
        
        # Save to permanent SQLite database
        patient_id = "PT-" + str(random.randint(10000, 99999))
        database.add_analysis(
            patient_id=patient_id,
            name=patient_name,
            age=patient_age,
            gender=patient_gender,
            disease=result["disease"],
            confidence=result["confidence"]
        )
        
        # Pass the ID back to frontend
        result["patientId"] = patient_id
        return result
    except Exception as e:
        print(f"Error during prediction: {str(e)}")
        return {"error": "Failed to process image through ML model."}

@app.get("/history")
async def get_history():
    try:
        return database.get_history()
    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
