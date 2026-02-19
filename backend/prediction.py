import cv2 as cv
import mediapipe as mp
import numpy as np
import torch
import torch.nn as nn
import os


class LandmarkCNN(nn.Module):
    def __init__(self, num_classes):
        super().__init__()
        self.conv = nn.Sequential(
            nn.Conv1d(3, 32, 3, padding=1),
            nn.ReLU(),
            nn.MaxPool1d(2),
            nn.Conv1d(32, 64, 3, padding=1),
            nn.ReLU(),
            nn.MaxPool1d(2)
        )
        self.fc = nn.Sequential(
            nn.Flatten(),
            nn.Linear(64 * 5, 128),
            nn.ReLU(),
            nn.Linear(128, num_classes)
        )

    def forward(self, x):
        x = self.conv(x)
        x = self.fc(x)
        return x


def load_model(model_path, data_path):
    classes = sorted([
        d for d in os.listdir(data_path)
        if os.path.isdir(os.path.join(data_path, d))
    ])

    model = LandmarkCNN(len(classes))
    model.load_state_dict(torch.load(model_path, map_location="cpu"))
    model.eval()
    return model, classes


def extract_landmarks(frame, hands):
    results = hands.process(frame)
    if not results.multi_hand_landmarks:
        return None

    landmarks = results.multi_hand_landmarks[0].landmark
    x = []

    for lm in landmarks:
        x.append([lm.x, lm.y, lm.z])

    x = np.array(x)
    wrist = x[0]
    x = x - wrist
    scale = np.linalg.norm(x[9])
    if scale != 0:
        x = x / scale

    x = torch.tensor(x, dtype=torch.float32).view(1, 3, 21)
    return x


def predict_frame(frame, model, hands, classes):
    rgb = cv.cvtColor(frame, cv.COLOR_BGR2RGB)
    x = extract_landmarks(rgb, hands)

    if x is None:
        return frame

    with torch.no_grad():
        output = model(x)
        pred = torch.argmax(output, dim=1).item()
        label = classes[pred]

    cv.putText(frame, label, (20, 40),
               cv.FONT_HERSHEY_SIMPLEX, 1,
               (0, 255, 0), 2)

    return frame

model, classes = load_model("./models/gesture_model.pth", "./data")

mp_hands = mp.solutions.hands
hands = mp_hands.Hands(static_image_mode=False,
                        max_num_hands=1,
                        min_detection_confidence=0.7,
                        min_tracking_confidence=0.7)
if __name__ == "__main__":
    
    cam = cv.VideoCapture(0)

    while True:
        ret, frame = cam.read()
        if not ret:
            break

        frame = predict_frame(frame, model, hands, classes)
        cv.imshow("Prediction", frame)

        if cv.waitKey(1) & 0xFF == ord("q"):
            break

    cam.release()
    cv.destroyAllWindows()
