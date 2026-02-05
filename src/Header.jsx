import React from 'react';
import { Search, Bell, User } from 'lucide-react';

export default function Header({ setView }) {
  return (
    <nav className="h-16 border-b border-slate-100 bg-white/80 backdrop-blur-md sticky top-0 z-50 px-6 flex items-center justify-between">
      <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('dashboard')}>
        <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center">
          <span className="text-white font-black text-xs">iS</span>
        </div>
        <span className="font-black text-xl tracking-tight text-slate-900">iSpeaktu <span className="text-blue-600">Quiz</span></span>
      </div>
      <div className="flex items-center gap-4">
        <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors"><Search size={20} /></button>
        <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors relative">
          <Bell size={20} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>
        <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden">
          <User size={18} className="text-slate-500" />
        </div>
      </div>
    </nav>
  );
}
