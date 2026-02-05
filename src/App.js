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
  classes: { primaryButton: 'bg-indigo-600 text-white hover:bg-indigo-700', primaryText: 'text-indigo-600' }
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

  const [quizState, setQuizState] = useState({ currentQuestion: 0, score: 0, showFeedback: false, selectedOption: null, completed: false, responses: [] });

  // --- Data Loading ---
  const fetchCurriculum = async () => {
    try {
      if (!HAS_SUPABASE) return;
      const { data, error } = await supabase.from('materials').select('*, lessons(*, questions(*))').order('order_index');
      if (error) throw error;
      setCurriculum(data || []);
      if (data?.length > 0) setSelectedMaterialId(data[0].id);
    } catch (error) { console.error("Curriculum error:", error); }
  };

  const fetchRemoteForUser = async (targetUser) => {
    if (!targetUser || !HAS_SUPABASE) return;
    try {
      const { data: progress } = await supabase.from('progress').select('*').eq('student_id', targetUser.uid);
      if (progress) setAllStudentsProgress(progress);
      const { data: reminders } = await supabase.from('reminders').select('*').eq('student_id', targetUser.uid);
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

  // --- Memoized UI Data ---
  const currentMaterial = useMemo(() => curriculum.find(m => m.id === selectedMaterialId) || curriculum[0], [curriculum, selectedMaterialId]);
  
  const studentReminders = useMemo(() => user ? allReminders.filter(r => r.student_id === user.uid) : [], [allReminders, user]);

  const materialCompletion = useMemo(() => {
    if (!currentMaterial || !user) return 0;
    const total = currentMaterial.lessons?.length || 0;
    if (total === 0) return 0;
    const completed = new Set(allStudentsProgress.filter(p => p.material_id === currentMaterial.id && p.student_id === user.uid && p.verified).map(p => p.lesson_id)).size;
    return Math.round((completed / total) * 100);
  }, [currentMaterial, allStudentsProgress, user]);

  // --- Handlers ---
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

  const handleStartQuiz = (lesson) => {
    setActiveLesson(lesson);
    setQuizState({ currentQuestion: 0, score: 0, showFeedback: false, selectedOption: null, completed: false, responses: [] });
  };

  // --- Loading Guard ---
  if (isLoading && isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <RefreshCw className="animate-spin text-indigo-600 mb-4" size={48} />
        <p className="text-slate-500 font-medium">Loading your materials...</p>
      </div>
    );
  }

  // --- Login Screen ---
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
        <div className="md:w-1/2 p-12 text-white flex flex-col justify-center bg-indigo-600">
           <div className="flex items-center gap-2 text-2xl font-bold mb-4"><GraduationCap size={40} /><span>iSpeaktu Quiz</span></div>
           <h1 className="text-5xl font-extrabold">Empower Your Fluency.</h1>
        </div>
        <div className="flex-1 flex items-center justify-center p-6">
          <form onSubmit={handleLogin} className="w-full max-w-md space-y-4">
            <input type="text" value={userName} onChange={(e) => setUserName(e.target.value)} placeholder="Your Name" className="w-full px-4 py-3 border rounded-xl" required />
            <button type="submit" className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold">Start Learning</button>
          </form>
        </div>
      </div>
    );
  }

  // --- Main Dashboard ---
  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b px-6 h-16 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2 font-black text-indigo-600"><GraduationCap size={28} /><span>iSpeaktu Quiz</span></div>
        <button onClick={handleLogout} className="text-slate-400 hover:text-red-600"><LogOut size={20} /></button>
      </nav>

      <main className="max-w-6xl mx-auto p-6 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Stats & Materials */}
          <div className="space-y-6">
            <section className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
              <h3 className="font-bold text-slate-400 text-xs uppercase tracking-widest mb-4">Current Progress</h3>
              <div className="flex items-end justify-between mb-2">
                <span className="text-4xl font-black text-indigo-600">{materialCompletion}%</span>
              </div>
              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                <div className="bg-indigo-600 h-full transition-all duration-1000" style={{ width: `${materialCompletion}%` }}></div>
              </div>
            </section>

            <h3 className="font-black text-slate-800 text-lg">Materials</h3>
            <div className="grid gap-3">
              {curriculum.map(mat => (
                <button key={mat.id} onClick={() => setSelectedMaterialId(mat.id)} className={`p-4 rounded-2xl text-left transition-all border-2 ${selectedMaterialId === mat.id ? 'border-indigo-600 bg-white shadow-md' : 'border-transparent bg-white/50 hover:bg-white'}`}>
                  <div className="font-bold">{mat.name}</div>
                  <div className="text-xs text-slate-500">{mat.lessons?.length || 0} Lessons</div>
                </button>
              ))}
            </div>
          </div>

          {/* Right Column: Lessons List */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
               <h2 className="text-2xl font-black text-slate-800">{currentMaterial?.name || 'Lessons'}</h2>
            </div>
            
            <div className="grid gap-4">
              {currentMaterial?.lessons?.map((lesson, idx) => {
                const isCompleted = allStudentsProgress.some(p => p.lesson_id === lesson.id && p.student_id === user.uid && p.verified);
                return (
                  <div key={lesson.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between hover:shadow-md transition-all">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${isCompleted ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                        {isCompleted ? <Check size={20} /> : idx + 1}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800">{lesson.title}</h4>
                        <p className="text-xs text-slate-500">{lesson.questions?.length || 0} Questions</p>
                      </div>
                    </div>
                    <button onClick={() => handleStartQuiz(lesson)} className="px-5 py-2 rounded-xl bg-indigo-50 text-indigo-600 font-bold text-sm hover:bg-indigo-600 hover:text-white transition-all">
                      {isCompleted ? 'Retake' : 'Start'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>

      {/* Basic Quiz Modal (Simplified for logic testing) */}
      {activeLesson && (
        <div className="fixed inset-0 z-[100] bg-white flex flex-col p-6">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-xl font-black">{activeLesson.title}</h2>
            <button onClick={() => setActiveLesson(null)}><X /></button>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto w-full text-center">
             <p className="text-slate-400 font-bold mb-2">Question {quizState.currentQuestion + 1}</p>
             <h3 className="text-2xl font-bold mb-8">{activeLesson.questions[quizState.currentQuestion]?.text}</h3>
             <p className="text-indigo-600 font-medium italic">Quiz functionality is ready. Complete the session to save progress.</p>
             <button onClick={() => setActiveLesson(null)} className="mt-8 px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold">Back to Dashboard</button>
          </div>
        </div>
      )}
    </div>
  );
}
