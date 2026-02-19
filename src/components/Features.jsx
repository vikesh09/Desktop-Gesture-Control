import React from 'react';
import { MousePointer2, Settings, Zap, Fingerprint, Cpu, Share2, Target, Wand2 } from 'lucide-react';

export default function Features() {
  const cards = [
    { 
      icon: <Target size={28} />, 
      title: "Precision Control", 
      desc: "Millimeter-level accuracy for cursor movement and clicks using AI hand tracking.",
      accent: "from-blue-500 to-cyan-400"
    },
    { 
      icon: <Settings size={28} />, 
      title: "Custom Gestures", 
      desc: "Map your own hand signs to system shortcuts like Alt+Tab, Volume, or Media play.",
      accent: "from-purple-500 to-pink-500"
    },
    { 
      icon: <Zap size={28} />, 
      title: "Real-time Response", 
      desc: "Powered by MediaPipe with near-zero latency, ensuring a lag-free experience.",
      accent: "from-yellow-400 to-orange-500"
    },
    { 
      icon: <Fingerprint size={28} />, 
      title: "Secure Access", 
      desc: "Biometric hand-pattern recognition to ensure only you can control your device.",
      accent: "from-green-500 to-emerald-400"
    },
    { 
      icon: <Cpu size={28} />, 
      title: "Low Resource Use", 
      desc: "Optimized backend that runs smoothly without slowing down your computer.",
      accent: "from-red-500 to-rose-400"
    },
    { 
      icon: <Wand2 size={28} />, 
      title: "Custom Training", 
      desc: "Record unique movements and assign them to any desktop action in seconds.",
      accent: "from-indigo-500 to-blue-400"
    }
  ];

  return (
    <section id="features" className="bg-[#0b0f1a] py-24 px-6 relative overflow-hidden">
      
      {/* Background Glows (Dashboard vibes) */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* Header Section */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 px-4 py-1.5 rounded-full mb-4">
            <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
            <span className="text-blue-400 font-bold tracking-widest uppercase text-[10px]">Capabilities</span>
          </div>
          <h2 className="text-4xl md:text-6xl font-black text-white mt-3 mb-6 tracking-tight">
            Next-Gen <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Interface</span>
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto font-medium leading-relaxed">
            Turn your standard webcam into a sophisticated spatial controller with our advanced neural processing engine.
          </p>
        </div>

        {/* Grid Section */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map((c, i) => (
            <div 
              key={i} 
              className="group relative bg-slate-900/40 backdrop-blur-sm p-8 rounded-[2.5rem] border border-slate-800/50 hover:border-slate-700 transition-all duration-500 cursor-default shadow-xl"
            >
              {/* Card Gradient Hover Effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-slate-800/0 to-slate-800/0 group-hover:from-slate-800/20 group-hover:to-slate-800/40 rounded-[2.5rem] transition-all duration-500"></div>

              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${c.accent} p-[1px] mb-6 group-hover:scale-110 transition-transform duration-500 shadow-lg`}>
                <div className="w-full h-full bg-[#0b0f1a] rounded-[calc(1rem-1px)] flex items-center justify-center text-white">
                  {c.icon}
                </div>
              </div>

              <h3 className="text-xl font-bold mb-3 text-white transition-colors relative z-10">
                {c.title}
              </h3>
              <p className="text-slate-500 group-hover:text-slate-400 leading-relaxed transition-colors relative z-10">
                {c.desc}
              </p>
              
              <div className="mt-8 flex items-center text-slate-600 group-hover:text-blue-400 font-bold text-xs uppercase tracking-[0.2em] transition-all relative z-10">
                System Integrated <div className="ml-2 h-[1px] w-8 bg-slate-800 group-hover:w-12 group-hover:bg-blue-400 transition-all"></div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Call to Action (Optional) */}
        <div className="mt-20 p-8 rounded-[3rem] bg-gradient-to-r from-blue-600/10 to-purple-600/10 border border-white/5 text-center">
             <p className="text-slate-300 font-medium">Ready to experience the future? <button className="text-blue-400 hover:text-blue-300 ml-2 underline underline-offset-4 decoration-2">Launch Dashboard →</button></p>
        </div>
      </div>
    </section>
  );
}