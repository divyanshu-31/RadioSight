import os
import pandas as pd
from datasets import load_dataset
import requests
from io import BytesIO
from PIL import Image

def download_sample_data():
    img_dir = "images"
    os.makedirs(img_dir, exist_ok=True)
    
    print("Attempting to download NIH Chest X-ray sample from HuggingFace...")
    try:
        # Load a public chest x-ray dataset from HuggingFace
        # We will use keremberke/chest-xray-classification as a fallback if the full NIH is too heavy
        dataset = load_dataset("keremberke/chest-xray-classification", name="full", split="train[:150]")
        
        train_data = []
        val_data = []
        
        print("Processing images...")
        for i, item in enumerate(dataset):
            img = item['image']
            # Convert binary label to NIH multi-label format just to run our pipeline
            # If label is 1 (Pneumonia), we map it to 'Pneumonia'. Else 'No Finding'
            label_val = item['labels']
            labels_str = "Pneumonia" if label_val == 1 else "No Finding"
            
            img_name = f"sample_{i:04d}.png"
            img_path = os.path.join(img_dir, img_name)
            img.save(img_path)
            
            row = {"Image Index": img_name, "Finding Labels": labels_str}
            if i < 120:
                train_data.append(row)
            else:
                val_data.append(row)
                
        pd.DataFrame(train_data).to_csv("train_labels.csv", index=False)
        pd.DataFrame(val_data).to_csv("val_labels.csv", index=False)
        print("✅ Successfully downloaded 150 chest X-rays and generated labels.")
        
    except Exception as e:
        print(f"HuggingFace dataset failed: {e}")
        print("Fallback: Creating dummy images for pipeline testing...")
        train_data = []
        val_data = []
        
        for i in range(150):
            # Create a dummy image representing an X-ray
            img = Image.new('RGB', (224, 224), color = (73, 109, 137))
            img_name = f"sample_{i:04d}.png"
            img_path = os.path.join(img_dir, img_name)
            img.save(img_path)
            
            labels_str = "Pneumonia|Effusion" if i % 2 == 0 else "No Finding"
            row = {"Image Index": img_name, "Finding Labels": labels_str}
            if i < 120:
                train_data.append(row)
            else:
                val_data.append(row)
                
        pd.DataFrame(train_data).to_csv("train_labels.csv", index=False)
        pd.DataFrame(val_data).to_csv("val_labels.csv", index=False)
        print("✅ Generated 150 dummy chest X-rays to test the pipeline.")

if __name__ == "__main__":
    download_sample_data()
