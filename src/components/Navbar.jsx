import React from 'react';
import { MousePointer2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Navbar() {
  return (
    <nav className="flex justify-between items-center p-6 bg-[#0f172a] text-white">
      <div className="flex items-center gap-2 text-2xl font-bold text-blue-400">
        <MousePointer2 /> GestureFlow
      </div>
      <div className="hidden md:flex gap-8 text-slate-300">
        <a href="#features" className="hover:text-white transition">Sample</a>
        <a href="#custom-gesture" className="hover:text-white transition">Custom New Gesture</a>
      </div>
      <Link to="/Signup" className="bg-blue-600 hover:bg-blue-500 px-6 py-2 rounded-full font-semibold transition text-white">
        Sign-up
      </Link>
      <Link to="/login" className="bg-blue-600 hover:bg-blue-500 px-6 py-2 rounded-full font-semibold transition text-white">
        Login 
      </Link>
      
      <Link to="/login" className="bg-blue-600 hover:bg-blue-500 px-6 py-2 rounded-full font-semibold transition text-white">
        Get Started
      </Link>
    </nav>
  );
}