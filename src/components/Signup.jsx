import React from 'react';
import { Link } from 'react-router-dom';

export default function Signup() {
  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center px-6">
      <div className="max-w-md w-full bg-slate-900 p-10 rounded-[30px] border border-blue-500/20 shadow-2xl">
        <h2 className="text-3xl font-bold text-white text-center mb-8">Create Account</h2>
        <form className="space-y-6">
          <input type="text" placeholder="Full Name" className="w-full bg-slate-800 border border-slate-700 p-4 rounded-xl text-white focus:outline-none focus:border-blue-500" />
          <input type="email" placeholder="Email Address" className="w-full bg-slate-800 border border-slate-700 p-4 rounded-xl text-white focus:outline-none focus:border-blue-500" />
          <input type="password" placeholder="Password" className="w-full bg-slate-800 border border-slate-700 p-4 rounded-xl text-white focus:outline-none focus:border-blue-500" />
          <button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl transition shadow-lg shadow-blue-600/20">Sign Up</button>
        </form>
        <p className="text-slate-400 text-center mt-6 text-sm">
          Already have an account? <Link to="/login" className="text-blue-400 hover:underline">Login</Link>
        </p>
      </div>
    </div>
  );
}