import React from 'react';
import { CheckCircle2 } from 'lucide-react';

export default function LessonCard({ number, title, subtitle, completed }) {
  return (
    <>
      <div className="flex justify-between items-start mb-6">
        <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all font-black text-xs">
          {number}
        </div>
        {completed && <CheckCircle2 className="text-green-500" size={20} />}
      </div>
      <h4 className="font-bold text-slate-900 mb-1">{title}</h4>
      <p className="text-xs text-slate-400 font-medium">{subtitle}</p>
    </>
  );
}
