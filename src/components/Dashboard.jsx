import React, { useState, useCallback, useRef, useEffect } from "react";
import Webcam from "react-webcam";
import {
  Brain,
  Database,
  PlayCircle,
  PlusCircle,
  Activity,
  Camera,
  ShieldCheck,
  Trash2,
  XCircle
} from "lucide-react";

export default function Dashboard() {

  /* ================= STATE ================= */

  const [cameraMode, setCameraMode] = useState(null); // null | collect | predict
  const [gestureName, setGestureName] = useState("");
  const [selectedAction, setSelectedAction] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [gestureMap, setGestureMap] = useState([]);
  const [isTraining, setIsTraining] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  const webcamRef = useRef(null);
  const wsRef = useRef(null);
  const predictionIntervalRef = useRef(null);

  const token = localStorage.getItem("token");

  const actions = [
    "Volume Up",
    "Volume Down",
    "Tab Switch",
    "New File in VS Code",
    "Create HTML Template"
  ];

  /* ================= CAMERA CONTROL ================= */

  const closeCamera = () => {
    setCameraMode(null);
    setStatusText("");

    if (predictionIntervalRef.current) {
      clearInterval(predictionIntervalRef.current);
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  };

  /* ================= COLLECT ================= */

  const captureFramesAndSend = async () => {
    if (!webcamRef.current) return;

    let frames = [];
    setStatusText("Capturing 10 frames...");

    for (let i = 0; i < 10; i++) {
      const shot = webcamRef.current.getScreenshot();
      if (shot) frames.push(shot);
      await new Promise(res => setTimeout(res, 200));
    }

    if (frames.length === 0) {
      alert("No frames captured");
      return;
    }

    try {
      setIsLoading(true);

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

      setStatusText(data.message);
      fetchGestureMap();
      alert("Gesture Saved!");
    } catch (err) {
      alert(err.message);
    } finally {
      setIsLoading(false);
      closeCamera();
    }
  };

  const startCollection = useCallback(() => {
    if (!gestureName.trim() || !selectedAction) {
      alert("Enter gesture name & action");
      return;
    }

    setCameraMode("collect");

    setTimeout(() => {
      captureFramesAndSend();
    }, 1000);
  }, [gestureName, selectedAction]);

  /* ================= PREDICTION ================= */

  const startPrediction = () => {
    setIsConnecting(true);

    const ws = new WebSocket("ws://127.0.0.1:8000/ws/predict");
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ token }));
      setCameraMode("predict");
      setIsConnecting(false);
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.prediction) {
        setStatusText(`Prediction: ${data.prediction}`);
      }
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
          if (frame) {
            wsRef.current.send(JSON.stringify({ frame }));
          }
        }
      }, 300);
    }

    return () => {
      if (predictionIntervalRef.current) {
        clearInterval(predictionIntervalRef.current);
      }
    };
  }, [cameraMode]);

  /* ================= RETRAIN ================= */

  const retrainModel = async () => {
    try {
      setIsTraining(true);

      const res = await fetch("http://127.0.0.1:8000/retrain_model", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail);

      alert("Model retrained successfully!");
    } catch (err) {
      alert(err.message);
    } finally {
      setIsTraining(false);
    }
  };


  /* ================= EXTRACT MAP ================= */

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

  /* ================= DELETE ================= */

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

      fetchGestureMap();
      alert("Deleted. Retrain model.");
    } catch (err) {
      alert(err.message);
    }
  };

  /* ================= LOAD MAP ON START ================= */

  useEffect(() => {
    fetchGestureMap();
  }, []);

  /* ================= UI ================= */

  return (
  <div className="min-h-screen bg-[#0b0f1a] text-slate-200">

    {/* Header */}
    <nav className="border-b border-slate-800 px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Activity size={18} className="text-blue-500" />
        <span className="font-bold text-xl tracking-wide">GestureAI</span>
      </div>
      <ShieldCheck size={18} className="text-slate-400" />
    </nav>

    {/* Training Overlay */}
    {isTraining && (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm">
        <div className="bg-slate-900 p-10 rounded-3xl flex flex-col items-center gap-5 border border-slate-800 shadow-2xl">
          <div className="w-14 h-14 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-lg font-semibold">Training Model...</p>
          <p className="text-slate-400 text-sm">Optimizing your gestures</p>
        </div>
      </div>
    )}

    <main className="max-w-7xl mx-auto px-6 py-10 grid lg:grid-cols-5 gap-10">

      {/* CAMERA SECTION */}
      <div className="lg:col-span-3">
        <div className="aspect-video bg-slate-900 rounded-3xl flex items-center justify-center relative overflow-hidden border border-slate-800 shadow-xl">

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
                className="absolute top-4 right-4 bg-red-600 hover:bg-red-500 p-2 rounded-full transition"
              >
                <XCircle size={18} />
              </button>
            </>
          ) : (
            <div className="text-center">
              <Camera size={42} className="text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">Camera inactive</p>
            </div>
          )}

          {statusText && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 px-5 py-2 rounded-xl text-sm backdrop-blur-md border border-slate-700">
              {statusText}
            </div>
          )}
        </div>
      </div>

      {/* CONTROL PANEL */}
      <div className="lg:col-span-2 space-y-6">

        {/* Collect Gesture */}
        <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-md">
          <h2 className="mb-4 font-semibold text-slate-300 tracking-wide">
            Collect Gesture
          </h2>

          <input
            type="text"
            placeholder="Gesture Name"
            value={gestureName}
            onChange={(e) => setGestureName(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl mb-3 focus:border-blue-500 focus:outline-none transition"
          />

          <select
            value={selectedAction}
            onChange={(e) => setSelectedAction(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl mb-4 focus:border-blue-500 focus:outline-none transition"
          >
            <option value="">Select Action</option>
            {actions.map((a, i) => (
              <option key={i} value={a}>{a}</option>
            ))}
          </select>

          <button
            onClick={startCollection}
            className="w-full bg-blue-600 hover:bg-blue-500 py-3 rounded-xl transition font-medium"
          >
            Start Collecting
          </button>
        </div>

        {/* Retrain */}
        <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-md">
          <button
            onClick={retrainModel}
            disabled={isTraining}
            className="w-full bg-green-600 hover:bg-green-500 py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-60 transition font-medium"
          >
            {isTraining ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Training...
              </>
            ) : (
              <>
                <Brain size={16} />
                Retrain Model
              </>
            )}
          </button>
        </div>

        {/* Predict */}
        <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-md">
          <button
            onClick={startPrediction}
            disabled={isConnecting}
            className="w-full bg-purple-600 hover:bg-purple-500 py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-60 transition font-medium"
          >
            {isConnecting ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Connecting...
              </>
            ) : (
              <>
                <PlayCircle size={16} />
                Start Live Prediction
              </>
            )}
          </button>
        </div>

        {/* Gesture Map */}
        <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-md">
          <h2 className="mb-4 font-semibold text-slate-300 tracking-wide">
            Your Gestures
          </h2>

          {gestureMap.length === 0 ? (
            <p className="text-slate-500 text-sm">No gestures saved</p>
          ) : (
            gestureMap.map((g, i) => (
              <div
                key={i}
                className="flex justify-between items-center mb-3 bg-slate-950 p-3 rounded-xl border border-slate-800 hover:border-slate-700 transition"
              >
                <div>
                  <p className="font-semibold">{g.gesture}</p>
                  <p className="text-sm text-slate-400">{g.action}</p>
                </div>
                <button
                  onClick={() => deleteGesture(g.gesture)}
                  className="text-red-500 hover:text-red-400 transition"
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
