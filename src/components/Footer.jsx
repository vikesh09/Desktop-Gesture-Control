import React from 'react';
import { Github, Twitter, Linkedin, Mail } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-[#0f172a] text-slate-400 py-12 border-t border-slate-800">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
          
          {/* Logo & Copyright */}
          <div className="text-center md:text-left">
            <h2 className="text-white text-xl font-bold mb-2">GestureFlow</h2>
            <p className="text-sm">
              Making human-computer interaction <br /> more natural and intuitive.
            </p>
          </div>

          {/* Social Links */}
          <div className="flex gap-6">
            <a href="https://github.com/vikesh09" className="hover:text-blue-400 transition-colors"><Github size={20} /></a>
            <a href="#" className="hover:text-blue-400 transition-colors"><Twitter size={20} /></a>
            <a href="#" className="hover:text-blue-400 transition-colors"><Linkedin size={20} /></a>
            <a href="#" className="hover:text-blue-400 transition-colors"><Mail size={20} /></a>
          </div>

          {/* Links */}
          <div className="flex gap-8 text-sm font-medium">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Documentation</a>
          </div>
        </div>

        <div className="mt-10 pt-8 border-t border-slate-800/50 text-center text-xs tracking-widest uppercase">
          © 2026 Vikesh | Vinay. ALL RIGHTS RESERVED.
        </div>
      </div>
    </footer>
  );
}