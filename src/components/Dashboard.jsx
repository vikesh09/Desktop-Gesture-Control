import React, { useState, useCallback } from "react";
import Webcam from "react-webcam";
import {
  Brain,
  Database,
  PlayCircle,
  PlusCircle,
  Activity,
  Camera,
  ShieldCheck
} from "lucide-react";

export default function Dashboard() {
  /* ================= STATE ================= */

  const [cameraMode, setCameraMode] = useState(null); 
  // null | "collect" | "predict"

  const [gestureName, setGestureName] = useState("");
  const [selectedAction, setSelectedAction] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const token = localStorage.getItem("token");

  /* ================= CONSTANTS ================= */

  const actions = [
    "Volume Up",
    "Volume Down",
    "Tab Switch",
    "New File in VS Code",
    "Create HTML Template"
  ];

  /* ================= FUNCTIONS ================= */

  const startCollection = useCallback(() => {
    if (!gestureName.trim() || !selectedAction) {
      alert("Please enter gesture name and select action");
      return;
    }

    setCameraMode("collect");
  }, [gestureName, selectedAction]);

  const startPrediction = useCallback(() => {
    setCameraMode("predict");
  }, []);

  const retrainModel = async () => {
    if (!token) {
      alert("Authentication required");
      return;
    }

    try {
      setIsLoading(true);

      const res = await fetch("http://127.0.0.1:8000/retrain_model", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Retrain failed");
      }

      alert("Model retrained successfully!");
    } catch (err) {
      alert(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  /* ================= UI ================= */

  return (
    <div className="min-h-screen bg-[#0b0f1a] text-slate-200 font-sans">

      {/* Header */}
      <nav className="border-b border-slate-800 bg-[#0b0f1a] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Activity size={18} className="text-white" />
            </div>
            <span className="font-bold text-xl text-white">
              Gesture<span className="text-blue-500">AI</span>
            </span>
          </div>

          <div className="flex items-center gap-4 text-sm text-slate-400">
            <span className="flex items-center gap-1">
              <ShieldCheck size={14} /> Secure
            </span>
          </div>
        </div>
      </nav>

      {/* Main */}
      <main className="max-w-7xl mx-auto px-6 py-12 grid lg:grid-cols-3 gap-10">

        {/* Camera Section */}
        <div className="lg:col-span-2">
          <div className="aspect-video bg-slate-900 border border-slate-800 rounded-3xl flex items-center justify-center overflow-hidden relative">

            {cameraMode ? (
              <>
                <Webcam
                  audio={false}
                  mirrored
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-4 left-4 bg-black/50 px-3 py-1 rounded-full text-xs uppercase tracking-widest">
                  {cameraMode === "collect" ? "Collecting Data" : "Live Prediction"}
                </div>
              </>
            ) : (
              <div className="text-center">
                <Camera size={40} className="text-slate-500 mx-auto mb-3" />
                <p className="text-slate-400">Camera inactive</p>
              </div>
            )}
          </div>
        </div>

        {/* Control Panel */}
        <div className="space-y-6">

          {/* Collect Data */}
          <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800">
            <div className="flex items-center gap-2 mb-4">
              <Database size={18} className="text-blue-400" />
              <h2 className="font-semibold">Collect Gesture</h2>
            </div>

            <input
              type="text"
              placeholder="Gesture Name"
              value={gestureName}
              onChange={(e) => setGestureName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl mb-3 text-sm"
            />

            <select
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl mb-4 text-sm"
            >
              <option value="">Select Action</option>
              {actions.map((action, i) => (
                <option key={i} value={action}>
                  {action}
                </option>
              ))}
            </select>

            <button
              onClick={startCollection}
              className="w-full bg-blue-600 hover:bg-blue-500 py-3 rounded-xl font-semibold flex items-center justify-center gap-2"
            >
              <PlusCircle size={16} /> Start Collecting
            </button>
          </div>

          {/* Retrain */}
          <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800">
            <button
              onClick={retrainModel}
              disabled={isLoading}
              className="w-full bg-green-600 hover:bg-green-500 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Brain size={16} />
              {isLoading ? "Training..." : "Retrain Model"}
            </button>
          </div>

          {/* Prediction */}
          <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800">
            <button
              onClick={startPrediction}
              className="w-full bg-purple-600 hover:bg-purple-500 py-3 rounded-xl font-semibold flex items-center justify-center gap-2"
            >
              <PlayCircle size={16} /> Start Prediction
            </button>
          </div>

        </div>
      </main>
    </div>
  );
}
