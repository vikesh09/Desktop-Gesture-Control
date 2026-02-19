import React from 'react';
import { MousePointer2, Settings, Zap, Fingerprint, Cpu, Share2 } from 'lucide-react';

export default function Features() {
  const cards = [
    { 
      icon: <MousePointer2 size={32} />, 
      title: "Precision Control", 
      desc: "Millimeter-level accuracy for cursor movement and clicks using AI hand tracking.",
      color: "blue"
    },
    { 
      icon: <Settings size={32} />, 
      title: "Custom Gestures", 
      desc: "Map your own hand signs to system shortcuts like Alt+Tab, Volume, or Media play.",
      color: "purple"
    },
    { 
      icon: <Zap size={32} />, 
      title: "Real-time Response", 
      desc: "Powered by MediaPipe with near-zero latency, ensuring a lag-free desktop experience.",
      color: "yellow"
    },
    { 
      icon: <Fingerprint size={32} />, 
      title: "Secure Access", 
      desc: "Biometric hand-pattern recognition to ensure only you can control your device.",
      color: "green"
    },
    { 
      icon: <Cpu size={32} />, 
      title: "Low Resource Use", 
      desc: "Optimized backend that runs smoothly without slowing down your computer.",
      color: "red"
    },
    { 
      icon: <Share2 size={32} />, 
      title: "Cross Platform", 
      desc: "Seamlessly works across Windows, macOS, and Linux with the same configuration.",
      color: "indigo"
    },
    {
      

      icon: <Share2 size={32} />, 
      title: "Create Custom Gesture", 
      desc: "Record your own unique hand movements and assign them to any desktop action.",
      isAction: true 

    }
  ];

  return (
    <section id="features" className="bg-white py-24 px-6 rounded-t-[50px] -mt-10 relative z-10">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-16">
          <span className="text-blue-600 font-bold tracking-widest uppercase text-sm">Capabilities</span>
          <h2 className="text-4xl md:text-5xl font-black text-slate-900 mt-3 mb-6">
            Advanced Gesture <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Technology</span>
          </h2>
          <p className="text-slate-500 text-lg max-w-2xl mx-auto font-medium">
            Everything you need to turn your webcam into a powerful input device.
          </p>
        </div>

        {/* Grid Section */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {cards.map((c, i) => (
            <div 
              key={i} 
              className="group bg-slate-50 p-8 rounded-3xl border border-slate-100 hover:bg-slate-900 transition-all duration-500 cursor-pointer shadow-sm hover:shadow-2xl hover:-translate-y-2"
            >
              <div className="bg-white group-hover:bg-slate-800 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-md group-hover:scale-110 transition-all duration-500">
                <span className="text-blue-600 group-hover:text-blue-400">
                  {c.icon}
                </span>
              </div>
              <h3 className="text-xl font-bold mb-3 text-slate-900 group-hover:text-white transition-colors">
                {c.title}
              </h3>
              <p className="text-slate-500 group-hover:text-slate-400 leading-relaxed transition-colors">
                {c.desc}
              </p>
              
              {/* Invisible Button that appears on hover */}
              <div className="mt-6 opacity-0 group-hover:opacity-100 transition-opacity flex items-center text-blue-400 font-bold text-sm">
                Learn more <span className="ml-2">→</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}