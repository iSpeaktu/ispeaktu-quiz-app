import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, CheckCircle, ChevronRight, Award, GraduationCap, MessageSquare, 
  ArrowRight, Sparkles, Globe, BarChart3, Lock, X, LogOut, Info, 
  RefreshCw, AlertCircle, AlertTriangle, TrendingUp, BrainCircuit, 
  BellRing, Send, UserCheck, Clock, Search, Eye, FileText, BellOff, Target, Check 
} from 'lucide-react';

import { supabase, HAS_SUPABASE } from './supabaseClient';

// --- Centralized Theme & Constants ---
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
    currentQuestion: 0, 
    score: 0, 
    showFeedback: false, 
    selectedOption: null, 
    completed: false, 
    responses: [] 
  });

  // --- Data Loading ---
  const fetchCurriculum = async () => {
    try {
      if (!HAS_SUPABASE) return;
      const { data, error } = await supabase
        .from('materials')
        .select('*, lessons(*, questions(*))')
        .order('order_index');
      if (error) throw error;
      
      const sorted = (data || []).map(m => ({
        ...m,
        lessons: (m.lessons || []).sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
      }));

      setCurriculum(sorted);
      if (sorted.length > 0 && !selectedMaterialId) setSelectedMaterialId(sorted[0].id);
    } catch (error) { console.error("Curriculum error:", error); }
  };

  const fetchRemoteForUser = async (targetUser) => {
    if (!targetUser || !HAS_SUPABASE) return;
    try {
      const { data: progress } = await supabase.from('progress').select('*');
      if (progress) setAllStudentsProgress(progress);
      
      const { data: reminders } = await supabase.from('reminders').select('*');
      if (reminders) setAllReminders(reminders);
    } catch (err) { console.warn('Sync error', err); }
  };

  useEffect(() => {
    const initApp = async () => {
      const savedAuth = localStorage.getItem(STORAGE_KEYS.AUTH);
      if (savedAuth) {
        const parsed = JSON.parse(savedAuth);
        setUser(parsed);
        setUserName(parsed.displayName || '');
        setIsAuthenticated(true);
        if (parsed.isTeacher) setIsTeacherAuthorized(true);
        await fetchRemoteForUser(parsed);
      }
      await fetchCurriculum();
      setIsLoading(false);
    };
    initApp();
  }, []);

  // --- Logic & Helpers ---
  const currentMaterial = useMemo(() => curriculum.find(m => m.id === selectedMaterialId) || curriculum[0], [curriculum, selectedMaterialId]);
  
  const materialCompletion = useMemo(() => {
    if (!currentMaterial || !user) return 0;
    const total = currentMaterial.lessons?.length || 0;
    if (total === 0) return 0;
    const completed = new Set(allStudentsProgress.filter(p => p.material_id === currentMaterial.id && p.student_id === user.uid && p.verified).map(p => p.lesson_id)).size;
    return Math.round((completed / total) * 100);
  }, [currentMaterial, allStudentsProgress, user]);

  const getTieredFeedback = (percentage) => {
    if (percentage <= 30) return { tier: "Beginner", color: THEME.classes.dangerText, note: "Let's focus on the basics." };
    if (percentage <= 70) return { tier: "Intermediate", color: THEME.classes.warningText, note: "Good progress! Keep practicing." };
    return { tier: "Advanced", color: THEME.classes.verifiedText, note: "Excellent work! You've mastered this." };
  };

  const handleLogin = (e) => {
    e.preventDefault();
    const cleanName = userName.trim().toLowerCase().replace(/\s+/g, '_');
    const isTeacher = view === 'teacher' && accessCode === TEACHER_ACCESS_CODE;
    if (view === 'teacher' && accessCode !== TEACHER_ACCESS_CODE) { setLoginError('Invalid Code'); return; }
    const newUser = { uid: `user_${cleanName}`, displayName: userName, isTeacher };
    setUser(newUser); setIsAuthenticated(true);
    localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(newUser));
    fetchRemoteForUser(newUser);
  };

  const handleLogout = () => {
    localStorage.removeItem(STORAGE_KEYS.AUTH);
    window.location.reload();
  };

  const handleSaveProgress = async () => {
    if (!user || !activeLesson) return;
    const progressId = `${user.uid}_${selectedMaterialId}_${activeLesson.id}`;
    const newRecord = {
      id: progressId, student_id: user.uid, student_name: user.displayName,
      material_id: selectedMaterialId, lesson_id: activeLesson.id,
      score: quizState.score, total: activeLesson.questions.length,
      verified: false, updated_at: new Date().toISOString()
    };

    setAllStudentsProgress(prev => [...prev.filter(p => p.id !== progressId), newRecord]);
    if (HAS_SUPABASE) await supabase.from('progress').upsert(newRecord);
    setActiveLesson(null);
  };

  // --- Rendering Helpers ---
  if (isLoading && isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <RefreshCw className="animate-spin text-indigo-600 mb-4" size={48} />
        <p className="text-slate-500 font-medium">Resuming your session...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
        <div className="md:w-1/2 p-12 text-white flex flex-col justify-center bg-indigo-600 relative overflow-hidden">
           <div className="relative z-10">
             <div className="flex items-center gap-2 text-2xl font-bold mb-8"><GraduationCap size={40} /><span>iSpeaktu Quiz</span></div>
             <h1 className="text-5xl font-extrabold mb-4">Empower Your Fluency.</h1>
             <p className="opacity-80">Master English with verified progress tracking.</p>
           </div>
        </div>
        <div className="flex-1 flex items-center justify-center p-6">
          <form onSubmit={handleLogin} className="w-full max-w-md space-y-4">
            <h2 className="text-3xl font-bold">Welcome</h2>
            <input type="text" value={userName} onChange={(e) => setUserName(e.target.value)} placeholder="Display Name" className="w-full px-4 py-3 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" required />
            <div className="grid grid-cols-2 gap-4">
              <button type="button" onClick={() => setView('student')} className={`p-3 rounded-xl border-2 font-bold ${view === 'student' ? 'border-indigo-600 text-indigo-600' : 'text-slate-400'}`}>Student</button>
              <button type="button" onClick={() => setView('teacher')} className={`p-3 rounded-xl border-2 font-bold ${view === 'teacher' ? 'border-indigo-600 text-indigo-600' : 'text-slate-400'}`}>Teacher</button>
            </div>
            {view === 'teacher' && <input type="password" value={accessCode} onChange={(e) => setAccessCode(e.target.value)} placeholder="Teacher Code" className="w-full px-4 py-3 border rounded-xl" required />}
            <button type="submit" className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold hover:bg-indigo-700">Start Learning</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navbar */}
      <nav className="bg-white border-b px-6 h-16 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2 font-black text-indigo-600"><GraduationCap size={28} /><span>iSpeaktu Quiz</span></div>
        <div className="flex items-center gap-4">
          <div className="bg-slate-100 p-1 rounded-lg hidden sm:flex">
            <button onClick={() => setView('student')} className={`px-4 py-1 text-sm font-bold rounded-md ${view === 'student' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}>Student</button>
            <button onClick={() => isTeacherAuthorized ? setView('teacher') : setView('student')} className={`px-4 py-1 text-sm font-bold rounded-md ${view === 'teacher' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}>Teacher</button>
          </div>
          <button onClick={handleLogout} className="text-slate-400 hover:text-red-600"><LogOut size={20} /></button>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto p-6">
        {view === 'student' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Sidebar */}
            <div className="space-y-6">
              <section className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                <div className="flex justify-between items-center mb-4">
                   <h3 className="font-bold text-slate-400 text-xs uppercase tracking-widest">Progress</h3>
                   <span className="text-indigo-600 font-black">{materialCompletion}%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-indigo-600 h-full transition-all" style={{ width: `${materialCompletion}%` }}></div>
                </div>
              </section>

              <h3 className="font-black text-slate-800">Materials</h3>
              <div className="space-y-2">
                {curriculum.map(mat => (
                  <button key={mat.id} onClick={() => setSelectedMaterialId(mat.id)} className={`w-full p-4 rounded-2xl text-left border-2 transition-all ${selectedMaterialId === mat.id ? 'border-indigo-600 bg-white shadow-md' : 'border-transparent bg-white/50 hover:bg-white'}`}>
                    <div className="font-bold">{mat.name}</div>
                    <div className="text-xs text-slate-500">{mat.lessons?.length || 0} Lessons</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Lessons */}
            <div className="lg:col-span-2 space-y-6">
              <h2 className="text-2xl font-black">{currentMaterial?.name}</h2>
              <div className="grid gap-3">
                {currentMaterial?.lessons?.map((lesson, i) => {
                  const record = allStudentsProgress.find(p => p.lesson_id === lesson.id && p.student_id === user.uid);
                  const isVerified = record?.verified;
                  return (
                    <div key={lesson.id} className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${isVerified ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100'}`}>{isVerified ? <Check size={18}/> : i+1}</div>
                        <div>
                          <h4 className="font-bold">{lesson.title}</h4>
                          {record && <p className="text-xs font-bold text-indigo-600">{Math.round((record.score/record.total)*100)}% Score</p>}
                        </div>
                      </div>
                      <button onClick={() => { setActiveLesson(lesson); setQuizState({currentQuestion: 0, score: 0, showFeedback: false, selectedOption: null, completed: false, responses: []}); }} className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl font-bold hover:bg-indigo-600 hover:text-white transition-all">Start</button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          /* Teacher View Restoration */
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black">Teacher Dashboard</h2>
              <div className="relative w-64">
                <Search className="absolute left-3 top-3 text-slate-400" size={18} />
                <input type="text" placeholder="Search students..." className="w-full pl-10 pr-4 py-2 bg-white border rounded-xl outline-none" onChange={(e) => setTeacherSearchTerm(e.target.value)} />
              </div>
            </div>
            <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold">
                  <tr>
                    <th className="px-6 py-4">Student</th>
                    <th className="px-6 py-4">Lesson</th>
                    <th className="px-6 py-4">Score</th>
                    <th className="px-6 py-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {allStudentsProgress.filter(p => p.student_name?.toLowerCase().includes(teacherSearchTerm.toLowerCase())).map(p => (
                    <tr key={p.id} className="hover:bg-slate-50 transition-all">
                      <td className="px-6 py-4 font-bold">{p.student_name}</td>
                      <td className="px-6 py-4 text-sm">{p.lesson_id}</td>
                      <td className="px-6 py-4 font-black text-indigo-600">{Math.round((p.score/p.total)*100)}%</td>
                      <td className="px-6 py-4">
                        {p.verified ? <span className="text-emerald-600 flex items-center gap-1 font-bold text-xs"><CheckCircle size={14}/> Verified</span> : <button onClick={async () => {
                          const { error } = await supabase.from('progress').update({ verified: true }).eq('id', p.id);
                          if (!error) setAllStudentsProgress(prev => prev.map(item => item.id === p.id ? {...item, verified: true} : item));
                        }} className="text-indigo-600 text-xs font-bold hover:underline">Verify Now</button>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Full Quiz Modal */}
      {activeLesson && (
        <div className="fixed inset-0 z-[100] bg-white flex flex-col">
          <div className="h-2 w-full bg-slate-100">
            <div className="h-full bg-indigo-600 transition-all" style={{width: `${((quizState.currentQuestion + 1) / activeLesson.questions.length) * 100}%`}}></div>
          </div>
          <div className="p-6 flex justify-between items-center border-b">
             <h3 className="font-black text-slate-800">{activeLesson.title}</h3>
             <button onClick={() => setActiveLesson(null)} className="p-2 hover:bg-slate-100 rounded-full"><X/></button>
          </div>
          <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center justify-center">
            {!quizState.completed ? (
              <div className="max-w-2xl w-full space-y-8">
                <div className="text-center space-y-2">
                  <span className="text-indigo-600 font-bold tracking-widest text-xs uppercase">Question {quizState.currentQuestion + 1} of {activeLesson.questions.length}</span>
                  <h2 className="text-3xl font-black text-slate-800">{activeLesson.questions[quizState.currentQuestion]?.text}</h2>
                </div>
                <div className="grid gap-3">
                  {['a', 'b', 'c', 'd'].map(opt => {
                    const text = activeLesson.questions[quizState.currentQuestion]?.[`option_${opt}`];
                    if (!text) return null;
                    const isSelected = quizState.selectedOption === opt;
                    const isCorrect = opt === activeLesson.questions[quizState.currentQuestion]?.answer;
                    return (
                      <button key={opt} disabled={quizState.showFeedback} onClick={() => setQuizState(prev => ({...prev, selectedOption: opt}))} className={`p-5 rounded-2xl text-left font-bold border-2 transition-all ${quizState.showFeedback ? (isCorrect ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : (isSelected ? 'border-rose-500 bg-rose-50 text-rose-700' : 'border-slate-100 opacity-50')) : (isSelected ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-100 hover:border-slate-300')}`}>
                        {text}
                      </button>
                    );
                  })}
                </div>
                {!quizState.showFeedback ? (
                  <button onClick={() => {
                    const isCorrect = quizState.selectedOption === activeLesson.questions[quizState.currentQuestion].answer;
                    setQuizState(prev => ({...prev, showFeedback: true, score: isCorrect ? prev.score + 1 : prev.score}));
                  }} disabled={!quizState.selectedOption} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-lg shadow-indigo-200 disabled:opacity-50">Check Answer</button>
                ) : (
                  <button onClick={() => {
                    if (quizState.currentQuestion + 1 < activeLesson.questions.length) {
                      setQuizState(prev => ({...prev, currentQuestion: prev.currentQuestion + 1, selectedOption: null, showFeedback: false}));
                    } else {
                      setQuizState(prev => ({...prev, completed: true}));
                    }
                  }} className="w-full py-4 bg-slate-800 text-white rounded-2xl font-black">Next Question</button>
                )}
              </div>
            ) : (
              <div className="text-center space-y-6 max-w-sm">
                <div className="w-24 h-24 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Award size={48} />
                </div>
                <h2 className="text-4xl font-black">Quiz Complete!</h2>
                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                  <p className="text-slate-500 font-bold uppercase text-xs mb-1">Your Score</p>
                  <p className="text-5xl font-black text-indigo-600">{Math.round((quizState.score / activeLesson.questions.length) * 100)}%</p>
                  <p className={`mt-4 font-bold ${getTieredFeedback((quizState.score / activeLesson.questions.length) * 100).color}`}>
                    {getTieredFeedback((quizState.score / activeLesson.questions.length) * 100).note}
                  </p>
                </div>
                <button onClick={handleSaveProgress} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-xl">Back to Dashboard</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
