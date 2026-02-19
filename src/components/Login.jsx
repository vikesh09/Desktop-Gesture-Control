import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';



export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch("http://127.0.0.1:8000/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem("token", data.access_token);
        alert("Login Successful!");
        navigate('/dashboard');
      } else {
        alert(data.detail);
      }

    } catch (error) {
      alert("Server error. Try again.");
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center px-6">
      <div className="max-w-md w-full bg-slate-900 p-10 rounded-[30px] border border-blue-500/20 shadow-2xl">
        <h2 className="text-3xl font-bold text-white text-center mb-8">Welcome Back</h2>

        <form className="space-y-6" onSubmit={handleLogin}>
          <input 
            type="email" 
            required 
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 p-4 rounded-xl text-white focus:outline-none focus:border-blue-500" 
          />

          <input 
            type="password" 
            required 
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 p-4 rounded-xl text-white focus:outline-none focus:border-blue-500" 
          />

          <button 
            type="submit" 
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl transition shadow-lg shadow-blue-600/20">
            Login
          </button>
        </form>

        <p className="text-slate-400 text-center mt-6 text-sm">
          Don't have an account? <Link to="/signup" className="text-blue-400 hover:underline">Sign Up</Link>
        </p>
      </div>
    </div>
  );
}
