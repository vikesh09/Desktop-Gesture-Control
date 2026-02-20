import io
import numpy as np
import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader
from pymongo import MongoClient
from datetime import datetime, timezone


# =========================
# DATASET
# =========================

class HandLandmarkDataset(Dataset):
    def __init__(self, samples, labels):
        self.samples = samples
        self.labels = labels

    def __len__(self):
        return len(self.samples)

    def __getitem__(self, idx):
        # Flatten to 63-dim vector
        x = torch.tensor(self.samples[idx]).float().view(-1)
        y = torch.tensor(self.labels[idx]).long()
        return x, y


# =========================
# MODEL (MLP)
# =========================

class LandmarkMLP(nn.Module):
    def __init__(self, num_classes):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(63, 128),
            nn.BatchNorm1d(128),
            nn.ReLU(),
            nn.Dropout(0.4),

            # nn.Linear(256, 128),
            # nn.BatchNorm1d(128),
            # nn.ReLU(),
            # nn.Dropout(0.3),

            nn.Linear(128, 64),
            nn.ReLU(),

            nn.Linear(64, num_classes)
        )

    def forward(self, x):
        return self.net(x)


# =========================
# LOAD USER DATA
# =========================

def load_user_data(collection, user_id):
    query = {"user_id": user_id}

    gestures = sorted(collection.distinct("gesture", query))
    class_to_idx = {g: i for i, g in enumerate(gestures)}

    samples = []
    labels = []

    for doc in collection.find(query):
        samples.append(np.array(doc["features"], dtype=np.float32))
        labels.append(class_to_idx[doc["gesture"]])

    return samples, labels, gestures


# =========================
# TRAIN MODEL
# =========================

def train_user_model(
    mongo_uri,
    db_name,
    gesture_collection_name,
    model_collection_name,
    user_id,
    batch_size=32,
    epochs=25,
    lr=0.001
):
    client = MongoClient(mongo_uri)
    db = client[db_name]

    gesture_collection = db[gesture_collection_name]
    model_collection = db[model_collection_name]

    samples, labels, classes = load_user_data(gesture_collection, user_id)

    if len(samples) == 0:
        raise ValueError("No training data found for user.")

    dataset = HandLandmarkDataset(samples, labels)
    loader = DataLoader(dataset, batch_size=batch_size, shuffle=True)

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model = LandmarkMLP(len(classes)).to(device)

    criterion = nn.CrossEntropyLoss()
    optimizer = torch.optim.Adam(model.parameters(), lr=lr)

    # Training loop
    for epoch in range(epochs):
        model.train()
        total_loss = 0

        for x, y in loader:
            x, y = x.to(device), y.to(device)

            outputs = model(x)
            loss = criterion(outputs, y)

            optimizer.zero_grad()
            loss.backward()
            optimizer.step()

            total_loss += loss.item()

        print(f"Epoch {epoch+1}/{epochs} Loss: {total_loss/len(loader):.4f}")

    # Save model to Mongo
    buffer = io.BytesIO()
    torch.save({
        "model_state_dict": model.state_dict(),
        "classes": classes
    }, buffer)
    buffer.seek(0)

    model_collection.update_one(
        {"user_id": user_id},
        {
            "$set": {
                "model_binary": buffer.read(),
                "updated_at": datetime.now(timezone.utc)
            }
        },
        upsert=True
    )

    return model, classes


# =========================
# LOAD MODEL
# =========================

def load_user_model(mongo_uri, db_name, model_collection_name, user_id):
    client = MongoClient(mongo_uri)
    db = client[db_name]
    model_collection = db[model_collection_name]

    doc = model_collection.find_one({"user_id": user_id})
    if not doc:
        return None, None

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    buffer = io.BytesIO(doc["model_binary"])
    checkpoint = torch.load(buffer, map_location=device)

    classes = checkpoint["classes"]

    model = LandmarkMLP(len(classes)).to(device)
    model.load_state_dict(checkpoint["model_state_dict"])
    model.eval()

    return model, classes


# =========================
# PREDICT
# =========================

def predict(model, classes, feature_array):
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    x = torch.tensor(feature_array).float().view(1, -1).to(device)

    with torch.no_grad():
        outputs = model(x)
        probs = torch.softmax(outputs, dim=1)
        pred_idx = torch.argmax(probs, dim=1).item()

    return classes[pred_idx]
