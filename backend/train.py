import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, Dataset
from torchvision import models, transforms
from sklearn.metrics import roc_auc_score
import numpy as np
import os
import pandas as pd
from PIL import Image

# Config
BATCH_SIZE = 32
EPOCHS = 30
LEARNING_RATE = 1e-4
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# NIH 14 Classes
NIH_CLASSES = [
    "Atelectasis", "Cardiomegaly", "Effusion", "Infiltration", "Mass", 
    "Nodule", "Pneumonia", "Pneumothorax", "Consolidation", "Edema", 
    "Emphysema", "Fibrosis", "Pleural_Thickening", "Hernia"
]

from sklearn.model_selection import train_test_split

class NIHDataset(Dataset):
    def __init__(self, df, img_dir, transform=None):
        self.df = df.reset_index(drop=True)
        self.img_dir = img_dir
        self.transform = transform
        
        self.labels = []
        for index, row in self.df.iterrows():
            finding_labels = row['Finding Labels'].split('|')
            label_vector = np.zeros(14, dtype=np.float32)
            for i, class_name in enumerate(NIH_CLASSES):
                if class_name in finding_labels:
                    label_vector[i] = 1.0
            self.labels.append(label_vector)

    def __len__(self):
        return len(self.df)

    def __getitem__(self, idx):
        img_name = os.path.join(self.img_dir, self.df.iloc[idx]['Image Index'])
        image = Image.open(img_name).convert('RGB')
        label = self.labels[idx]

        if self.transform:
            image = self.transform(image)

        return image, torch.tensor(label)

# Advanced Data Augmentation for Medical Images
train_transforms = transforms.Compose([
    transforms.Resize((256, 256)),
    transforms.RandomCrop((224, 224)),
    transforms.RandomRotation(15),
    transforms.RandomHorizontalFlip(),
    transforms.ColorJitter(brightness=0.2, contrast=0.2),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
])

val_transforms = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
])

class FocalLoss(nn.Module):
    def __init__(self, alpha=1, gamma=2, logits=False, reduce=True):
        super(FocalLoss, self).__init__()
        self.alpha = alpha
        self.gamma = gamma
        self.reduce = reduce
        self.bce = nn.BCEWithLogitsLoss(reduction='none')

    def forward(self, inputs, targets):
        bce_loss = self.bce(inputs, targets)
        pt = torch.exp(-bce_loss)
        focal_loss = self.alpha * (1-pt)**self.gamma * bce_loss
        
        if self.reduce:
            return torch.mean(focal_loss)
        return focal_loss

def get_model():
    model = models.efficientnet_v2_s(weights=models.EfficientNet_V2_S_Weights.DEFAULT)
    num_ftrs = model.classifier[1].in_features
    # 14 output classes
    model.classifier[1] = nn.Linear(num_ftrs, 14)
    return model.to(DEVICE)

def train_model():
    print("Initializing accurate training pipeline on real NIH dataset...")
    
    # 1. Datasets
    full_df = pd.read_csv('sample_labels.csv')
    train_df, val_df = train_test_split(full_df, test_size=0.15, random_state=42)
    
    train_dataset = NIHDataset(df=train_df, img_dir='images/', transform=train_transforms)
    val_dataset = NIHDataset(df=val_df, img_dir='images/', transform=val_transforms)
    
    train_loader = DataLoader(train_dataset, batch_size=BATCH_SIZE, shuffle=True, num_workers=0)
    val_loader = DataLoader(val_dataset, batch_size=BATCH_SIZE, shuffle=False, num_workers=0)

    # 2. Model, Loss, Optimizer
    model = get_model()
    
    # Using Focal Loss for class imbalance
    criterion = FocalLoss(gamma=2.0)
    
    # AdamW with weight decay for better generalization
    optimizer = optim.AdamW(model.parameters(), lr=1e-3, weight_decay=1e-4)
    
    # ReduceLROnPlateau is more aggressive at finding local minima than CosineAnnealing
    scheduler = optim.lr_scheduler.ReduceLROnPlateau(optimizer, mode='max', patience=1, factor=0.5)

    best_auroc = 0.0

    for epoch in range(5):
        model.train()
        train_loss = 0.0
        for i, (images, labels) in enumerate(train_loader):
            images, labels = images.to(DEVICE), labels.to(DEVICE)
            
            optimizer.zero_grad()
            outputs = model(images)
            loss = criterion(outputs, labels)
            
            loss.backward()
            optimizer.step()
            train_loss += loss.item()
            
        # Validation Phase
        model.eval()
        val_loss = 0.0
        all_labels = []
        all_preds = []
        
        with torch.no_grad():
            for images, labels in val_loader:
                images, labels = images.to(DEVICE), labels.to(DEVICE)
                outputs = model(images)
                loss = criterion(outputs, labels)
                val_loss += loss.item()
                
                probs = torch.sigmoid(outputs)
                all_labels.append(labels.cpu().numpy())
                all_preds.append(probs.cpu().numpy())
                
        # Calculate AUROC for multi-label classification
        all_labels = np.vstack(all_labels)
        all_preds = np.vstack(all_preds)
        
        aurocs = []
        for i in range(14):
            try:
                # Handle cases where a class might not be present in the validation batch
                score = roc_auc_score(all_labels[:, i], all_preds[:, i])
                aurocs.append(score)
            except ValueError:
                pass
                
        mean_auroc = np.mean(aurocs)
        
        print(f"Epoch [{epoch+1}/{EPOCHS}] | Train Loss: {train_loss/len(train_loader):.4f} | Val Loss: {val_loss/len(val_loader):.4f} | Val AUROC: {mean_auroc:.4f}")
        
        # Step the scheduler
        scheduler.step(mean_auroc)
        
        # Save best model
        if mean_auroc > best_auroc:
            best_auroc = mean_auroc
            torch.save(model.state_dict(), 'best_efficientnet_v2_nih.pth')
            print(">>> Saved new best model!")

if __name__ == '__main__':
    train_model()
    print("Training script finished execution.")
