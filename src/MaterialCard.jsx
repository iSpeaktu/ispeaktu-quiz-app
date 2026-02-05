import React from 'react';
import { ChevronRight } from 'lucide-react';

export default function MaterialCard({ icon: Icon, title, count }) {
  return (
    <>
      <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-blue-50 transition-colors">
        <Icon className="text-slate-400 group-hover:text-blue-600 transition-colors" size={28} />
      </div>
      <h3 className="text-2xl font-black text-slate-900 mb-2">{title}</h3>
      <p className="text-slate-400 font-medium mb-8">{count} Specialized Lessons</p>
      <div className="flex items-center gap-2 text-blue-600 font-black text-sm">
        Explore Material <ChevronRight size={18} />
      </div>
    </>
  );
}
