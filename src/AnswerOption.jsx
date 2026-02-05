import React from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';

export default function AnswerOption({
  text,
  index,
  isSelected,
  isAnswered,
  isCorrect,
  onSelect
}) {
  let style = "border-slate-100 hover:border-slate-300 bg-white";
  if (isSelected) style = "border-blue-600 bg-blue-50 ring-4 ring-blue-50";
  if (isAnswered) {
    if (isCorrect) style = "border-green-500 bg-green-50";
    else if (isSelected) style = "border-red-500 bg-red-50";
    else style = "border-slate-50 opacity-40";
  }

  return (
    <button 
      key={index}
      disabled={isAnswered}
      onClick={() => onSelect(index)}
      className={`w-full p-5 rounded-2xl border-2 text-left font-bold flex items-center justify-between transition-all ${style}`}
    >
      {text}
      {isAnswered && isCorrect && <CheckCircle2 className="text-green-500" size={20} />}
      {isAnswered && isSelected && !isCorrect && <XCircle className="text-red-500" size={20} />}
    </button>
  );
}
