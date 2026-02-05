import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, CheckCircle, ChevronRight, Award, GraduationCap, MessageSquare, 
  ArrowRight, Sparkles, Globe, BarChart3, Lock, X, LogOut, Info, 
  RefreshCw, AlertCircle, AlertTriangle, TrendingUp, BrainCircuit, 
  BellRing, Send, UserCheck, Clock, Search, Eye, FileText, BellOff, Target, Check 
} from 'lucide-react';

import { supabase, HAS_SUPABASE } from './supabaseClient';

// --- Centralized Theme & Feedback Tiers ---
const THEME = {
  colors: { primary: '#4F46E5', conversational: '#2563EB', verified: '#059669', business: '#2563EB', danger: '#E11D48', warning: '#D97706', neutral: '#F8FAFC', white: '#FFFFFF' },
  classes: { 
    primaryButton: 'bg-indigo-600 text-white hover:bg-indigo-700', 
    primaryText: 'text-indigo-600',
    dangerText: 'text-rose-600',
    warningText: 'text-amber-600',
    verifiedText: 'text-emerald-700'
  }
};

const FEEDBACK_TIERS = {
  BEGINNER: { range: [0, 39], label: 'Beginner', color: 'text-rose-600', note: "Keep practicing, every step counts!" },
  ELEMENTARY: { range: [40, 54], label: 'Elementary', color: 'text-orange-600', note: "You're making progress—let's build on this!" },
  PRE_INTERMEDIATE: { range: [55, 69], label: 'Pre-Intermediate', color: 'text-amber-600', note: "Nice work! You're getting stronger." },
  INTERMEDIATE: { range: [70, 84], label: 'Intermediate', color: 'text-blue-600', note: "Excellent progress, you're doing great!" },
  ADVANCED: { range: [85, 100], label: 'Advanced', color: 'text-emerald-600', note: "Outstanding! You've mastered this lesson." }
};

const STORAGE_KEYS = { PROGRESS: 'ispeaktu_v1_progress', REMINDERS: 'ispeaktu_v1_reminders', AUTH: 'ispeaktu_v1_auth' };
const TEACHER_ACCESS_CODE = "teacher";

