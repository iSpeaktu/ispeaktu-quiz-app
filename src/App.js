import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  CheckCircle, 
  ChevronRight, 
  Award, 
  GraduationCap, 
  MessageSquare, 
  ArrowRight, 
  Sparkles, 
  Globe, 
  BarChart3, 
  Lock, 
  X, 
  LogOut, 
  Info, 
  RefreshCw, 
  AlertCircle,
  AlertTriangle,
  TrendingUp, 
  BrainCircuit, 
  BellRing, 
  Send, 
  UserCheck, 
  Clock, 
  Search, 
  Eye, 
  FileText,
  BellOff,
  Target,
  Check
} from 'lucide-react';

import { supabase, HAS_SUPABASE } from './supabaseClient';

const THEME = {
  colors: {
    primary: '#4F46E5',
    conversational: '#2563EB',
    verified: '#059669',
    business: '#2563EB',
    danger: '#E11D48',
    warning: '#D97706',
    neutral: '#F8FAFC',
    black: '#000000',
    white: '#FFFFFF'
  },
  tailwind: {
    primary: 'indigo-600',
    conversational: 'blue-600',
    verified: 'emerald-700',
    business: 'blue-600',
    danger: 'rose-600',
    warning: 'amber-600',
    neutral: 'slate-50'
  },
  classes: {
    primaryButton: 'bg-indigo-600 text-white hover:bg-indigo-700',
    verifiedButton: 'bg-emerald-700 text-white hover:bg-emerald-800',
    dangerButton: 'bg-rose-600 text-white hover:bg-rose-700',
    primaryText: 'text-indigo-600',
    verifiedText: 'text-emerald-700',
    dangerText: 'text-rose-600',
    warningText: 'text-amber-600'
  }
};

const STORAGE_KEYS = {
  PROGRESS: 'ispeaktu_v1_progress',
  REMINDERS: 'ispeaktu_v1_reminders',
  AUTH: 'ispeaktu_v1_auth',
  CURRICULUM: 'ispeaktu_v1_curriculum'
};

const TEACHER_ACCESS_CODE = "teacher";

