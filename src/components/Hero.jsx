import React, { useState } from 'react'; // useState import kiya
import Webcam from "react-webcam";
import { PlayCircle, Hand } from 'lucide-react';

export default function Hero() {
  // Ek state banayi: shuru me camera band (false) rahega
  const [showCamera, setShowCamera] = useState(false);

  return (
    <div className="flex flex-col items-center text-center py-20 bg-[#0f172a] text-white">
      <h1 className="text-5xl font-bold mb-6">Control with Your Hands</h1>
      
      {/* Box Section */}
      <div className="relative w-full max-w-2xl aspect-video bg-slate-900 border border-slate-800 rounded-3xl flex items-center justify-center mb-10 shadow-2xl overflow-hidden">
        
        {showCamera ? (
          // Agar showCamera true hai toh Webcam dikhao
          <Webcam 
            audio={false}
            className="w-full h-full object-cover"
            mirrored={true}
          />
        ) : (
          // Agar false hai toh purana hand icon dikhao
          <div className="p-10 border border-blue-500/20 rounded-full animate-pulse">
            <Hand size={80} className="text-blue-400" />
          </div>
        )}
      </div>

      <div className="flex gap-4">
        {/* onClick lagaya jo state ko badal dega */}
        <button 
          onClick={() => setShowCamera(true)} 
          className="bg-blue-500 hover:bg-blue-400 px-8 py-3 rounded-full font-bold transition"
        >
          {showCamera ? "System Active" : "Launch App"}
        </button>

        <button 
          onClick={() => alert("Demo video is coming soon!")} 
          className="bg-slate-800 hover:bg-slate-700 px-8 py-3 rounded-full font-bold flex items-center gap-2 transition"
        >
          <PlayCircle size={20}/> Watch Demo
        </button>
      </div>
    </div>
  );
}