export default function App() {
  // --- State ---
  const [view, setView] = useState('student'); 
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(() => localStorage.getItem(STORAGE_KEYS.AUTH) !== null);
  const [isTeacherAuthorized, setIsTeacherAuthorized] = useState(false);
  const [allStudentsProgress, setAllStudentsProgress] = useState([]);
  const [allReminders, setAllReminders] = useState([]);
  const [curriculum, setCurriculum] = useState([]);
  const [selectedMaterialId, setSelectedMaterialId] = useState('');
  const [activeLesson, setActiveLesson] = useState(null);
  const [userName, setUserName] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [loginError, setLoginError] = useState('');
  const [user, setUser] = useState(null);
  const [teacherSearchTerm, setTeacherSearchTerm] = useState('');

  const [quizState, setQuizState] = useState({ 
    currentQuestion: 0, score: 0, showFeedback: false, selectedOption: null, completed: false, responses: [] 
  });

  // --- Data Syncing ---
  const fetchCurriculum = async () => {
    try {
      if (!HAS_SUPABASE) return;
      const { data, error } = await supabase.from('materials').select('*, lessons(*, questions(*))').order('order_index');
      if (error) throw error;
      const formatted = (data || []).map(m => ({
        ...m,
        lessons: (m.lessons || []).sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
      }));
      setCurriculum(formatted);
      if (formatted.length > 0 && !selectedMaterialId) setSelectedMaterialId(formatted[0].id);
    } catch (error) { console.error("Load error:", error); }
  };

  const fetchRemoteData = async (targetUser) => {
    if (!HAS_SUPABASE) return;
    try {
      const { data: prog } = await supabase.from('progress').select('*');
      if (prog) setAllStudentsProgress(prog);
      const { data: rem } = await supabase.from('reminders').select('*');
      if (rem) setAllReminders(rem);
    } catch (err) { console.warn("Sync failed", err); }
  };

  useEffect(() => {
    const init = async () => {
      const saved = localStorage.getItem(STORAGE_KEYS.AUTH);
      if (saved) {
        const parsed = JSON.parse(saved);
        setUser(parsed);
        setUserName(parsed.displayName || '');
        setIsAuthenticated(true);
        if (parsed.isTeacher) setIsTeacherAuthorized(true);
        await fetchRemoteData(parsed);
      }
      await fetchCurriculum();
      setIsLoading(false);
    };
    init();
  }, []);

  // --- Logic Helpers ---
  const currentMaterial = useMemo(() => curriculum.find(m => m.id === selectedMaterialId) || curriculum[0], [curriculum, selectedMaterialId]);
  
  const studentProgress = useMemo(() => user ? allStudentsProgress.filter(p => p.student_id === user.uid) : [], [allStudentsProgress, user]);

  const materialCompletion = useMemo(() => {
    if (!currentMaterial || !user) return 0;
    const total = currentMaterial.lessons?.length || 0;
    if (total === 0) return 0;
    const completed = new Set(allStudentsProgress.filter(p => p.material_id === currentMaterial.id && p.student_id === user.uid && p.verified).map(p => p.lesson_id)).size;
    return Math.round((completed / total) * 100);
  }, [currentMaterial, allStudentsProgress, user]);

  const getFeedback = (score) => {
    const entry = Object.values(FEEDBACK_TIERS).find(t => score >= t.range[0] && score <= t.range[1]);
    return entry || FEEDBACK_TIERS.BEGINNER;
  };

  const handleLogin = (e) => {
    e.preventDefault();
    const isTeacher = view === 'teacher' && accessCode === TEACHER_ACCESS_CODE;
    if (view === 'teacher' && accessCode !== TEACHER_ACCESS_CODE) { setLoginError('Invalid Code'); return; }
    const newUser = { uid: `user_${userName.trim().toLowerCase().replace(/\s+/g, '_')}`, displayName: userName, isTeacher };
    setUser(newUser); setIsAuthenticated(true);
    localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(newUser));
    fetchRemoteData(newUser);
  };

  const handleLogout = () => {
    localStorage.removeItem(STORAGE_KEYS.AUTH);
    window.location.reload();
  };

  // --- Render ---
  if (isLoading && isAuthenticated) return <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50"><RefreshCw className="animate-spin text-indigo-600 mb-4" size={48} /><p className="font-bold text-slate-400">Loading Materials...</p></div>;

  if (!isAuthenticated) return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50">
      <div className="md:w-1/2 bg-indigo-600 p-12 text-white flex flex-col justify-center">
        <GraduationCap size={60} className="mb-6" />
        <h1 className="text-5xl font-black mb-4">iSpeaktu Quiz</h1>
        <p className="text-xl opacity-80">Track your progress and master English.</p>
      </div>
      <div className="flex-1 flex items-center justify-center p-8">
        <form onSubmit={handleLogin} className="w-full max-w-md space-y-6">
          <h2 className="text-3xl font-bold">Welcome</h2>
          <input type="text" value={userName} onChange={(e) => setUserName(e.target.value)} placeholder="Display Name" className="w-full p-4 border rounded-2xl outline-none focus:ring-2 focus:ring-indigo-600" required />
          <div className="grid grid-cols-2 gap-4">
            <button type="button" onClick={() => setView('student')} className={`p-3 rounded-xl border-2 font-bold ${view === 'student' ? 'border-indigo-600 text-indigo-600' : 'text-slate-400'}`}>Student</button>
            <button type="button" onClick={() => setView('teacher')} className={`p-3 rounded-xl border-2 font-bold ${view === 'teacher' ? 'border-indigo-600 text-indigo-600' : 'text-slate-400'}`}>Teacher</button>
          </div>
          {view === 'teacher' && <input type="password" value={accessCode} onChange={(e) => setAccessCode(e.target.value)} placeholder="Teacher Code" className="w-full p-4 border rounded-2xl" required />}
          <button type="submit" className="w-full bg-indigo-600 text-white p-4 rounded-2xl font-black">Start Learning</button>
        </form>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="h-16 bg-white border-b px-6 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2 font-black text-indigo-600 text-xl"><GraduationCap /><span>iSpeaktu</span></div>
        <div className="flex items-center gap-4">
          {isTeacherAuthorized && (
            <div className="bg-slate-100 p-1 rounded-lg">
              <button onClick={() => setView('student')} className={`px-4 py-1 text-xs font-bold rounded-md ${view === 'student' ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}>Student</button>
              <button onClick={() => setView('teacher')} className={`px-4 py-1 text-xs font-bold rounded-md ${view === 'teacher' ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}>Teacher</button>
            </div>
          )}
          <button onClick={handleLogout} className="text-slate-400 hover:text-red-500"><LogOut size={20} /></button>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto p-6 md:p-8">
        {view === 'student' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="space-y-6">
              <section className="bg-white p-6 rounded-3xl shadow-sm border">
                <div className="flex justify-between mb-4"><h3 className="text-xs font-bold text-slate-400 uppercase">Materials Progress</h3><span className="font-black text-indigo-600">{materialCompletion}%</span></div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden"><div className="bg-indigo-600 h-full transition-all" style={{width: `${materialCompletion}%`}}></div></div>
              </section>
              <h3 className="font-black text-lg">Materials</h3>
              <div className="space-y-2">
                {curriculum.map(mat => (
                  <button key={mat.id} onClick={() => setSelectedMaterialId(mat.id)} className={`w-full p-4 rounded-2xl text-left border-2 transition-all ${selectedMaterialId === mat.id ? 'border-indigo-600 bg-white shadow-md' : 'border-transparent bg-white/50 hover:bg-white'}`}>
                    <div className="font-bold">{mat.name}</div>
                    <div className="text-xs text-slate-500">{mat.lessons?.length || 0} Lessons</div>
                  </button>
                ))}
              </div>
            </div>
            <div className="lg:col-span-2 space-y-6">
              <h2 className="text-2xl font-black">{currentMaterial?.name || 'Loading...'}</h2>
              <div className="grid gap-4">
                {currentMaterial?.lessons?.map((lesson, i) => {
                  const rec = allStudentsProgress.find(p => p.lesson_id === lesson.id && p.student_id === user.uid);
                  return (
                    <div key={lesson.id} className="bg-white p-5 rounded-2xl border flex items-center justify-between shadow-sm hover:shadow-md transition-all">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${rec?.verified ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>{rec?.verified ? <Check size={18}/> : i+1}</div>
                        <div>
                          <h4 className="font-bold">{lesson.title}</h4>
                          {rec && <p className="text-xs font-bold text-indigo-600">Last Score: {Math.round((rec.score/rec.total)*100)}%</p>}
                        </div>
                      </div>
                      <button onClick={() => { setActiveLesson(lesson); setQuizState({currentQuestion: 0, score: 0, showFeedback: false, selectedOption: null, completed: false, responses: []}); }} className="px-6 py-2 bg-indigo-50 text-indigo-600 rounded-xl font-bold hover:bg-indigo-600 hover:text-white transition-all">Start</button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between"><h2 className="text-2xl font-black">Teacher Dashboard</h2><div className="relative"><Search className="absolute left-3 top-3 text-slate-400" size={18}/><input type="text" placeholder="Search students..." className="pl-10 pr-4 py-2 border rounded-xl" onChange={e => setTeacherSearchTerm(e.target.value)} /></div></div>
            <div className="bg-white rounded-3xl border overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-xs font-bold text-slate-400 uppercase"><tr><th className="p-4">Student</th><th className="p-4">Lesson</th><th className="p-4">Score</th><th className="p-4">Action</th></tr></thead>
                <tbody className="divide-y">
                  {allStudentsProgress.filter(p => p.student_name?.toLowerCase().includes(teacherSearchTerm.toLowerCase())).map(p => (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="p-4 font-bold">{p.student_name}</td>
                      <td className="p-4 text-sm">{p.lesson_id}</td>
                      <td className="p-4 font-black text-indigo-600">{Math.round((p.score/p.total)*100)}%</td>
                      <td className="p-4">{p.verified ? <span className="text-emerald-600 text-xs font-bold flex items-center gap-1"><CheckCircle size={14}/> Verified</span> : <button onClick={async () => { await supabase.from('progress').update({verified: true}).eq('id', p.id); setAllStudentsProgress(prev => prev.map(x => x.id === p.id ? {...x, verified: true} : x)); }} className="text-indigo-600 text-xs font-bold hover:underline">Verify Progress</button>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Quiz Engine */}
      {activeLesson && (
        <div className="fixed inset-0 z-[100] bg-white flex flex-col">
          <div className="h-1 w-full bg-slate-100"><div className="h-full bg-indigo-600 transition-all" style={{width: `${((quizState.currentQuestion + 1) / activeLesson.questions.length) * 100}%`}}></div></div>
          <div className="p-4 border-b flex justify-between items-center"><h3 className="font-black">{activeLesson.title}</h3><button onClick={() => setActiveLesson(null)} className="p-2 hover:bg-slate-100 rounded-full"><X/></button></div>
          <div className="flex-1 flex flex-col items-center justify-center p-6">
            {!quizState.completed ? (
              <div className="w-full max-w-xl space-y-8">
                <div className="text-center"><span className="text-indigo-600 text-xs font-bold uppercase tracking-widest">Question {quizState.currentQuestion + 1}</span><h2 className="text-2xl font-black mt-2">{activeLesson.questions[quizState.currentQuestion]?.text}</h2></div>
                <div className="grid gap-3">
                  {['a', 'b', 'c', 'd'].map(key => {
                    const txt = activeLesson.questions[quizState.currentQuestion]?.[`option_${key}`];
                    if (!txt) return null;
                    const isCorrect = key === activeLesson.questions[quizState.currentQuestion].answer;
                    const isSel = quizState.selectedOption === key;
                    return (
                      <button key={key} disabled={quizState.showFeedback} onClick={() => setQuizState(p => ({...p, selectedOption: key}))} className={`p-5 rounded-2xl text-left font-bold border-2 transition-all ${quizState.showFeedback ? (isCorrect ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : (isSel ? 'border-rose-500 bg-rose-50 text-rose-700' : 'opacity-40')) : (isSel ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'hover:border-slate-300')}`}>{txt}</button>
                    );
                  })}
                </div>
                <button onClick={() => {
                  if (!quizState.showFeedback) {
                    const correct = quizState.selectedOption === activeLesson.questions[quizState.currentQuestion].answer;
                    setQuizState(p => ({...p, showFeedback: true, score: correct ? p.score + 1 : p.score}));
                  } else {
                    if (quizState.currentQuestion + 1 < activeLesson.questions.length) setQuizState(p => ({...p, currentQuestion: p.currentQuestion + 1, selectedOption: null, showFeedback: false}));
                    else setQuizState(p => ({...p, completed: true}));
                  }
                }} disabled={!quizState.selectedOption} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-lg disabled:opacity-50">{quizState.showFeedback ? "Next Question" : "Check Answer"}</button>
              </div>
            ) : (
              <div className="text-center space-y-6">
                <Award size={64} className="mx-auto text-indigo-600" />
                <h2 className="text-4xl font-black">All Done!</h2>
                <div className="p-8 bg-slate-50 rounded-3xl border">
                  <p className="text-5xl font-black text-indigo-600">{Math.round((quizState.score / activeLesson.questions.length) * 100)}%</p>
                  <p className={`mt-2 font-bold ${getFeedback((quizState.score/activeLesson.questions.length)*100).color}`}>{getFeedback((quizState.score/activeLesson.questions.length)*100).note}</p>
                </div>
                <button onClick={async () => {
                  const score = quizState.score; const total = activeLesson.questions.length;
                  const rid = `${user.uid}_${selectedMaterialId}_${activeLesson.id}`;
                  const data = { id: rid, student_id: user.uid, student_name: user.displayName, material_id: selectedMaterialId, lesson_id: activeLesson.id, score, total, verified: false, updated_at: new Date().toISOString() };
                  setAllStudentsProgress(p => [...p.filter(x => x.id !== rid), data]);
                  if (HAS_SUPABASE) await supabase.from('progress').upsert(data);
                  setActiveLesson(null);
                }} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black">Return to Materials</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