export default function App() {
  const [view, setView] = useState('student'); 
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem(STORAGE_KEYS.AUTH) !== null;
  });
  
  const [isTeacherAuthorized, setIsTeacherAuthorized] = useState(false);
  const [allStudentsProgress, setAllStudentsProgress] = useState([]);
  const [allReminders, setAllReminders] = useState([]);
  const [curriculum, setCurriculum] = useState([]);
  const [selectedMaterialId, setSelectedMaterialId] = useState('');
  const [activeLesson, setActiveLesson] = useState(null);
  const [teacherSearchTerm, setTeacherSearchTerm] = useState('');
  const [userName, setUserName] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [loginError, setLoginError] = useState('');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [user, setUser] = useState(null);

  const [quizState, setQuizState] = useState({
    currentQuestion: 0, 
    score: 0, 
    showFeedback: false, 
    selectedOption: null, 
    completed: false, 
    responses: [] 
  });

  const fetchCurriculum = async () => {
    try {
      if (!HAS_SUPABASE) return;
      const { data, error } = await supabase
        .from('materials')
        .select('*, lessons(*, questions(*))')
        .order('order_index')
        .order('order_index', { foreignTable: 'lessons' });

      if (error) throw error;
      setCurriculum(data || []);
      if (data?.length > 0 && !selectedMaterialId) setSelectedMaterialId(data[0].id);
    } catch (error) {
      console.error("Curriculum load error:", error);
    }
  };

  const fetchRemoteForUser = async (targetUser) => {
    if (!targetUser || !HAS_SUPABASE) return;
    try {
      const { data: progress } = await supabase.from('progress').select('*').eq('student_id', targetUser.uid);
      if (progress) setAllStudentsProgress(progress);
      
      const { data: reminders } = await supabase.from('reminders').select('*').eq('student_id', targetUser.uid);
      if (reminders) setAllReminders(reminders);
    } catch (err) {
      console.warn('Sync error', err);
    }
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

  const handleLogin = (e) => {
    e.preventDefault();
    const cleanName = userName.trim().toLowerCase().replace(/\s+/g, '_');
    const isTeacher = view === 'teacher' && accessCode === TEACHER_ACCESS_CODE;
    
    if (view === 'teacher' && accessCode !== TEACHER_ACCESS_CODE) {
      setLoginError('Invalid Code');
      return;
    }

    const newUser = { uid: `user_${cleanName}`, displayName: userName, isTeacher };
    setUser(newUser);
    setIsAuthenticated(true);
    localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(newUser));
    fetchRemoteForUser(newUser);
  };

  const handleLogout = () => {
    localStorage.removeItem(STORAGE_KEYS.AUTH);
    setUser(null);
    setIsAuthenticated(false);
    window.location.reload();
  };

  // --- LOADING GUARD ---
  if (isLoading && isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <RefreshCw className="animate-spin text-indigo-600 mb-4" size={48} />
        <p className="text-slate-500 font-medium">Resuming your session...</p>
      </div>
    );
  }

  // --- LOGIN SCREEN ---
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans">
        <div className="hidden md:flex md:w-1/2 p-12 text-white flex-col justify-between relative overflow-hidden" style={{backgroundColor: THEME.colors.primary}}>
          <div className="relative z-10">
            <div className="flex items-center gap-2 text-2xl font-bold mb-12"><GraduationCap size={40} /><span>iSpeaktu Quiz</span></div>
            <h1 className="text-5xl font-extrabold mb-6 leading-tight">Empower Your <span className="text-white/60">Fluency.</span></h1>
            <p className="text-lg opacity-90 max-w-md">Master English with verified progress tracking and real-time quizzes.</p>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center p-6">
          <form onSubmit={handleLogin} className="w-full max-w-md space-y-6">
            <h2 className="text-3xl font-bold text-slate-800">Welcome</h2>
            <input type="text" value={userName} onChange={(e) => setUserName(e.target.value)} placeholder="Your Name" className="w-full px-4 py-3 rounded-xl border outline-none focus:ring-2 focus:ring-indigo-500" required />
            <div className="grid grid-cols-2 gap-4">
              <button type="button" onClick={() => setView('student')} className={`p-3 rounded-xl border-2 font-bold ${view === 'student' ? 'border-indigo-600 text-indigo-600 bg-indigo-50' : 'border-slate-200 text-slate-400'}`}>Student</button>
              <button type="button" onClick={() => setView('teacher')} className={`p-3 rounded-xl border-2 font-bold ${view === 'teacher' ? 'border-indigo-600 text-indigo-600 bg-indigo-50' : 'border-slate-200 text-slate-400'}`}>Teacher</button>
            </div>
            {view === 'teacher' && <input type="password" value={accessCode} onChange={(e) => setAccessCode(e.target.value)} placeholder="Teacher Access Code" className="w-full px-4 py-3 rounded-xl border outline-none focus:ring-2 focus:ring-indigo-500" required />}
            {loginError && <p className="text-red-500 text-sm">{loginError}</p>}
            <button type="submit" className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-indigo-700 transition-all">Start Learning</button>
          </form>
        </div>
      </div>
    );
  }

  // --- MAIN APP UI ---
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <nav className="bg-white border-b border-slate-100 sticky top-0 z-10 px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2 font-black text-lg text-indigo-600"><GraduationCap size={28} /><span>iSpeaktu Quiz</span></div>
        <div className="flex items-center gap-4">
          <span className="text-sm font-bold text-slate-600 hidden sm:inline">Hello, {userName}</span>
          <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-red-600 transition-colors"><LogOut size={20} /></button>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto p-6">
         <h2 className="text-2xl font-bold mb-6">Your Materials</h2>
         <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {curriculum.map(mat => (
              <div key={mat.id} onClick={() => setSelectedMaterialId(mat.id)} className={`p-6 rounded-2xl cursor-pointer border-2 transition-all ${selectedMaterialId === mat.id ? 'border-indigo-600 bg-white shadow-md' : 'border-transparent bg-white/50 hover:bg-white'}`}>
                <h3 className="font-bold text-lg">{mat.name}</h3>
                <p className="text-sm text-slate-500 mt-1">{mat.lessons?.length || 0} Lessons</p>
              </div>
            ))}
         </div>
         {/* ... Rest of your dashboard components go here ... */}
         <div className="mt-12 p-12 text-center text-slate-400 border-2 border-dashed rounded-3xl">
            Select a Material above to begin your lessons.
         </div>
      </main>
    </div>
  );
}
