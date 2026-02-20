import React, { useState, useCallback, useRef, useEffect } from "react";
import Webcam from "react-webcam";
import {
  Brain,
  PlayCircle,
  Activity,
  Camera,
  ShieldCheck,
  Trash2,
  XCircle
} from "lucide-react";

export default function Dashboard() {

  const [cameraMode, setCameraMode] = useState(null);
  const [gestureName, setGestureName] = useState("");
  const [selectedAction, setSelectedAction] = useState("");
  const [statusText, setStatusText] = useState("");
  const [gestureMap, setGestureMap] = useState([]);
  const [isTraining, setIsTraining] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [trainingProgress, setTrainingProgress] = useState(0);
  const [trainingMessage, setTrainingMessage] = useState("");
  const trainingIntervalRef = useRef(null);
  const webcamRef = useRef(null);
  const wsRef = useRef(null);
  const predictionIntervalRef = useRef(null);

  const token = localStorage.getItem("token");

  const reloadPage = () => window.location.reload();

  const actions = [
    "Volume Up", "Volume Down", "Mute", "Unmute", "Play Media", "Pause Media",
    "Next Track", "Previous Track", "Screenshot", "Lock Screen",
    "Minimize All Windows", "Maximize Current Window", "Minimize Current Window",
    "New Tab", "Close Tab", "Reopen Closed Tab", "Refresh Page", "Scroll Up",
    "Scroll Down", "Zoom In", "Zoom Out", "Open YouTube", "Open ChatGPT",
    "Open VS Code", "Open Terminal", "Run Code", "Git Pull", "Git Push",
    "Create HTML Project", "Create React Component", "Create Node API",
    "Create README.md", "Create New Folder", "Rename Selected File",
    "Delete Selected File", "Open Downloads", "Open Documents", "Open Desktop",
    "Presentation Mode", "Meeting Mode", "Study Mode", "Focus Mode"
  ];

  const steps = [
    "Center your gesture clearly",
    "Rotate slightly to the left",
    "Rotate slightly to the right",
    "Move slightly upward",
    "Move slightly downward",
    "Move closer to camera",
    "Move slightly away",
    "Hold steady"
  ];

  const closeCamera = () => {
    setCameraMode(null);
    setStatusText("");
    setCurrentStep(0);
    setProgress(0);

    if (predictionIntervalRef.current) clearInterval(predictionIntervalRef.current);
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  };

  const guidedCapture = async () => {
    setCameraMode("collect");

    // Wait for webcam to mount
    await new Promise(res => setTimeout(res, 600));

    if (!webcamRef.current) {
      alert("Camera not ready");
      return;
    }

    let frames = [];

    for (let i = 0; i < steps.length; i++) {
      setCurrentStep(i);
      setStatusText(steps[i]);
      setProgress(Math.round(((i + 1) / steps.length) * 100));

      await new Promise(res => setTimeout(res, 1200));

      const shot = webcamRef.current?.getScreenshot();
      if (shot) frames.push(shot);
    }

    if (frames.length === 0) {
      alert("No frames captured");
      closeCamera();
      return;
    }

    setStatusText("Saving gesture data...");

    try {
      const res = await fetch("http://127.0.0.1:8000/save_frame", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          gesture_name: gestureName,
          action: selectedAction,
          features: frames
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail);

      alert("Gesture saved successfully. Retrain the model.");
      reloadPage();

    } catch (err) {
      alert(err.message);
    } finally {
      closeCamera();
    }
  };

  const startCollection = useCallback(() => {
    if (!gestureName.trim() || !selectedAction) {
      alert("Enter gesture name and select an action");
      return;
    }
    guidedCapture();
  }, [gestureName, selectedAction]);

  const startPrediction = () => {
    setIsConnecting(true);
    const ws = new WebSocket("ws://127.0.0.1:8000/ws/predict");
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ token }));
      setCameraMode("predict");
      setIsConnecting(false);
      setStatusText("Live prediction running...");
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.prediction) setStatusText(`Prediction: ${data.prediction}`);
    };

    ws.onerror = () => {
      alert("WebSocket error");
      setIsConnecting(false);
    };
  };

  useEffect(() => {
    if (cameraMode === "predict" && wsRef.current) {
      predictionIntervalRef.current = setInterval(() => {
        if (webcamRef.current && wsRef.current?.readyState === 1) {
          const frame = webcamRef.current.getScreenshot();
          if (frame) wsRef.current.send(JSON.stringify({ frame }));
        }
      }, 300);
    }
    return () => clearInterval(predictionIntervalRef.current);
  }, [cameraMode]);

  const retrainModel = async () => {
    try {
      setIsTraining(true);
      setTrainingProgress(5);
      setTrainingMessage("Initializing training pipeline...");

      // Smooth fake progress animation
      trainingIntervalRef.current = setInterval(() => {
        setTrainingProgress(prev => {
          if (prev >= 90) return prev; // Stop at 90% until backend finishes
          return prev + Math.random() * 5;
        });
      }, 500);

      const res = await fetch("http://127.0.0.1:8000/retrain_model", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail);

      clearInterval(trainingIntervalRef.current);

      setTrainingMessage("Finalizing model...");
      setTrainingProgress(100);

      setTimeout(() => {
        alert("Model retrained successfully 🚀");
        reloadPage();
      }, 800);

    } catch (err) {
      clearInterval(trainingIntervalRef.current);
      alert(err.message);
    } finally {
      setTimeout(() => {
        setIsTraining(false);
      }, 1000);
    }
  };

  const fetchGestureMap = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/extract_map", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setGestureMap(data.map || []);
    } catch (err) {
      console.error(err);
    }
  };

  const deleteGesture = async (name) => {
    if (!window.confirm(`Delete ${name}?`)) return;

    try {
      const res = await fetch("http://127.0.0.1:8000/delete_gesture", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ gesture_name: name })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail);

      alert("Gesture deleted.");
      reloadPage();

    } catch (err) {
      alert(err.message);
    }
  };

  useEffect(() => {
    fetchGestureMap();
  }, []);

  return (
    <div className="min-h-screen bg-[#0b0f1a] text-slate-200">

      <nav className="border-b border-slate-800 px-6 py-4 flex justify-between">
        <div className="flex items-center gap-2">
          <Activity size={18} className="text-blue-500" />
          <span className="font-bold text-xl">GestureAI</span>
        </div>
        <ShieldCheck size={18} />
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-10 grid lg:grid-cols-5 gap-10">

        <div className="lg:col-span-3">
          <div className="aspect-video bg-slate-900 rounded-3xl relative overflow-hidden border border-slate-800">

            {cameraMode ? (
              <>
                <Webcam
                  ref={webcamRef}
                  screenshotFormat="image/jpeg"
                  mirrored
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={closeCamera}
                  className="absolute top-4 right-4 bg-red-600 p-2 rounded-full"
                >
                  <XCircle size={18} />
                </button>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-500">
                <Camera size={42} />
              </div>
            )}

            {cameraMode === "collect" && (
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-black/70">
                <p className="text-sm mb-2">{statusText}</p>
                <div className="w-full bg-slate-700 h-2 rounded">
                  <div
                    className="bg-blue-500 h-2 rounded transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {cameraMode === "predict" && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 px-4 py-2 rounded">
                {statusText}
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">

          <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800">
            <h2 className="mb-4 font-semibold">Collect Gesture</h2>

            <input
              type="text"
              placeholder="Gesture Name"
              value={gestureName}
              onChange={(e) => setGestureName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl mb-3"
            />

            <select
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl mb-3"
            >
              <option value="">Select Action</option>
              {actions.map((a, i) => (
                <option key={i} value={a}>{a}</option>
              ))}
            </select>

            <button
              onClick={startCollection}
              className="w-full bg-blue-600 py-3 rounded-xl"
            >
              Start Guided Collection
            </button>
          </div>

          <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800">
            <div className="space-y-4">
              <button
                onClick={retrainModel}
                disabled={isTraining}
                className="w-full bg-green-600 py-3 rounded-xl flex items-center justify-center gap-2"
              >
                {isTraining && (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                )}
                {isTraining ? "Training Model..." : "Retrain Model"}
              </button>

              {isTraining && (
                <div>
                  <p className="text-sm mb-2">{trainingMessage}</p>
                  <div className="w-full bg-slate-700 h-2 rounded">
                    <div
                      className="bg-green-500 h-2 rounded transition-all duration-500"
                      style={{ width: `${trainingProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800">
            <button
              onClick={startPrediction}
              disabled={isConnecting}
              className="w-full bg-purple-600 py-3 rounded-xl"
            >
              {isConnecting ? "Connecting..." : "Start Live Prediction"}
            </button>
          </div>

          <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800">
            <h2 className="mb-4 font-semibold">Your Gestures</h2>

            {gestureMap.length === 0 ? (
              <p className="text-slate-500 text-sm">No gestures saved</p>
            ) : (
              gestureMap.map((g, i) => (
                <div
                  key={i}
                  className="flex justify-between items-center mb-3 bg-slate-950 p-3 rounded-xl border border-slate-800"
                >
                  <div>
                    <p className="font-semibold">{g.gesture}</p>
                    <p className="text-sm text-slate-400">{g.action}</p>
                  </div>
                  <button
                    onClick={() => deleteGesture(g.gesture)}
                    className="text-red-500"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))
            )}
          </div>

        </div>
      </main>
    </div>
  );
}