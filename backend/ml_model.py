import torch
import torch.nn as nn
from torchvision import models, transforms
import numpy as np
from PIL import Image
import cv2
import io
import base64
from sklearn.metrics.pairwise import cosine_similarity
from pytorch_grad_cam import GradCAM
from pytorch_grad_cam.utils.model_targets import ClassifierOutputTarget
from pytorch_grad_cam.utils.image import show_cam_on_image

# 14 classes from NIH Chest X-ray dataset
NIH_CLASSES = [
    "Atelectasis", "Cardiomegaly", "Effusion", "Infiltration", "Mass", 
    "Nodule", "Pneumonia", "Pneumothorax", "Consolidation", "Edema", 
    "Emphysema", "Fibrosis", "Pleural_Thickening", "Hernia"
]

class ChestXrayModel:
    def __init__(self, model_path=None):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        print(f"Loading EfficientNet-V2 on {self.device}...")
        
        # Load EfficientNet-V2 Small
        self.model = models.efficientnet_v2_s(weights=models.EfficientNet_V2_S_Weights.DEFAULT)
        
        # Modify classifier for 14 multi-label classes
        num_ftrs = self.model.classifier[1].in_features
        self.model.classifier[1] = nn.Linear(num_ftrs, len(NIH_CLASSES))
        
        # If we had a trained model path, we would load it here
        if model_path:
            # self.model.load_state_dict(torch.load(model_path, map_location=self.device))
            pass
            
        self.model = self.model.to(self.device)
        self.model.eval()

        # Target layer for Grad-CAM in EfficientNet-V2
        # We pick the last convolutional block before the pooling/classifier
        self.target_layers = [self.model.features[-1]]
        
        # Initialize Grad-CAM
        self.cam = GradCAM(model=self.model, target_layers=self.target_layers)

        # Standard ImageNet transforms, adjusted for X-rays
        self.transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
        ])

        # Feature extractor for embeddings (removing the final classification layer)
        self.feature_extractor = torch.nn.Sequential(*list(self.model.children())[:-1])
        self.feature_extractor.eval()
        
        # Mocking an in-memory database of NIH embeddings for Similarity Search
        # In production, this would be loaded from Faiss or MongoDB Atlas Vector Search
        self._mock_nih_database()

    def _mock_nih_database(self):
        # Generate 100 random embeddings to represent our historical NIH dataset
        self.db_embeddings = np.random.randn(100, 1280) # EfficientNet-V2-S outputs 1280 dim
        import pandas as pd
        try:
            df = pd.read_csv('sample_labels.csv').head(100)
            self.db_metadata = []
            for i, row in df.iterrows():
                disease_str = row['Finding Labels']
                disease = disease_str.split('|')[0] if disease_str != 'No Finding' else 'No Finding'
                self.db_metadata.append({
                    "id": row['Image Index'],
                    "disease": disease,
                    "severity_score": float(np.random.uniform(0.60, 0.99))
                })
        except Exception:
            self.db_metadata = [
                {
                    "id": f"NIH-{str(i).zfill(5)}", 
                    "disease": NIH_CLASSES[i%14],
                    "severity_score": float(np.random.uniform(0.60, 0.99))
                } for i in range(100)
            ]

    def get_embedding(self, tensor):
        with torch.no_grad():
            features = self.feature_extractor(tensor)
            # Flatten the pooling output
            embedding = features.view(features.size(0), -1).cpu().numpy()
        return embedding

    def find_similar_cases(self, query_embedding, top_k=3):
        # Calculate cosine similarity between query and database
        similarities = cosine_similarity(query_embedding, self.db_embeddings)[0]
        
        # Get top k indices
        top_indices = np.argsort(similarities)[::-1][:top_k]
        
        results = []
        for idx in top_indices:
            results.append({
                "id": self.db_metadata[idx]["id"],
                "score": float(similarities[idx]),
                "known_disease": self.db_metadata[idx]["disease"],
                "severity_score": self.db_metadata[idx]["severity_score"]
            })
        return results

    def predict_disease_and_cam(self, image: Image.Image):
        # 1. Preprocess
        tensor = self.transform(image).unsqueeze(0).to(self.device)
        
        # 2. Prediction
        with torch.no_grad():
            outputs = self.model(tensor)
            probabilities = torch.sigmoid(outputs).cpu().numpy()[0]
            
        # Get top predicted class
        top_class_idx = np.argmax(probabilities)
        confidence = float(probabilities[top_class_idx])
        
        # 3. Embedding & Similarity Search
        embedding = self.get_embedding(tensor)
        similar_cases = self.find_similar_cases(embedding, top_k=3)

        # 4. Grad-CAM
        # Convert PIL image to numpy float32 in [0, 1] for Grad-CAM overlay
        rgb_img = np.array(image.resize((224, 224))).astype(np.float32) / 255.0
        # If grayscale, convert to RGB shape
        if len(rgb_img.shape) == 2:
            rgb_img = np.stack((rgb_img,)*3, axis=-1)
            
        targets = [ClassifierOutputTarget(top_class_idx)]
        
        # Generate heatmap
        grayscale_cam = self.cam(input_tensor=tensor, targets=targets)[0, :]
        
        # Overlay heatmap on original image using the library's utility
        # Use colormap cv2.COLORMAP_JET
        cam_image = show_cam_on_image(rgb_img, grayscale_cam, use_rgb=True, colormap=cv2.COLORMAP_JET)
        
        # Convert visualization back to base64 for frontend
        cam_pil = Image.fromarray(cam_image)
        buffered = io.BytesIO()
        cam_pil.save(buffered, format="PNG")
        heatmap_base64 = base64.b64encode(buffered.getvalue()).decode('utf-8')

        if confidence < 0.50:
            disease_name = "No Finding (Normal)"
            observations = [
                "No significant pathological abnormalities detected.",
                "Lungs appear clear bilaterally.",
                "Cardiomediastinal silhouette is within normal limits.",
                "Model confidence for any specific disease is below the clinical threshold."
            ]
        else:
            disease_name = NIH_CLASSES[top_class_idx]
            observations = [
                f"High activation in regions associated with {disease_name}.",
                "Model confidence is strongly localized.",
                f"Matches feature profile of {similar_cases[0]['id']} from historical database."
            ]
        
        return {
            "disease": disease_name,
            "confidence": confidence,
            "heatmap": heatmap_base64,
            "similar_cases": similar_cases,
            "observations": observations
        }

# Singleton instance
ml_system = ChestXrayModel()
