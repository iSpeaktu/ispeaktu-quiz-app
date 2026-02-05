import React from 'react';
import { CheckCircle2, XCircle, ArrowRight } from 'lucide-react';

export default function QuizView({
  question,
  selectedOption,
  isAnswered,
  setSelectedOption,
  setIsAnswered,
  setView
}) {
  return (
    <div className="max-w-2xl mx-auto py-12 px-6 animate-in slide-in-from-right-8 duration-500">
      <div className="flex justify-between items-center mb-8">
        <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-3 py-1 rounded-full">Lesson 04 • Grammar</span>
        <span className="text-xs font-bold text-slate-400">Question 1/20</span>
      </div>

      <div className="w-full h-1.5 bg-slate-100 rounded-full mb-12 overflow-hidden">
        <div className="h-full bg-blue-600 transition-all duration-1000 w-[5%]" />
      </div>

      <div className="bg-white border border-slate-100 rounded-[2.5rem] p-10 shadow-sm mb-8">
        <h2 className="text-2xl font-bold text-slate-900 mb-10 leading-snug">
          {question.text}
        </h2>

        <div className="space-y-3">
          {question.options.map((opt, i) => {
            let style = "border-slate-100 hover:border-slate-300 bg-white";
            if (selectedOption === i) style = "border-blue-600 bg-blue-50 ring-4 ring-blue-50";
            if (isAnswered) {
              if (i === question.correct) style = "border-green-500 bg-green-50";
              else if (selectedOption === i) style = "border-red-500 bg-red-50";
              else style = "border-slate-50 opacity-40";
            }

            return (
              <button 
                key={i}
                disabled={isAnswered}
                onClick={() => setSelectedOption(i)}
                className={`w-full p-5 rounded-2xl border-2 text-left font-bold flex items-center justify-between transition-all ${style}`}
              >
                {opt}
                {isAnswered && i === question.correct && <CheckCircle2 className="text-green-500" size={20} />}
                {isAnswered && selectedOption === i && i !== question.correct && <XCircle className="text-red-500" size={20} />}
              </button>
            );
          })}
        </div>
      </div>

      {isAnswered ? (
        <div className="animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="bg-slate-900 rounded-[2rem] p-8 text-white mb-6">
            <div className="text-blue-400 text-[10px] font-black uppercase tracking-widest mb-2">The iSpeaktu Explanation</div>
            <p className="text-sm leading-relaxed opacity-80">{question.explanation}</p>
          </div>
          <button 
            onClick={() => setView('results')}
            className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black text-lg flex items-center justify-center gap-3 hover:bg-blue-700 transition-all shadow-xl shadow-blue-100"
          >
            Next Question <ArrowRight size={20} />
          </button>
        </div>
      ) : (
        <button 
          disabled={selectedOption === null}
          onClick={() => setIsAnswered(true)}
          className={`w-full py-5 rounded-2xl font-black text-lg transition-all ${selectedOption === null ? 'bg-slate-100 text-slate-300' : 'bg-slate-900 text-white hover:bg-slate-800 shadow-xl shadow-slate-200'}`}
        >
          Check Answer
        </button>
      )}
    </div>
  );
}
