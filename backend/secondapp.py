import os
import cv2
import base64
import numpy as np
from typing import List
from fastapi import FastAPI, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from pymongo import MongoClient
from jose import jwt, JWTError
from passlib.context import CryptContext
from datetime import datetime, timedelta, timezone
from collections import Counter

from models.model_train import train_user_model, load_user_model, predict

import mediapipe as mp
from fastapi.middleware.cors import CORSMiddleware

# ------------------- Config -------------------
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
SECRET_KEY = os.getenv("SECRET_KEY", "secret")
ALGORITHM = "HS256"

client = MongoClient(MONGO_URI)
db = client["gesture_app"]
users = db["users"]
gestures = db["gesture_data"]
models = db["user_models"]
gesture_action=db['gesture_action_data']

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
app = FastAPI()
security = HTTPBearer()

mp_hands = mp.solutions.hands
hands = mp_hands.Hands(static_image_mode=True, max_num_hands=1)

# ------------------- CORS -------------------
origins = ["http://localhost:5500", "http://127.0.0.1:5500", "*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ------------------- Models -------------------
class Signup(BaseModel):
    email: str
    password: str

class Login(BaseModel):
    email: str
    password: str

class Frame(BaseModel):
    gesture_name: str
    features: List[str]  # base64 images

class PredictRequest(BaseModel):
    features: List[str]  # base64 images

# ------------------- Auth -------------------
def hash_password(password: str):
    return pwd_context.hash(password[:72])

def verify_password(password: str, hashed: str):
    return pwd_context.verify(password[:72], hashed)

def create_token(user_id: str):
    payload = {
        "user_id": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(hours=24)
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

def get_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        return payload["user_id"]
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

# ------------------- Utilities -------------------
def base64_to_landmarks(dataURL: str):
    header, encoded = dataURL.split(",", 1)
    img_bytes = base64.b64decode(encoded)
    nparr = np.frombuffer(img_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

    result = hands.process(img)
    if result.multi_hand_landmarks:
        hand = result.multi_hand_landmarks[0]
        x=np.array([[lm.x, lm.y, lm.z] for lm in hand.landmark])
        wrist = x[0]
        x = x - wrist
        scale = np.linalg.norm(x[9])
        if scale != 0:
            x = x / scale
        return x.tolist()
    else:
        return [[0.0, 0.0, 0.0] for _ in range(21)]

# ------------------- Endpoints -------------------
@app.post("/signup")
def signup(data: Signup):
    if users.find_one({"email": data.email}):
        raise HTTPException(status_code=400, detail="User already exists")
    users.insert_one({
        "email": data.email,
        "password": hash_password(data.password)
    })
    return {"message": "User created"}

@app.post("/login")
def login(data: Login):
    user = users.find_one({"email": data.email})
    if not user or (user['password']!=data.password):
        raise HTTPException(status_code=400, detail="Invalid credentials")
    token = create_token(str(user["_id"]))
    return {"access_token": token}

@app.post("/save_frame")
def save_frame(data: Frame, user_id: str = Depends(get_user)):
    processed = []
    for f in data.features:
        lm = base64_to_landmarks(f)
        processed.append(lm)

    if not processed:
        raise HTTPException(status_code=400, detail="No hand detected in any frame")

    for lm in processed:
        gestures.insert_one({
            "user_id": user_id,
            "gesture": data.gesture_name,
            "features": lm
        })
    gesture_action.insert_one({
        "user_id":user_id,
        "gesture":data.gesture_name,
        "action":data.action
    })

    return {"message": f"{len(processed)} frames and action saved"}

@app.post("/retrain_model")
def retrain_model(user_id: str = Depends(get_user)):
    model, classes = train_user_model(
        mongo_uri=MONGO_URI,
        db_name="gesture_app",
        gesture_collection_name="gesture_data",
        model_collection_name="user_models",
        user_id=user_id
    )
    return {"message": "Model trained", "classes": classes}

@app.post("/predict")
def predict_gesture(data: PredictRequest, user_id: str = Depends(get_user)):
    model, classes = load_user_model(
        mongo_uri=MONGO_URI,
        db_name="gesture_app",
        model_collection_name="user_models",
        user_id=user_id
    )

    if not model:
        raise HTTPException(status_code=400, detail="Model not trained")

    # process each base64 frame to landmarks
    processed = [base64_to_landmarks(f) for f in data.features]

    predictions = []

    for frame in processed:
        pred = predict(model, classes, frame)
        predictions.append(pred)

    # Majority voting
    vote_count = Counter(predictions)
    result = vote_count.most_common(1)[0][0]
    return {"prediction": result}
