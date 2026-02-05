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
  Check // Added missing Check icon
} from 'lucide-react';

import { supabase, HAS_SUPABASE } from './supabaseClient';

// --- Centralized Theme Object ---
const THEME = {
  colors: {
    primary: '#4F46E5',          // Indigo 600 - Main brand color for buttons, nav
    conversational: '#2563EB',   // Blue 600 - Conversational English material (matched with Business)
    verified: '#059669',         // Emerald 700 - Verification checkmarks & Advanced tier
    business: '#2563EB',         // Blue 600 - Business English material
    danger: '#E11D48',           // Rose 600 - Beginner feedback & failure alerts
    warning: '#D97706',          // Amber 600 - Warning/intermediate states
    neutral: '#F8FAFC',          // Slate 50 - Light backgrounds
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

// --- Local Storage Keys ---
const STORAGE_KEYS = {
  PROGRESS: 'ispeaktu_v1_progress',
  REMINDERS: 'ispeaktu_v1_reminders',
  AUTH: 'ispeaktu_v1_auth',
  CURRICULUM: 'ispeaktu_v1_curriculum'
};

// --- Tiered Feedback System ---
const FEEDBACK_TIERS = {
  BEGINNER: {
    range: [0, 39],
    label: 'Beginner Level',
    color: 'text-rose-600',
    bg: 'bg-rose-50',
    border: 'border-rose-100',
    notes: [
      "keep practicing, every step counts!",
      "don't worry, you're building a strong foundation.",
      "this is just the beginning—keep going!",
      "each attempt brings you closer to mastery.",
      "mistakes are your best teachers right now."
    ]
  },
  ELEMENTARY: {
    range: [40, 54],
    label: 'Elementary Level',
    color: 'text-orange-600',
    bg: 'bg-orange-50',
    border: 'border-orange-100',
    notes: [
      "you're making progress—let's build on this!",
      "good effort, but there's more to learn.",
      "you're on the right path!",
      "keep pushing—improvement is coming!",
      "consistency will get you to the next level."
    ]
  },
  PRE_INTERMEDIATE: {
    range: [55, 69],
    label: 'Pre-Intermediate Level',
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-100',
    notes: [
      "nice work! You're getting stronger.",
      "you're almost there—just a bit more practice!",
      "solid effort, keep it up!",
      "you have good understanding, review the tricky parts.",
      "you're closer to advanced than you think!"
    ]
  },
  INTERMEDIATE: {
    range: [70, 84],
    label: 'Intermediate Level',
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-100',
    notes: [
      "excellent progress, you're doing great!",
      "impressive! You've mastered most concepts.",
      "strong work! You're building real skills.",
      "well done—keep this momentum going!",
      "you're becoming quite proficient!"
    ]
  },
  ADVANCED: {
    range: [85, 100],
    label: 'Advanced Level',
    color: 'text-purple-600',
    bg: 'bg-purple-50',
    border: 'border-purple-100',
    notes: [
      "outstanding! You've truly mastered this lesson.",
      "excellent work! You're a star learner.",
      "wow, you nailed it! Impressive performance.",
      "perfect execution—you're ready for the next challenge!",
      "exceptional! You understand this material deeply."
    ]
  }
};

// --- Default Curriculum Data ---
const DEFAULT_ISPEAKTU_DATA = [];

const TEACHER_ACCESS_CODE = "teacher";

// --- Badge System ---
// --- Helper Function: Check if lesson is a mastery review milestone ---
const isMasteryReviewMilestone = (lessonIndex) => {
  return (lessonIndex + 1) % 10 === 0;
};

// --- Helper Function: Generate mastery review questions ---
const generateMasteryReview = (allLessons, currentMilestoneIndex) => {
  const blockStart = Math.max(0, currentMilestoneIndex - 10);
  const previousLessons = allLessons.slice(blockStart, currentMilestoneIndex);
  
  const reviewQuestions = [];
  previousLessons.forEach(lesson => {
    if (lesson.questions && lesson.questions.length > 0) {
      for (let i = 0; i < Math.min(2, lesson.questions.length); i++) {
        const randomQuestion = lesson.questions[Math.floor(Math.random() * lesson.questions.length)];
        reviewQuestions.push({...randomQuestion, sourceLesson: lesson.title});
      }
    }
  });
  
  return {
    id: `mastery_review_${currentMilestoneIndex}`,
    title: `Mastery Review: Lessons ${blockStart + 1}-${currentMilestoneIndex}`,
    isMasteryReview: true,
    questions: reviewQuestions.slice(0, 20)
  };
};

// --- Helper Function: Get mastery review lock status ---
const getMasteryReviewLockStatus = (progressRecords, userId, currentLessonIndex) => {
  const userRecords = progressRecords.filter(p => p.student_id === userId);
  const currentBlock = Math.floor(currentLessonIndex / 10) * 10;
  
  if (currentBlock === 0) return { isLocked: false };
  
  const masteryReviewId = `mastery_review_${currentBlock}`;
  const masteryReview = userRecords.find(p => p.lesson_id === masteryReviewId);
  
  if (!masteryReview) return { isLocked: true, reason: 'Mastery Review Required' };
  if ((masteryReview.score / masteryReview.total) * 100 < 70) {
    return { isLocked: true, reason: 'Mastery Review Not Passed (Need 70%+)' };
  }
  
  return { isLocked: false };
};

// --- Helper Function: Calculate lesson failure rates ---
const getLessonFailureRates = (progressRecords, curriculum) => {
  const lessonStats = {};
  
  progressRecords.forEach(record => {
    if (!record.isMasteryReview) {
      if (!lessonStats[record.lesson_id]) {
        lessonStats[record.lesson_id] = { total: 0, failed: 0, name: '' };
      }
      lessonStats[record.lesson_id].total++;
      if ((record.score / record.total) * 100 < 70) {
        lessonStats[record.lesson_id].failed++;
      }
    }
  });
  
  // Find lesson names
  curriculum.forEach(material => {
    material.lessons?.forEach(lesson => {
      if (lessonStats[lesson.id]) {
        lessonStats[lesson.id].name = lesson.title;
        lessonStats[lesson.id].materialName = material.name;
      }
    });
  });
  
  return Object.entries(lessonStats)
    .map(([id, stats]) => ({
      id,
      name: stats.name,
      materialName: stats.materialName,
      failureRate: stats.total > 0 ? Math.round((stats.failed / stats.total) * 100) : 0,
      totalAttempts: stats.total,
      failedAttempts: stats.failed
    }))
    .sort((a, b) => b.failureRate - a.failureRate);
};

export default function App() {
  const [view, setView] = useState('student'); 
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => Boolean(localStorage.getItem(STORAGE_KEYS.AUTH))
  );
  const [isTeacherAuthorized, setIsTeacherAuthorized] = useState(false);
  const [allStudentsProgress, setAllStudentsProgress] = useState([]);
  const [allReminders, setAllReminders] = useState([]);
  const [curriculum, setCurriculum] = useState([]);
  const [selectedMaterialId, setSelectedMaterialId] = useState('');
  const [activeLesson, setActiveLesson] = useState(null);
  const [showAnalysis, setShowAnalysis] = useState(null);
  const [teacherSearchTerm, setTeacherSearchTerm] = useState('');
  const [reviewRecord, setReviewRecord] = useState(null);

  const [quizState, setQuizState] = useState({
    currentQuestion: 0, 
    score: 0, 
    showFeedback: false, 
    selectedOption: null, 
    completed: false, 
    responses: [] 
  });

  const [userName, setUserName] = useState('');
  const [email, setEmail] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [loginError, setLoginError] = useState('');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authReady, setAuthReady] = useState(
    () => !Boolean(localStorage.getItem(STORAGE_KEYS.AUTH))
  );
  const [studentProfile, setStudentProfile] = useState(null);
  const [user, setUser] = useState(null);

  // --- fetchCurriculum function moved inside component ---
  const fetchCurriculum = async () => {
    try {
      if (!HAS_SUPABASE) {
        setCurriculum([]);
        return;
      }
      // 1. Fetch Materials with nested Lessons and Questions
      const { data: materialsData, error: materialsError } = await supabase
        .from('materials')
        .select('*, lessons(*, questions(*))')
        .order('order_index')
        .order('order_index', { foreignTable: 'lessons' })
        .order('order_index', { foreignTable: 'questions' });

      if (materialsError) throw materialsError;

      // 2. Normalize and sort nested data
      const formattedCurriculum = (materialsData || []).map(material => ({
        ...material,
        name: material.name || 'Untitled Material',
        lessons: (material.lessons || [])
          .slice()
          .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
          .map(lesson => ({
            ...lesson,
            questions: (lesson.questions || [])
              .slice()
              .sort((a, b) => (a.order_index ?? a.id ?? 0) - (b.order_index ?? b.id ?? 0))
          }))
      }));

      setCurriculum(formattedCurriculum);
      
      // Set initial material if none is selected
      if (formattedCurriculum.length > 0 && !selectedMaterialId) {
        setSelectedMaterialId(formattedCurriculum[0].id);
      }
    } catch (error) {
      console.error("Error loading curriculum from Supabase:", error.message);
      // Fallback to empty data if DB fails
      setCurriculum([]);
    }
  };

  useEffect(() => {
    const loadData = async () => { // Changed to async
      try {
        // 1. Restore Auth
        const savedAuth = localStorage.getItem(STORAGE_KEYS.AUTH);
        if (savedAuth) {
          const parsedAuth = JSON.parse(savedAuth);
          setUser(parsedAuth);
          setUserName(parsedAuth.displayName || '');
          setIsAuthenticated(true);
          if (parsedAuth.isTeacher) setIsTeacherAuthorized(true);
          setAuthReady(true);
          await fetchRemoteForUser(parsedAuth);
        } else {
          setAuthReady(true);
        }
        // Clear any legacy cached curriculum data
        localStorage.removeItem(STORAGE_KEYS.CURRICULUM);

        // 2. TRIGGER SUPABASE FETCH
        // This is the line that was missing!
        await fetchCurriculum();

        // 3. Load other local items
        const savedProgress = localStorage.getItem(STORAGE_KEYS.PROGRESS);
        if (savedProgress) {
          const parsed = JSON.parse(savedProgress);
          setAllStudentsProgress(Array.isArray(parsed) ? parsed : []);
        }

        const savedReminders = localStorage.getItem(STORAGE_KEYS.REMINDERS);
        if (savedReminders) {
          const parsed = JSON.parse(savedReminders);
          setAllReminders(Array.isArray(parsed) ? parsed : []);
        }

      } catch (err) {
        console.error("Initialization error", err);
      } finally {
        setAuthReady(true);
      }
    };
    loadData();
  }, []);

  const currentMaterial = useMemo(() => {
    const material = curriculum.find(m => m.id === selectedMaterialId) || curriculum[0];
    return material ? {
      ...material,
      id: material.id || null,
      name: material.name || 'Untitled Material',
      description: material.description || 'No description available',
      lessons: material.lessons || [],
    } : null;
  }, [curriculum, selectedMaterialId]);
  
  const materialsList = useMemo(() => {
    if (!curriculum || curriculum.length === 0) return [];
    return curriculum.map(({id, name, color, description, lessons}) => ({
      id,
      name: name || 'Untitled Material',
      color: color || THEME.colors.primary,
      description: description || 'No description available',
      totalLessons: lessons?.length || 0,
      completedLessons: new Set(
        allStudentsProgress
          .filter(p => p.material_id === id && p.student_id === user?.uid && p.verified)
          .map(p => p.lesson_id)
      ).size
    }));
  }, [curriculum, allStudentsProgress, user]);

  const studentProgress = useMemo(() => 
    user ? allStudentsProgress.filter(p => p.student_id === user.uid) : [], 
    [allStudentsProgress, user]
  );

  const studentReminders = useMemo(() => 
    user ? allReminders.filter(r => r.student_id === user.uid) : [], 
    [allReminders, user]
  );

  const averageScore = useMemo(() => 
    studentProgress.length === 0 ? 0 : Math.round((studentProgress.reduce((acc, curr) => acc + (curr.score / curr.total), 0) / studentProgress.length) * 100), 
    [studentProgress]
  );

  const materialCompletion = useMemo(() => {
    if (!currentMaterial || !currentMaterial.id || !user) return 0;
    const total = currentMaterial.lessons?.length || 0;
    if (total === 0) return 0;
    const completedLessonIds = new Set(
      allStudentsProgress
        .filter(p => p.material_id === currentMaterial.id && p.student_id === user.uid && p.verified)
        .map(p => p.lesson_id)
    );
    const completed = completedLessonIds.size;
    return Math.round((completed / total) * 100);
  }, [currentMaterial, allStudentsProgress, user]);

  const { userRank, totalStudents, totalQuizzesTaken } = useMemo(() => {
    if (!user) return { userRank: 0, totalStudents: 0, totalQuizzesTaken: 0 };
    
    // Get unique students and their verified unique lesson counts
    const studentStats = {};
    allStudentsProgress.forEach(record => {
      if (record.verified) {
        if (!studentStats[record.student_id]) {
          studentStats[record.student_id] = new Set();
        }
        studentStats[record.student_id].add(record.lesson_id);
      }
    });
    
    const totalStudents = Object.keys(studentStats).length;
    const userVerifiedLessons = studentStats[user.uid] || new Set();
    const userVerifiedCount = userVerifiedLessons.size;
    
    // Count total quizzes taken by user (including retakes)
    const userTotalQuizzes = allStudentsProgress.filter(p => p.student_id === user.uid && p.verified).length;
    
    // Sort students by unique verified lesson count descending and find rank
    const ranks = Object.entries(studentStats)
      .sort((a, b) => b[1].size - a[1].size)
      .map(([studentId]) => studentId);
    
    const userRank = ranks.indexOf(user.uid) + 1 || totalStudents + 1;
    
    return { userRank, totalStudents, totalQuizzesTaken: userTotalQuizzes };
  }, [allStudentsProgress, user]);

  const getTieredFeedback = (percentage, name) => {
    const p = percentage;
    const safeName = typeof name === 'string' ? name : 'Student';
    if (p <= 30) return { tier: "Beginner", color: THEME.classes.dangerText, note: `${safeName}, let's focus on the basics.` };
    if (p <= 60) return { tier: "Intermediate", color: THEME.classes.warningText, note: `Good progress, ${safeName}.` };
    return { tier: "Advanced", color: THEME.classes.verifiedText, note: `Excellent work, ${safeName}!` };
  };

  // Define the fetcher inside component scope so it has access to state
  const fetchRemoteForUser = async (targetUser) => {
    if (!targetUser || !HAS_SUPABASE) return;
    try {
      // Fetch progress for this specific name-based ID
      const { data: progressData, error: progressErr } = await supabase
        .from('progress')
        .select('*')
        .eq('student_id', targetUser.uid);

      if (!progressErr && Array.isArray(progressData)) {
        setAllStudentsProgress(progressData);
        localStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify(progressData));
      }

      // Fetch reminders
      const { data: remindersData, error: remindersErr } = await supabase
        .from('reminders')
        .select('*')
        .eq('student_id', targetUser.uid);

      if (!remindersErr && Array.isArray(remindersData)) {
        setAllReminders(remindersData);
        localStorage.setItem(STORAGE_KEYS.REMINDERS, JSON.stringify(remindersData));
      }
    } catch (err) {
      console.warn('Supabase fetch error', err);
    }
  };

  // Define handleLogin inside component scope so it has access to state
  const handleLogin = (e) => {
    e.preventDefault();
    setLoginError('');
    if (!userName.trim()) return;

    const cleanName = userName.trim().toLowerCase().replace(/\s+/g, '_');
    const stableUid = `user_${cleanName}`;
    const isTeacher = view === 'teacher' && accessCode === TEACHER_ACCESS_CODE;
    
    if (view === 'teacher' && accessCode !== TEACHER_ACCESS_CODE) { 
      setLoginError('Incorrect teacher code.'); 
      return; 
    }

    const newUser = { 
      uid: stableUid, 
      displayName: userName.trim(), 
      isTeacher: isTeacher 
    };

    setUser(newUser); 
    setIsAuthenticated(true);
    if (isTeacher) setIsTeacherAuthorized(true);
    localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(newUser));

    // Now this works!
    fetchRemoteForUser(newUser); 
  };

  const handleLogout = () => {
    if (HAS_SUPABASE) supabase.auth.signOut().catch(() => {});
    localStorage.removeItem(STORAGE_KEYS.AUTH);
    setUser(null); setIsAuthenticated(false); setIsTeacherAuthorized(false); setUserName(''); setView('student'); setEmail('');
  };

  useEffect(() => {
    if (!HAS_SUPABASE) {
      setIsLoading(false);
      return;
    }
    let mounted = true;
    const init = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (mounted && session?.user) {
          const u = session.user;
          const profile = { uid: u.id, displayName: u.user_metadata?.displayName || u.email || '', isTeacher: u.user_metadata?.isTeacher || false };
          setUser(profile); setUserName(profile.displayName); setIsAuthenticated(true); if (profile.isTeacher) setIsTeacherAuthorized(true);
        }
        const { data } = supabase.auth.onAuthStateChange((_event, session) => {
          if (session?.user) {
            const u = session.user;
            const profile = { uid: u.id, displayName: u.user_metadata?.displayName || u.email || '', isTeacher: u.user_metadata?.isTeacher || false };
            setUser(profile); setUserName(profile.displayName); setIsAuthenticated(true); if (profile.isTeacher) setIsTeacherAuthorized(true);
            localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(profile));
          } else {
            setUser(null); setIsAuthenticated(false); setIsTeacherAuthorized(false); setUserName('');
            localStorage.removeItem(STORAGE_KEYS.AUTH);
          }
        });
        setIsLoading(false);
        return () => { mounted = false; data.subscription.unsubscribe(); };
      } catch (err) {
        console.warn('Supabase auth init error', err);
        setIsLoading(false);
      }
    };
    init();
  }, []);

  // 4. Keep an effect to load data automatically when the app starts
  useEffect(() => {
    if (user) {
      fetchRemoteForUser(user);
    }
  }, [user]);

  const handleSendReminder = async (studentId, lessonId, materialId) => {
    const newReminder = { id: `${studentId}_${lessonId}`, student_id: studentId, lesson_id: lessonId, material_id: materialId, sent_by: userName, sent_at: new Date().toISOString() };
    const updatedReminders = [...allReminders.filter(r => !(r.student_id === studentId && r.lesson_id === lessonId)), newReminder];
    setAllReminders(updatedReminders);
    localStorage.setItem(STORAGE_KEYS.REMINDERS, JSON.stringify(updatedReminders));
    if (HAS_SUPABASE) {
      try {
        const { error } = await supabase.from('reminders').upsert(newReminder, { onConflict: 'id' });
        if (error) console.warn('Supabase upsert reminder error', error);
      } catch (err) {
        console.warn('Supabase reminder error', err);
      }
    }
  };


  const handleCancelReminder = async (studentId, lessonId) => {
    const updatedReminders = allReminders.filter(r => !(r.student_id === studentId && r.lesson_id === lessonId));
    setAllReminders(updatedReminders);
    localStorage.setItem(STORAGE_KEYS.REMINDERS, JSON.stringify(updatedReminders));
    if (HAS_SUPABASE) {
      try {
        const { error } = await supabase.from('reminders').delete().match({ student_id: studentId, lesson_id: lessonId });
        if (error) console.warn('Supabase delete reminder error', error);
      } catch (err) {
        console.warn('Supabase cancel reminder error', err);
      }
    }
  };

  const handleVerifyUnit = async (progressId) => {
    // Find the progress record to check score
    const record = allStudentsProgress.find(p => p.id === progressId);
    
    if (!record) return;
    
    // Check if score is at least 70%
    const scorePercentage = (record.score / record.total) * 100;
    if (scorePercentage < 70) {
      alert(`Cannot approve: This student scored ${Math.round(scorePercentage)}% on this lesson.\n\nMastery requires at least 70%. Please encourage them to retake the quiz or send a reminder for additional practice.`);
      return;
    }
    
    const updatedProgress = allStudentsProgress.map(p => p.id === progressId ? { ...p, verified: true } : p);
    setAllStudentsProgress(updatedProgress);
    localStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify(updatedProgress));
    if (HAS_SUPABASE) {
      try {
        const { error } = await supabase.from('progress').update({ verified: true }).eq('id', progressId);
        if (error) console.warn('Supabase verify unit error', error);
      } catch (err) {
        console.warn('Supabase verify error', err);
      }
    }
  };

  const handleAuthModalSubmit = (e) => {
    e.preventDefault();
    if (accessCode === TEACHER_ACCESS_CODE) { 
      setIsTeacherAuthorized(true); setView('teacher'); setShowAuthModal(false); setAccessCode(''); setLoginError(''); 
    } else { 
      setLoginError('Incorrect code'); 
    }
  };

  const handleStartQuiz = (lesson) => {
    const updatedReminders = allReminders.filter(r => !(r.student_id === user.uid && r.lesson_id === lesson.id));
    setAllReminders(updatedReminders);
    localStorage.setItem(STORAGE_KEYS.REMINDERS, JSON.stringify(updatedReminders));
    setActiveLesson(lesson);
    setQuizState({ currentQuestion: 0, score: 0, showFeedback: false, selectedOption: null, completed: false, responses: [] });
  };

  const handleOptionSelect = (option) => {
    if (quizState.showFeedback) return;
    setQuizState(prev => ({ ...prev, selectedOption: option }));
  };

  const handleCheckAnswer = () => {
    const questions = activeLesson.questions;
    const currentQ = questions[quizState.currentQuestion];
    const isCorrect = quizState.selectedOption === currentQ.answer;
    setQuizState(prev => ({ 
      ...prev, 
      score: isCorrect ? prev.score + 1 : prev.score, 
      showFeedback: true,
      responses: [...prev.responses, { questionIndex: prev.currentQuestion, selected: prev.selectedOption, isCorrect }]
    }));
  };

  const handleNextQuestion = () => {
    const questions = Array.isArray(activeLesson?.questions) ? activeLesson.questions : [];
    if (quizState.currentQuestion + 1 < questions.length) {
      setQuizState(prev => ({ ...prev, currentQuestion: prev.currentQuestion + 1, selectedOption: null, showFeedback: false }));
    } else {
      setQuizState(prev => ({ ...prev, completed: true }));
    }
  };

  const handleSaveProgress = async (finalScore = null) => {
    if (!user || !activeLesson) return;
    
    const scoreToSave = finalScore !== null ? finalScore : quizState.score;
    
    // Create a predictable ID: user + material + lesson
    // This prevents duplicates in the database
    const progressId = `${user.uid}_${selectedMaterialId}_${activeLesson.id}`;
    
    const newRecord = {
      id: progressId, 
      student_id: user.uid, 
      student_name: user.displayName, 
      material_id: selectedMaterialId,  // DB field stores material reference
      lesson_id: activeLesson.id, 
      score: scoreToSave, 
      total: activeLesson.questions.length || 1, 
      verified: false,
      responses: quizState.responses, 
      updated_at: new Date().toISOString()
    };

    // Update local state by filtering out any old version of this specific lesson first
    setAllStudentsProgress(prev => [
      ...prev.filter(p => p.id !== progressId), 
      newRecord
    ]);
    localStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify([...allStudentsProgress.filter(p => p.id !== progressId), newRecord]));

    if (HAS_SUPABASE) {
      try {
        // 'upsert' will update the record if the 'id' already exists
        await supabase.from('progress').upsert(newRecord, { onConflict: 'id' });
      } catch (err) {
        console.warn('Save error', err);
      }
    }
    setActiveLesson(null);
  };

  const filteredTeacherProgress = useMemo(() => 
    teacherSearchTerm.trim() === '' ? allStudentsProgress : allStudentsProgress.filter(p => (String(p.student_name) || '').toLowerCase().includes(teacherSearchTerm.toLowerCase())), 
    [allStudentsProgress, teacherSearchTerm]
  );

  if (!authReady) return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><RefreshCw className="animate-spin text-indigo-600" size={40} /></div>;

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans">
        <div className="hidden md:flex md:w-1/2 p-12 text-white flex-col justify-between relative overflow-hidden" style={{backgroundColor: THEME.colors.primary}}>
          <div className="relative z-10">
            <div className="flex items-center gap-2 text-2xl font-bold mb-12"><GraduationCap size={40} /><span>iSpeaktu Quiz</span></div>
            <h1 className="text-5xl font-extrabold mb-6 leading-tight">Empower Your <span className="text-white/60">Fluency.</span></h1>
            <p className="text-lg opacity-90 max-w-md">Master English with verified progress tracking and real-time quizzes.</p>
          </div>
          <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full blur-3xl" style={{backgroundColor: 'rgba(255, 255, 255, 0.1)'}}></div>
        </div>
        <div className="flex-1 flex items-center justify-center p-6 md:p-12">
          <div className="w-full max-w-md space-y-8">
            <h2 className="text-3xl font-bold text-slate-800">Welcome</h2>
            <form onSubmit={handleLogin} className="space-y-6">
              <input type="text" value={userName} onChange={(e) => setUserName(e.target.value)} placeholder="Display Name" className="w-full px-4 py-3 rounded-xl border outline-none" style={{focusRingColor: THEME.colors.primary}} required />
              <div className="grid grid-cols-2 gap-4">
                <button type="button" onClick={() => setView('student')} className={`p-4 rounded-xl border-2 transition-all font-bold ${view === 'student' ? 'bg-indigo-50 text-slate-400 border-slate-200' : 'text-slate-400 border-slate-200'}`} style={view === 'student' ? {borderColor: THEME.colors.primary, color: THEME.colors.primary, backgroundColor: '#f0f4ff'} : {}}>Student</button>
                <button type="button" onClick={() => setView('teacher')} className={`p-4 rounded-xl border-2 transition-all font-bold ${view === 'teacher' ? 'bg-indigo-50 text-slate-400 border-slate-200' : 'text-slate-400 border-slate-200'}`} style={view === 'teacher' ? {borderColor: THEME.colors.primary, color: THEME.colors.primary, backgroundColor: '#f0f4ff'} : {}}>Teacher</button>
              </div>
              {view === 'teacher' && <div className="space-y-2"><input type="password" value={accessCode} onChange={(e) => setAccessCode(e.target.value)} placeholder="Teacher Code" className="w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-indigo-500 outline-none" required />{loginError && <p className="text-rose-600 text-xs font-bold">{loginError}</p>}</div>}
              <button type="submit" className="w-full text-white py-4 rounded-xl font-bold text-lg shadow-lg transition-colors" style={{backgroundColor: THEME.colors.primary}} onMouseEnter={(e) => e.target.style.opacity = '0.9'} onMouseLeave={(e) => e.target.style.opacity = '1'}>Start Learning</button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <nav className="bg-white/70 backdrop-blur-md border-b border-slate-100/50 sticky top-0 z-10 shadow-sm px-4 h-16 flex items-center justify-between transition-all duration-300">
        <div className="flex items-center gap-2 font-black text-lg" style={{color: THEME.colors.primary}}><GraduationCap size={28} /><span>iSpeaktu Quiz</span></div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-lg transition-all duration-300">
            <button onClick={() => setView('student')} className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all duration-300 ${view === 'student' ? 'bg-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`} style={view === 'student' ? {color: THEME.colors.primary} : {}}>Student</button>
            <button onClick={() => isTeacherAuthorized ? setView('teacher') : setShowAuthModal(true)} className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all duration-300 ${view === 'teacher' ? 'bg-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`} style={view === 'teacher' ? {color: THEME.colors.primary} : {}}>Teacher</button>
          </div>
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200/50">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-black border border-indigo-200 transition-all duration-300">{String(userName)[0] || '?'}</div>
            <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all duration-300 group" title="Log Out"><LogOut size={20} /></button>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto p-4 md:p-8">
        {view === 'student' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="space-y-6">
              {studentReminders.length > 0 && (
                <section className="bg-amber-50 border-2 border-amber-200 p-6 rounded-[2rem] shadow-lg shadow-amber-100/50 animate-in slide-in-from-top-4">
                  <div className="flex items-center gap-3 mb-4"><div className="bg-amber-500 text-white p-2 rounded-xl"><BellRing size={20} /></div><h3 className="font-black text-amber-900">Action Required</h3></div>
                  <div className="space-y-3">
                    {studentReminders.map((rem, i) => {
                      const lesson = currentMaterial?.lessons?.find(l => l.id === rem.lesson_id);
                      return (
                        <div key={i} className="bg-white/80 p-4 rounded-2xl flex items-center justify-between border border-amber-100 shadow-sm">
                          <div><p className="text-xs font-bold text-amber-700">Teacher Reminder</p><p className="text-sm font-black text-slate-800">{String(lesson?.title || 'Assignment')}</p></div>
                          <button onClick
