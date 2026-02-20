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
from dotenv import load_dotenv
import pyautogui
import subprocess
import time
from datetime import datetime
from backend.commands import *
# ------------------- Config -------------------
load_dotenv()
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
model_cache = {}

mp_hands = mp.solutions.hands

hands = mp_hands.Hands(
    static_image_mode=False,
    max_num_hands=1,
    min_detection_confidence=0.5,
    min_tracking_confidence=0.5
)

hands_lock = threading.Lock()

ACTION_MAP = {
    "Volume Up": volume_up,
    "Volume Down": volume_down,
    "Mute": mute,
    "Unmute": unmute,
    "Play Media": play_media,
    "Pause Media": pause_media,
    "Next Track": next_track,
    "Previous Track": previous_track,
    "Screenshot": screenshot,
    "Lock Screen": lock_screen,
    "Minimize All Windows": minimize_all_windows,
    "Maximize Current Window": maximize_current_window,
    "Minimize Current Window": minimize_current_window,

    "New Tab": new_tab,
    "Close Tab": close_tab,
    "Reopen Closed Tab": reopen_closed_tab,
    "Refresh Page": refresh_page,
    "Scroll Up": scroll_up,
    "Scroll Down": scroll_down,
    "Zoom In": zoom_in,
    "Zoom Out": zoom_out,
    "Open YouTube": open_youtube,
    "Open ChatGPT": open_chatgpt,

    "Open VS Code": open_vscode,
    "Open Terminal": open_terminal,
    "Run Code": run_code,
    "Git Pull": git_pull,
    "Git Push": git_push,
    "Create HTML Project": create_html_template,
    "Create React Component": create_react_component,
    "Create Node API": create_node_api_template,
    "Create README.md": create_readme,

    "Create New Folder": create_new_folder,
    "Rename Selected File": rename_selected_file,
    "Delete Selected File": delete_selected_file,
    "Open Downloads": open_downloads,
    "Open Documents": open_documents,
    "Open Desktop": open_desktop,

    "Presentation Mode": presentation_mode,
    "Meeting Mode": meeting_mode,
    "Study Mode": study_mode,
    "Focus Mode": focus_mode,
}
# ------------------- CORS -------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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
    count=gestures.count_documents({"user_id":user_id})
    if (count==0):
        raise HTTPException(400)

    print('Request Reached')

    model, classes = train_user_model(
        mongo_uri=MONGO_URI,
        db_name="gesture_app",
        gesture_collection_name="gesture_data",
        model_collection_name="user_models",
        user_id=user_id
    )

    model_cache.pop(user_id, None)

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
# ------------------- WebSocket Prediction -------------------
@app.websocket("/ws/predict")
async def websocket_predict(websocket: WebSocket):

    await websocket.accept()

    try:
        # --- Receive token first ---
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

        # -------- Model Caching --------
        if user_id not in model_cache:
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

            model_cache[user_id] = (model, classes)

        model, classes = model_cache[user_id]
        # --------------------------------

        last_executed_gesture = None  # 🔥 IMPORTANT

        # -------- Prediction Loop --------
        while True:
            data = await websocket.receive_json()
            frame_base64 = data.get("frame")

            if not frame_base64:
                continue

            landmarks = base64_to_landmarks(frame_base64)

            if landmarks is None:
                last_executed_gesture = None
                await websocket.send_json({"prediction": "no_hand"})
                continue


            prediction = predict(model, classes, landmarks)

            # Only execute if gesture changed
            if prediction != last_executed_gesture:

                action_doc = gesture_action.find_one(
                    {"user_id": user_id, "gesture": prediction}
                )
                
                if action_doc:
                    finalaction = action_doc.get("action")
                    ACTION_MAP[finalaction]()

                last_executed_gesture = prediction

            await websocket.send_json({"prediction": prediction})

    except WebSocketDisconnect:
        print("WebSocket disconnected")

