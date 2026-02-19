import os
import cv2
import base64
import numpy as np
from typing import List
from fastapi import FastAPI, HTTPException, Depends, WebSocket, WebSocketDisconnect
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from pymongo import MongoClient
from jose import jwt, JWTError
from passlib.context import CryptContext
from datetime import datetime, timedelta, timezone

from models.model_train import train_user_model, load_user_model, predict
import mediapipe as mp
from fastapi.middleware.cors import CORSMiddleware
import threading

# ------------------- Config -------------------
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
SECRET_KEY = os.getenv("SECRET_KEY", "CHANGE_THIS_SECRET")
ALGORITHM = "HS256"

client = MongoClient(MONGO_URI)
db = client["gesture_app"]

users = db["users"]
gestures = db["gesture_data"]
models = db["user_models"]
gesture_action = db["gesture_action_data"]

gestures.create_index([("user_id", 1)])
gesture_action.create_index([("user_id", 1)])

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
app = FastAPI()
security = HTTPBearer()

mp_hands = mp.solutions.hands

hands = mp_hands.Hands(
    static_image_mode=False,
    max_num_hands=1,
    min_detection_confidence=0.5,
    min_tracking_confidence=0.5
)

hands_lock = threading.Lock()


# ------------------- CORS -------------------
origins = ["http://localhost:5500", "http://127.0.0.1:5500","*"]
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
    action: str
    features: List[str]

class DeleteGesture(BaseModel):
    gesture_name: str


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
    try:
        if not dataURL or "," not in dataURL:
            return None

        header, encoded = dataURL.split(",", 1)
        encoded = encoded.strip()

        img_bytes = base64.b64decode(encoded)
        nparr = np.frombuffer(img_bytes, np.uint8)

        if len(nparr) == 0:
            return None

        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if img is None:
            return None

        img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

        with hands_lock:
            result = hands.process(img)

        if not result.multi_hand_landmarks:
            return None

        hand_landmarks = result.multi_hand_landmarks[0]

        x = np.array([[lm.x, lm.y, lm.z] for lm in hand_landmarks.landmark])

        # Normalize (translation only)
        wrist = x[0]
        x = x - wrist

        return x.tolist()

    except Exception as e:
        print("Landmark error:", e)
        return None




def augment_landmarks(x):
    x = np.array(x)
    noise = np.random.normal(0, 0.003, x.shape)
    x = x + noise

    theta = np.random.uniform(-5, 5) * np.pi / 180
    R = np.array([
        [np.cos(theta), -np.sin(theta)],
        [np.sin(theta),  np.cos(theta)]
    ])
    x[:, :2] = x[:, :2] @ R.T

    return x.tolist()


# ------------------- HTTP Endpoints -------------------
@app.post("/signup")
def signup(data: Signup):
    if users.find_one({"email": data.email}):
        raise HTTPException(status_code=400, detail="User already exists")

    users.insert_one({
        "email": data.email,
        "password": data.password
    })

    return {"message": "User created"}


@app.post("/login")
def login(data: Login):
    user = users.find_one({"email": data.email})

    if not user or  user['password']!=data.password:
        raise HTTPException(status_code=400, detail="Invalid credentials")

    token = create_token(str(user["_id"]))
    return {"access_token": token}


@app.post("/save_frame")
def save_frame(data: Frame, user_id: str = Depends(get_user)):
    processed = []

    for f in data.features:
        lm = base64_to_landmarks(f)
        if lm is not None:
            processed.append(lm)

    if len(processed) == 0:
        raise HTTPException(status_code=400, detail="No valid hand detected")

    total_saved = 0

    for lm in processed:
        gestures.insert_one({
            "user_id": user_id,
            "gesture": data.gesture_name,
            "features": lm
        })
        total_saved += 1

        for _ in range(5):
            aug = augment_landmarks(lm)
            gestures.insert_one({
                "user_id": user_id,
                "gesture": data.gesture_name,
                "features": aug
            })
            total_saved += 1

    gesture_action.update_one(
        {"user_id": user_id, "gesture": data.gesture_name},
        {"$set": {"action": data.action}},
        upsert=True
    )

    return {"message": f"{total_saved} frames saved"}


@app.post("/retrain_model")
def retrain_model(user_id: str = Depends(get_user)):
    count = gestures.count_documents({"user_id": user_id})

    if count < 20:
        raise HTTPException(status_code=400, detail="Not enough samples")

    model, classes = train_user_model(
        mongo_uri=MONGO_URI,
        db_name="gesture_app",
        gesture_collection_name="gesture_data",
        model_collection_name="user_models",
        user_id=user_id
    )

    return {"message": "Model trained", "classes": classes}


@app.post("/delete_gesture")
def delete_gesture(data: DeleteGesture, user_id: str = Depends(get_user)):
    gestures.delete_many({
        "user_id": user_id,
        "gesture": data.gesture_name
    })

    gesture_action.delete_one({
        "user_id": user_id,
        "gesture": data.gesture_name
    })

    return {"response": "Gesture deleted. Retrain model."}


@app.get("/extract_map")
def extract_action_map(user_id: str = Depends(get_user)):
    data = list(gesture_action.find(
        {"user_id": user_id},
        {"_id": 0}
    ))
    return {"map": data}


# ------------------- WebSocket Prediction -------------------
@app.websocket("/ws/predict")
async def websocket_predict(websocket: WebSocket):

    await websocket.accept()

    try:
        auth_data = await websocket.receive_json()
        token = auth_data.get("token")

        if not token:
            await websocket.close(code=1008)
            return

        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            user_id = payload["user_id"]
        except JWTError:
            await websocket.close(code=1008)
            return

        model, classes = load_user_model(
            mongo_uri=MONGO_URI,
            db_name="gesture_app",
            model_collection_name="user_models",
            user_id=user_id
        )

        if not model:
            await websocket.send_json({"error": "Model not trained"})
            await websocket.close()
            return

        while True:
            data = await websocket.receive_json()
            frame_base64 = data.get("frame")

            if not frame_base64:
                continue

            landmarks = base64_to_landmarks(frame_base64)

            if landmarks is None:
                await websocket.send_json({"prediction": "no_hand"})
                continue

            prediction = predict(model, classes, landmarks)

            await websocket.send_json({"prediction": prediction})

    except WebSocketDisconnect:
        print("WebSocket disconnected")
