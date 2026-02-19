import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import Features from './components/Features';
import Footer from './components/Footer';
import Login from './components/Login';
import Signup from './components/Signup';

function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-[#0f172a]">
        <Navbar />

        <main className="flex-grow">
          <Routes>

            {/* Dashboard as Home */}
            <Route path="/" element={<Dashboard />} />

            {/* Auth Pages */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

          </Routes>
        </main>

        <Footer />
      </div>
    </Router>
  );
}

export default App;
