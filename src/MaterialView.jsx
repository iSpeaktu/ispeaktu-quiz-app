import React from 'react';
import { ChevronLeft, CheckCircle2 } from 'lucide-react';

export default function MaterialView({ selectedMaterial, setView }) {
  return (
    <div className="max-w-6xl mx-auto py-10 px-6 animate-in fade-in duration-300">
      <button onClick={() => setView('dashboard')} className="flex items-center gap-2 text-slate-400 hover:text-slate-900 font-bold text-sm mb-8 transition-colors">
        <ChevronLeft size={16} /> Back to Dashboard
      </button>
      
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
        <div>
          <h2 className="text-4xl font-black text-slate-900 mb-2">{selectedMaterial.title}</h2>
          <p className="text-slate-500 font-medium">Curated content for professional growth.</p>
        </div>
        <div className="bg-blue-50 px-6 py-3 rounded-2xl flex items-center gap-4">
          <div className="text-right">
            <div className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Progress</div>
            <div className="text-xl font-black text-blue-600">8 / 50</div>
          </div>
          <div className="w-12 h-12 rounded-full border-4 border-blue-100 border-t-blue-600 flex items-center justify-center text-[10px] font-black text-blue-600">
            16%
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(12)].map((_, i) => (
          <div 
            key={i} 
            onClick={() => setView('quiz')}
            className="bg-white border border-slate-100 p-6 rounded-[1.5rem] hover:shadow-lg hover:border-blue-200 transition-all cursor-pointer group"
          >
            <div className="flex justify-between items-start mb-6">
              <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all font-black text-xs">
                {i + 1}
              </div>
              {i < 3 && <CheckCircle2 className="text-green-500" size={20} />}
            </div>
            <h4 className="font-bold text-slate-900 mb-1">Lesson Title {i + 1}</h4>
            <p className="text-xs text-slate-400 font-medium">20 Questions • Grammar focus</p>
          </div>
        ))}
      </div>
    </div>
  );
}
