import React from 'react';
import { BarChart3, ChevronRight } from 'lucide-react';

export default function Dashboard({ materials, onSelectMaterial }) {
  return (
    <div className="max-w-6xl mx-auto py-10 px-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="mb-10">
        <h1 className="text-4xl font-black text-slate-900 mb-2">My Learning Dashboard</h1>
        <p className="text-slate-500 font-medium">Select a material to begin your daily practice.</p>
      </header>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Progress Summary Card */}
        <div className="bg-slate-900 rounded-[2rem] p-8 text-white shadow-2xl shadow-slate-200">
          <BarChart3 className="text-blue-400 mb-6" size={32} />
          <div className="text-5xl font-black mb-1">74%</div>
          <div className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-8">Average Mastery</div>
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span className="opacity-60">Quizzes Completed</span>
              <span className="font-bold">12 / 100</span>
            </div>
            <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 w-[12%]" />
            </div>
          </div>
        </div>

        {/* Material Cards */}
        {materials.map((mat) => (
          <div 
            key={mat.id}
            onClick={() => onSelectMaterial(mat)}
            className="bg-white border-2 border-slate-100 rounded-[2rem] p-8 cursor-pointer hover:border-blue-600 hover:shadow-xl hover:shadow-blue-50/50 transition-all group"
          >
            <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-blue-50 transition-colors">
              <mat.icon className="text-slate-400 group-hover:text-blue-600 transition-colors" size={28} />
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-2">{mat.title}</h3>
            <p className="text-slate-400 font-medium mb-8">{mat.count} Specialized Lessons</p>
            <div className="flex items-center gap-2 text-blue-600 font-black text-sm">
              Explore Material <ChevronRight size={18} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
