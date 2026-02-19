import React from 'react';
import { Link, useNavigate } from 'react-router-dom'; // useNavigate add kiya

export default function Login() {
  const navigate = useNavigate(); // Navigation function banaya

  const handleLogin = (e) => {
    e.preventDefault(); // Form ko refresh hone se rokne ke liye
    
    // Yahan aap apna authentication logic daal sakte hain
    console.log("Login Successful!"); 
    
    // Login hote hi Home page par bhej do
    navigate('/'); 
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center px-6">
      <div className="max-w-md w-full bg-slate-900 p-10 rounded-[30px] border border-blue-500/20 shadow-2xl">
        <h2 className="text-3xl font-bold text-white text-center mb-8">Welcome Back</h2>
        
        {/* onSubmit par handleLogin function lagaya */}
        <form className="space-y-6" onSubmit={handleLogin}>
          <input type="email" required placeholder="Email Address" className="w-full bg-slate-800 border border-slate-700 p-4 rounded-xl text-white focus:outline-none focus:border-blue-500" />
          <input type="password" required placeholder="Password" className="w-full bg-slate-800 border border-slate-700 p-4 rounded-xl text-white focus:outline-none focus:border-blue-500" />
          
          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl transition shadow-lg shadow-blue-600/20">
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