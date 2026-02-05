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
    primary: '#4F46E5',          // Indigo 600 - Main brand color for buttons, nav
    conversational: '#2563EB',   // Blue 600 - Conversational English material (matched with Business)
    verified: '#059669',         // Emerald 700 - Verification checkmarks & Advanced tier
    business: '#2563EB',         // Blue 600 - Business English material
    danger: '#E11D48',           // Rose 600 - Beginner feedback & failure alerts
    warning: '#D97706',          // Amber 600 - Warning/intermediate states
    neutral: '#F8FAFC',          // Slate 50 - Light backgrounds
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
  CURRICULUM: 'ispeaktu_v1_curriculum',
  AUTH_STATUS: 'ispeaktu_v1_auth_status',
  USER_NAME: 'ispeaktu_v1_user_name'
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

const readSavedAuth = () => {
  const raw = localStorage.getItem(STORAGE_KEYS.AUTH);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

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
    () => localStorage.getItem(STORAGE_KEYS.AUTH_STATUS) === 'true' || Boolean(readSavedAuth())
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

  const [userName, setUserName] = useState(
    () => localStorage.getItem(STORAGE_KEYS.USER_NAME) || readSavedAuth()?.displayName || ''
  );
  const [email, setEmail] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [loginError, setLoginError] = useState('');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authReady, setAuthReady] = useState(
    () => !Boolean(localStorage.getItem(STORAGE_KEYS.AUTH))
  );
  const [studentProfile, setStudentProfile] = useState(null);
  const [user, setUser] = useState(() => readSavedAuth());

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
        const parsedAuth = readSavedAuth();
        if (parsedAuth) {
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
    localStorage.setItem(STORAGE_KEYS.AUTH_STATUS, 'true');
    localStorage.setItem(STORAGE_KEYS.USER_NAME, newUser.displayName);

    // Now this works!
    fetchRemoteForUser(newUser); 
  };

  const handleLogout = () => {
    if (HAS_SUPABASE) supabase.auth.signOut().catch(() => {});
    localStorage.removeItem(STORAGE_KEYS.AUTH);
    localStorage.removeItem(STORAGE_KEYS.AUTH_STATUS);
    localStorage.removeItem(STORAGE_KEYS.USER_NAME);
    setUser(null); setIsAuthenticated(false); setIsTeacherAuthorized(false); setUserName(''); setView('student'); setEmail('');
  };

  useEffect(() => {
    if (!HAS_SUPABASE) return;
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
            localStorage.setItem(STORAGE_KEYS.AUTH_STATUS, 'true');
            localStorage.setItem(STORAGE_KEYS.USER_NAME, profile.displayName || '');
          } else {
            setUser(null); setIsAuthenticated(false); setIsTeacherAuthorized(false); setUserName('');
            localStorage.removeItem(STORAGE_KEYS.AUTH);
            localStorage.removeItem(STORAGE_KEYS.AUTH_STATUS);
            localStorage.removeItem(STORAGE_KEYS.USER_NAME);
          }
        });
        return () => { mounted = false; data.subscription.unsubscribe(); };
      } catch (err) {
        console.warn('Supabase auth init error', err);
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
      material_id: selectedMaterialId,  // DB field stores material reference
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
                          <button onClick={() => handleStartQuiz(lesson)} className="bg-amber-500 text-white p-2 rounded-lg hover:bg-amber-600 transition-colors shadow-sm"><ArrowRight size={18} /></button>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}
              
              <section className="space-y-4">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest px-2">Study Materials</p>
                {curriculum && curriculum.length > 0 && materialsList && materialsList.length > 0 ? materialsList.map(material => {
                  const perc = material.totalLessons > 0 ? Math.round((material.completedLessons / material.totalLessons) * 100) : 0;
                  const isSelected = selectedMaterialId === material.id;
                  const isBusiness = material.id === 'business-english';
                  const isConversational = String(material.id).toLowerCase().includes('conversational');
                  return (
                    <button
                      key={material.id}
                      onClick={() => setSelectedMaterialId(material.id)}
                      className={`w-full p-6 rounded-[2rem] border-2 text-left transition-all duration-300 group relative overflow-hidden flex flex-col h-64 bg-white 
    ${isSelected ? 'border-transparent' : 'border-slate-200 hover:border-slate-400 hover:shadow-lg'}`}
                      style={isSelected ? { 
    backgroundColor: '#FFFFFF', 
    borderColor: '#E0E7FF', 
    boxShadow: `0 8px 30px ${THEME.colors.primary}22` 
  } : {}}
                    >
                      <div className="flex-1 flex flex-col justify-end">
                        <div className={`font-extrabold text-lg mb-2`} style={isSelected ? { color: THEME.colors.primary } : {}}>{String(material.name || 'Untitled Material')}</div>
                        <div className={`flex items-center justify-between`}>
                          <p className={`text-xs font-black uppercase ${isSelected ? 'text-slate-600' : isBusiness ? 'text-slate-500' : 'text-slate-400'}`}>{material.completedLessons} / {material.totalLessons} Lessons Completed</p>
                          <div className={`px-3 py-1 rounded-full text-[11px] font-black inline-block`} style={isSelected ? { backgroundColor: THEME.colors.primary, color: '#fff' } : { backgroundColor: 'transparent', color: THEME.colors.primary }}>{perc}%</div>
                        </div>
                      </div>
                    </button>
                  );
                }) : <p className="text-xs text-slate-400 italic px-2 py-4">{curriculum && curriculum.length === 0 ? 'No materials available yet. Please wait while materials are loading...' : 'No materials available yet.'}</p>}
              </section>

              <section className="p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group border-2" style={{backgroundColor: THEME.colors.primary, borderColor: THEME.colors.primary}}>
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                {/* --- Gold Award Icon with Shine --- */}
                <div className="relative inline-block mb-4">
                  <Award 
                    size={40} 
                    style={{
                      stroke: 'url(#goldGradient)',
                      filter: 'drop-shadow(0px 0px 8px rgba(212, 175, 55, 0.5))'
                    }}
                    className="animate-pulse"
                  />
                  <svg width="0" height="0" className="absolute">
                    <defs>
                      <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style={{ stopColor: '#BF953F', stopOpacity: 1 }} />
                        <stop offset="25%" style={{ stopColor: '#FCF6BA', stopOpacity: 1 }} />
                        <stop offset="50%" style={{ stopColor: '#B38728', stopOpacity: 1 }} />
                        <stop offset="75%" style={{ stopColor: '#FBF5B7', stopOpacity: 1 }} />
                        <stop offset="100%" style={{ stopColor: '#AA771C', stopOpacity: 1 }} />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-4">Global Standing</h3>
                
                {/* Prominent Rank Display */}
                <div className="mb-6 flex items-center justify-between">
                  <div className="flex flex-col items-start">
                    <p className="text-[10px] uppercase font-bold opacity-60 mb-1">Your Rank</p>
                    <div className="flex items-baseline gap-2">
                      <p className="text-6xl font-black text-white">#{userRank}</p>
                      <p className="text-sm font-bold opacity-70">of {totalStudents} students</p>
                    </div>
                  </div>
                  <div className="text-6xl opacity-20">🏆</div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white text-black p-4 rounded-2xl border border-white">
                    <p className="text-[10px] uppercase font-bold opacity-60">Avg Accuracy</p>
                    <p className="text-2xl font-black">{averageScore}%</p>
                  </div>
                  <div className="bg-white text-black p-4 rounded-2xl border border-white">
                    <p className="text-[10px] uppercase font-bold opacity-60">Unique Lessons</p>
                    <p className="text-2xl font-black">{new Set(studentProgress.filter(p => p.verified).map(p => p.lesson_id)).size}</p>
                  </div>
                  <div className="bg-white text-black p-4 rounded-2xl border border-white">
                    <p className="text-[10px] uppercase font-bold opacity-60">Total Quizzes Taken</p>
                    <p className="text-2xl font-black">{totalQuizzesTaken}</p>
                  </div>
                  <div className="bg-white text-black p-4 rounded-2xl border border-white">
                    <p className="text-[10px] uppercase font-bold opacity-60">Retakes</p>
                    <p className="text-2xl font-black">{totalQuizzesTaken - new Set(studentProgress.filter(p => p.verified).map(p => p.lesson_id)).size}</p>
                  </div>
                </div>
              </section>
            </div>

            <div className="lg:col-span-2 space-y-6">
              {currentMaterial ? (
                <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-10 border-b bg-slate-50/30">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                           <h2 className="text-3xl font-black text-slate-800">{String(currentMaterial.name || 'Untitled Material')}</h2>
                           <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-[10px] font-black rounded-full uppercase">Current Material</span>
                        </div>
                        <p className="text-slate-500 text-sm">{String(currentMaterial.description || 'No description available')}</p>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-sm font-black text-slate-800 mb-1">Material Progress: {materialCompletion}%</span>
                        <div className="w-32 h-2 bg-slate-200 rounded-full overflow-hidden">
                           <div className="h-full transition-all duration-1000" style={{ width: `${materialCompletion}%`, backgroundColor: THEME.colors.conversational }}></div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-6">
                      <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner" style={{backgroundColor: '#f0f4ff', color: THEME.colors.primary}}>
                        <Target size={28} />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-2">
                          <p className="text-xs font-black text-slate-400 uppercase">Material Lessons</p>
                          <p className="text-xs font-black" style={{color: THEME.colors.primary}}>{new Set(allStudentsProgress.filter(p => p.material_id === currentMaterial.id && p.verified).map(p => p.lesson_id)).size} / {currentMaterial.lessons?.length || 0} Completed</p>
                        </div>
                        <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden p-1 shadow-inner">
                          <div 
                            className="h-full rounded-full transition-all duration-1000"
                            style={{ width: `${materialCompletion}%`, backgroundColor: THEME.colors.primary }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="max-h-[60vh] overflow-y-auto divide-y divide-slate-100">
                    {(currentMaterial.lessons || []).map((lesson, idx) => {
                      const record = studentProgress.find(p => p.lesson_id === lesson.id && p.material_id === currentMaterial.id);
                      const perc = record ? Math.round((record.score / record.total) * 100) : null;
                      const isVerified = record?.verified === true;
                      
                      // Check if mastery review milestone
                      const isMilestone = isMasteryReviewMilestone(idx);
                      const lockStatus = isMilestone ? null : getMasteryReviewLockStatus(studentProgress, user.uid, idx);
                      const isLocked = lockStatus?.isLocked || false;
                      
                      return (
                        <div key={lesson.id} className="p-8 flex items-center justify-between hover:bg-slate-50 transition-all group">
                          <div className="flex items-center gap-6 flex-1">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black border-2 transition-all ${isVerified ? 'text-white border-2' : record ? 'bg-white text-black border-black' : 'bg-slate-50 text-slate-400 border-dashed border-slate-300'}`} style={isVerified ? {backgroundColor: '#ECFDF5', borderColor: '#A7F3D0', boxShadow: '0 4px 12px rgba(209, 250, 229, 0.5)'} : {}}>
                              {isVerified ? <CheckCircle size={28} color="#059669" /> : idx + 1}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-3">
                                <h4 className="font-black text-lg text-slate-900">{String(lesson.title)}</h4>
                                {isMilestone && <span className="text-[10px] px-2.5 py-1 rounded-full font-black bg-black text-white">Review</span>}
                                {perc !== null && <span className={`text-[10px] px-2.5 py-1 rounded-full font-black ${isVerified ? 'bg-black text-white' : 'bg-slate-200 text-black'}`}>{perc}% Score</span>}
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <div className={`w-2 h-2 rounded-full ${record && !isVerified ? 'bg-slate-400' : 'bg-slate-300'}`} style={isVerified ? {backgroundColor: THEME.colors.verified, boxShadow: '0 0 0 4px rgba(5,150,105,0.08)'} : {}}></div>
                                <p className="text-xs text-slate-600 font-bold">{isLocked ? lockStatus.reason : isVerified ? 'Passed' : record ? 'Awaiting Approval' : 'Available for Study'}</p>
                              </div>
                            </div>
                          </div>
                          <button disabled={isLocked} onClick={() => handleStartQuiz(lesson)} className={`px-8 py-3 rounded-2xl text-sm font-black transition-all duration-300 transform active:scale-95 hover:scale-105 ${isLocked ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : record ? 'bg-white text-black border-2 border-black hover:bg-black hover:text-white' : 'bg-black text-white shadow-xl hover:bg-slate-800'}`}>
                            {isLocked ? 'Locked' : record ? 'Review / Retake' : 'Start Lesson'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="p-20 bg-white border-2 border-dashed border-slate-200 rounded-[2.5rem] flex flex-col items-center justify-center text-slate-400">
                  <p className="font-black">Select a Material to See Lessons</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-8 animate-in fade-in duration-500">
             <header className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
              <h2 className="text-3xl font-black text-slate-800">Teacher Analytics</h2>
              <div className="relative w-full md:w-80">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" 
                  value={teacherSearchTerm} 
                  onChange={(e) => setTeacherSearchTerm(e.target.value)} 
                  placeholder="Filter student results..." 
                  className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-200 bg-white focus:ring-4 focus:ring-indigo-500/10 outline-none text-sm transition-all shadow-sm" 
                />
              </div>
            </header>
            
            <div className="bg-white rounded-[2.5rem] border-2 border-black overflow-hidden shadow-sm">
              <div className="p-8 border-b bg-black font-extrabold flex items-center justify-between text-white">
                <div className="flex items-center gap-2"><AlertTriangle size={20} className="text-white" /> Common Mistakes in Materials</div>
                <div className="text-xs text-slate-300 font-bold uppercase tracking-widest">{getLessonFailureRates(curriculum, allStudentsProgress).filter(l => l.failureRate > 0.8).length} Lessons Flagged</div>
              </div>
              <div className="overflow-x-auto text-sm">
                <table className="w-full text-left">
                  <thead><tr className="bg-slate-50 text-slate-400 border-b uppercase text-[10px] font-black tracking-widest"><th className="px-8 py-4">Material Lesson</th><th className="px-8 py-4 text-center">Failure Rate</th><th className="px-8 py-4 text-center">Status</th><th className="px-8 py-4 text-right">Details</th></tr></thead>
                  <tbody className="divide-y text-slate-700">
                    {getLessonFailureRates(curriculum, allStudentsProgress).filter(l => l.failureRate > 0.8).length === 0 ? (
                      <tr><td colSpan="4" className="px-8 py-10 text-center text-slate-400 italic font-medium">No lessons with high failure rates.</td></tr>
                    ) : (
                      getLessonFailureRates(curriculum, allStudentsProgress)
                        .filter(l => l.failureRate > 0.8)
                        .map((lesson, idx) => (
                          <tr key={idx} className="hover:bg-slate-50 transition-colors border-l-4 border-l-rose-500">
                            <td className="px-8 py-6 font-black text-slate-800">{String(lesson.lessonTitle || lesson.lesson_id)}</td>
                            <td className="px-8 py-6 text-center">
                              <div className="flex flex-col items-center">
                                <span className="font-black text-lg text-rose-600">{Math.round(lesson.failureRate * 100)}%</span>
                                <span className="text-[10px] text-slate-400 font-bold">{Math.round(lesson.failures)} / {Math.round(lesson.total)} Failed</span>
                              </div>
                            </td>
                            <td className="px-8 py-6 text-center">
                              <span className="text-[10px] font-black uppercase text-white bg-black px-4 py-2 rounded-full border border-black">Masterclass Recommended</span>
                            </td>
                            <td className="px-8 py-6 text-right">
                              <button onClick={() => alert(`Review Material Lesson: ${lesson.lessonTitle || lesson.lesson_id}\n\nFailure Rate: ${Math.round(lesson.failureRate * 100)}%\n\nConsider creating a masterclass or additional practice material for this topic.`)} className="p-3 text-slate-400 hover:text-black rounded-xl transition-all duration-300 hover:scale-110">
                                <Eye size={20} />
                              </button>
                            </td>
                          </tr>
                        ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            
            <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
              <div className="p-8 border-b bg-slate-50/30 font-extrabold flex items-center justify-between text-slate-700">
                <div className="flex items-center gap-2"><BarChart3 size={20} className="text-indigo-500" /> Recent Student Activity</div>
                <div className="text-xs text-slate-400 font-bold uppercase tracking-widest">{filteredTeacherProgress.length} Submissions</div>
              </div>
              <div className="overflow-x-auto text-sm">
                <table className="w-full text-left">
                  <thead><tr className="bg-slate-50 text-slate-400 border-b uppercase text-[10px] font-black tracking-widest"><th className="px-8 py-4">Student</th><th className="px-8 py-4">Lesson Title</th><th className="px-8 py-4 text-center">Score</th><th className="px-8 py-4 text-center">Status</th><th className="px-8 py-4 text-right">Actions</th></tr></thead>
                  <tbody className="divide-y text-slate-700">
                    {filteredTeacherProgress.length === 0 ? <tr><td colSpan="5" className="px-8 py-10 text-center text-slate-400 italic font-medium">No results matching your search.</td></tr> :
                      filteredTeacherProgress.map((p, idx) => {
                        const hasActiveReminder = allReminders.some(r => r.student_id === p.student_id && r.lesson_id === p.lesson_id);
                        return (
                          <tr key={idx} className={`hover:bg-slate-50 transition-colors ${!p.verified ? 'bg-zinc-50' : ''}`}>
                            <td className="px-8 py-6 font-black flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-black">{String(p.student_name)[0] || 'S'}</div>{String(p.student_name)}</td>
                            <td className="px-8 py-6 font-bold text-slate-600">{curriculum.find(t=>t.id===p.material_id)?.lessons.find(l=>l.id===p.lesson_id)?.title || String(p.lesson_id)}</td>
                            <td className="px-8 py-6 text-center">
                               <div className="flex flex-col items-center">
                                 <span className={`font-black text-lg ${p.score/p.total < 0.7 ? "text-rose-600" : "text-emerald-600"}`}>{Math.round((p.score/p.total)*100)}%</span>
                                 <span className="text-[10px] text-slate-400 font-bold">{p.score} / {p.total}</span>
                               </div>
                            </td>
                            <td className="px-8 py-6 text-center">{p.verified ? <span className="text-[10px] font-black uppercase px-4 py-2 rounded-full border" style={{color: '#059669', backgroundColor: '#ECFDF5', borderColor: '#A7F3D0', boxShadow: '0 2px 8px rgba(209, 250, 229, 0.4)'}}>Approved</span> : <span className="text-[10px] font-black uppercase text-indigo-600 bg-indigo-50 px-4 py-2 rounded-full border border-indigo-100">Pending</span>}</td>
                            <td className="px-8 py-6 text-right flex justify-end gap-2">
                              <button onClick={() => setReviewRecord(p)} className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-xl transition-all duration-300 shadow-sm hover:scale-110"><Eye size={20} /></button>
                              
                              {!p.verified && (
                                p.score/p.total < 0.7 ? (
                                  <span className="bg-slate-100 text-slate-500 px-5 py-2.5 rounded-xl text-xs font-black border border-slate-200 cursor-not-allowed">Below 70%</span>
                                ) : (
                                  <button onClick={() => handleVerifyUnit(p.id)} className="text-white px-5 py-2.5 rounded-xl text-xs font-black shadow-lg transition-all" style={{backgroundColor: THEME.colors.verified}} onMouseEnter={(e) => e.target.style.opacity = '0.9'} onMouseLeave={(e) => e.target.style.opacity = '1'}>Approve</button>
                                )
                              )}
                              
                              {p.score/p.total < 0.7 && (
                                !hasActiveReminder ? (
                                  <button onClick={() => handleSendReminder(p.student_id, p.lesson_id, p.material_id)} className="bg-rose-50 text-rose-600 px-5 py-2.5 rounded-xl text-xs font-black border border-rose-100 hover:bg-rose-100 transition-all">Send Reminder</button>
                                ) : (
                                  <button onClick={() => handleCancelReminder(p.student_id, p.lesson_id)} className="bg-slate-100 text-slate-600 px-5 py-2.5 rounded-xl text-xs font-black border border-slate-200 flex items-center gap-2">
                                    <BellOff size={14} /> End Reminder
                                  </button>
                                )
                              )}
                            </td>
                          </tr>
                        );
                      })
                    }
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {reviewRecord && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in duration-300">
            <div className="px-10 pt-10 pb-6 border-b flex justify-between shrink-0">
              <div><p className="text-xs font-black text-indigo-500 uppercase tracking-widest mb-1">Performance Review</p><h3 className="text-3xl font-black text-slate-800">{String(reviewRecord.student_name)}</h3></div>
              <button onClick={() => setReviewRecord(null)} className="p-3 hover:bg-slate-100 rounded-full transition-colors"><X size={28} /></button>
            </div>
            <div className="p-10 overflow-y-auto space-y-8">
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 text-center"><p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Final Score</p><p className="text-5xl font-black text-indigo-600">{Math.round((reviewRecord.score/(reviewRecord.total || 1))*100)}%</p></div>
                <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 text-center"><p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Verification</p><span className={`inline-block mt-2 px-6 py-2 rounded-full text-xs font-black uppercase ${reviewRecord.verified ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{reviewRecord.verified ? 'Approved' : 'Pending Review'}</span></div>
              </div>
              <div className="space-y-4">
                <p className="text-sm font-black text-slate-800 uppercase tracking-widest">Question Breakdown</p>
                {reviewRecord.responses?.map((resp, i) => (
                  <div key={i} className={`p-6 rounded-3xl border-2 flex items-center justify-between ${resp.isCorrect ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`}>
                    <div>
                      <p className="font-black text-slate-700">Question {i+1}</p>
                      <p className="text-sm opacity-60 font-bold">Chose: {String(resp.selected)}</p>
                    </div>
                    {resp.isCorrect ? <CheckCircle size={24} className="text-emerald-500" /> : <AlertCircle size={24} className="text-rose-500" />}
                  </div>
                ))}
              </div>
              {!reviewRecord.verified && (
                (reviewRecord.score / reviewRecord.total) * 100 < 70 ? (
                  <div className="w-full py-6 bg-slate-100 text-slate-500 rounded-3xl font-black text-xl border-2 border-slate-200 text-center cursor-not-allowed">
                    Score Below 70% - Mastery Required
                  </div>
                ) : (
                  <button onClick={() => { handleVerifyUnit(reviewRecord.id); setReviewRecord(null); }} className="w-full py-6 text-white rounded-3xl font-black text-xl shadow-xl transition-all" style={{backgroundColor: THEME.colors.verified}} onMouseEnter={(e) => e.target.style.opacity = '0.9'} onMouseLeave={(e) => e.target.style.opacity = '1'}>Approve Lesson Completion</button>
                )
              )}
            </div>
          </div>
        </div>
      )}

      {activeLesson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in duration-300">
            <div className="px-10 pt-10 pb-6 flex justify-between shrink-0">
              <div><span className="text-xs font-black uppercase text-indigo-500 tracking-widest">Assessment Module</span><h3 className="text-3xl font-black text-slate-800">{String(activeLesson.title)}</h3></div>
              <button onClick={() => setActiveLesson(null)} className="p-3 hover:bg-slate-100 rounded-full transition-colors"><X size={28} /></button>
            </div>
            <div className="p-10 overflow-y-auto">
              {Array.isArray(activeLesson.questions) && activeLesson.questions.length > 0 ? (
                !quizState.completed ? (
                  <div className="space-y-8">
                    <div className="space-y-2">
                       <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          <span>Progress</span>
                          <span>{quizState.currentQuestion + 1} / {activeLesson.questions.length}</span>
                       </div>
                       <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden p-0.5 border">
                          <div className="h-full transition-all duration-500 rounded-full" style={{ width: `${((quizState.currentQuestion) / activeLesson.questions.length) * 100}%`, backgroundColor: THEME.colors.primary }} />
                       </div>
                    </div>

                    <div className="bg-slate-100/60 p-10 rounded-[3rem] border border-slate-200 text-2xl font-black text-slate-800 shadow-inner text-center">
                      {String(activeLesson.questions[quizState.currentQuestion]?.question ?? '')}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      {(activeLesson.questions[quizState.currentQuestion]?.options || []).map((opt, i) => (
                        <button key={i} disabled={quizState.showFeedback} onClick={() => handleOptionSelect(opt)} className={`p-7 rounded-[2rem] text-left font-bold text-base transition-all duration-300 border-4 transform active:scale-95 hover:scale-105 ${quizState.showFeedback && opt === activeLesson.questions[quizState.currentQuestion].answer ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : quizState.showFeedback && quizState.selectedOption === opt ? 'bg-rose-50 border-rose-500 text-rose-700' : quizState.selectedOption === opt ? 'bg-indigo-600 text-white border-indigo-600 shadow-xl' : 'bg-white hover:border-indigo-300 border-slate-200 shadow-sm hover:shadow-md'}`}>
                          <span className="mr-3 opacity-40 font-black">{String.fromCharCode(65 + i)}.</span> {String(opt)}
                        </button>
                      ))}
                    </div>
                    {quizState.showFeedback && <div className="p-6 bg-indigo-50 rounded-[2rem] text-sm font-bold border-2 border-indigo-200 flex gap-4 items-start relative before:content-[''] before:absolute before:-left-2 before:top-6 before:w-0 before:h-0 before:border-l-6 before:border-l-transparent before:border-t-6 before:border-t-indigo-50"><Info className="text-indigo-600 shrink-0 mt-0.5" size={20} /> <div><p className="text-indigo-600 uppercase text-[10px] font-black mb-1">💡 Teacher Feedback</p><p className="text-slate-700">{String(activeLesson.questions[quizState.currentQuestion]?.feedback ?? '')}</p></div></div>}
                    <button disabled={!quizState.selectedOption} onClick={quizState.showFeedback ? handleNextQuestion : handleCheckAnswer} className="w-full py-6 text-white rounded-[2rem] font-black text-2xl shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed" style={{backgroundColor: THEME.colors.primary}} onMouseEnter={(e) => !quizState.selectedOption ? null : e.target.style.opacity = '0.9'} onMouseLeave={(e) => !quizState.selectedOption ? null : e.target.style.opacity = '1'}>
                      {quizState.showFeedback ? 'Continue' : 'Check Answer'}
                    </button>
                  </div>
                ) : (
                  (() => {
                    const percentage = Math.round((quizState.score / activeLesson.questions.length) * 100);
                    const tierKey = Object.keys(FEEDBACK_TIERS).find(key => 
                      percentage >= FEEDBACK_TIERS[key].range[0] && percentage <= FEEDBACK_TIERS[key].range[1]
                    ) || 'BEGINNER';
                    const tier = FEEDBACK_TIERS[tierKey];
                    const randomNote = tier.notes[Math.floor(Math.random() * tier.notes.length)];

                    return (
                      <div className="space-y-8 animate-in fade-in zoom-in duration-500">
                        {/* Header Summary with Tier */}
                        <div className={`p-8 rounded-[2.5rem] border-2 ${tier.bg} ${tier.border} text-center transition-all duration-300`}>
                          <div className="flex justify-center mb-4">
                            <div className={`w-20 h-20 rounded-full flex items-center justify-center border-4 border-white shadow-sm transition-all duration-300 ${tier.color.replace('text', 'bg').replace('600', '100')}`}>
                              <Award size={40} className={`${tier.color} animate-bounce`} />
                            </div>
                          </div>
                          <h4 className={`text-5xl font-black mb-2 transition-all duration-300 ${tier.color}`}>{percentage}%</h4>
                          <p className={`text-xs font-black uppercase tracking-widest mb-4 transition-all duration-300 ${tier.color}`}>{tier.label}</p>
                          <div className="max-w-md mx-auto">
                            <p className="text-slate-700 font-medium leading-relaxed italic transition-all duration-300">
                              "{userName}, {randomNote}"
                            </p>
                          </div>
                        </div>

                        {/* Detailed Stats Row */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm text-center transition-all duration-300 hover:shadow-md hover:scale-105">
                            <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Passed</p>
                            <p className="text-2xl font-black text-emerald-600 transition-all duration-300">{quizState.score} / {activeLesson.questions.length}</p>
                          </div>
                          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm text-center transition-all duration-300 hover:shadow-md hover:scale-105">
                            <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Status</p>
                            <p className="text-2xl font-black text-slate-800 transition-all duration-300">{percentage >= 70 ? 'Passed' : 'Review Needed'}</p>
                          </div>
                        </div>

                        {/* Correction Report with Explanations */}
                        <div className="space-y-4">
                          <p className="text-xs font-black text-slate-400 uppercase tracking-widest px-2">Correction & Explanation</p>
                          {activeLesson.questions.map((q, i) => {
                            const r = quizState.responses[i];
                            return (
                              <div key={i} className={`p-6 rounded-[2rem] border-2 bg-white transition-all duration-300 hover:shadow-md hover:scale-105 ${r?.isCorrect ? 'border-emerald-100 hover:border-emerald-200' : 'border-rose-100 hover:border-rose-200'}`}>
                                <div className="flex justify-between items-start mb-3">
                                  <p className="font-bold text-slate-800">{i + 1}. {q.question}</p>
                                  {r?.isCorrect ? <CheckCircle className="text-emerald-500 transition-all duration-300" size={20} /> : <AlertCircle className="text-rose-500 transition-all duration-300" size={20} />}
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm mb-3">
                                  <div className={`p-3 rounded-xl border transition-all duration-300 ${r?.isCorrect ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-rose-50 border-rose-100 text-rose-700'}`}>
                                    <span className="text-[10px] font-black block uppercase opacity-60">Your Choice</span>
                                    <span className="font-bold">{r?.selected}</span>
                                  </div>
                                  {!r?.isCorrect && (
                                    <div className="p-3 rounded-xl border bg-slate-50 border-slate-200 text-slate-700 transition-all duration-300">
                                      <span className="text-[10px] font-black block uppercase opacity-60">Correct Answer</span>
                                      <span className="font-bold">{q.answer}</span>
                                    </div>
                                  )}
                                </div>

                                <div className="bg-indigo-50 p-4 rounded-2xl transition-all duration-300 border border-indigo-100">
                                  <p className="text-[10px] font-black text-indigo-600 uppercase mb-1">💡 Why this answer?</p>
                                  <p className="text-xs text-slate-700 leading-relaxed font-medium">{q.feedback}</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        <button onClick={() => handleSaveProgress(quizState.score)} className="w-full py-6 text-white rounded-[2.5rem] font-black text-xl shadow-xl transition-all duration-300 hover:scale-105 active:scale-95" style={{backgroundColor: THEME.colors.primary}} onMouseEnter={(e) => e.target.style.opacity = '0.9'} onMouseLeave={(e) => e.target.style.opacity = '1'}>
                          Save and Complete Lesson
                        </button>
                      </div>
                    );
                  })()
                )
              ) : <div className="text-center py-20"><p className="text-slate-400 font-black text-lg">No questions in this unit.</p><button onClick={() => setActiveLesson(null)} className="mt-6 px-10 py-4 bg-slate-100 rounded-2xl font-black text-slate-600">Return to Dashboard</button></div>}
            </div>
          </div>
        </div>
      )}

      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-sm p-10 animate-in zoom-in duration-300">
            <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mx-auto mb-6"><Lock size={32} /></div>
            <h3 className="text-2xl font-black text-center mb-6 text-slate-800">Teacher Login</h3>
            <form onSubmit={handleAuthModalSubmit} className="space-y-4">
              <input type="password" autoFocus value={accessCode} onChange={(e) => setAccessCode(e.target.value)} placeholder="Access Code" className="w-full px-6 py-4 rounded-2xl border-2 border-slate-100 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 outline-none font-bold" required />
              <button type="submit" className="w-full py-4 text-white rounded-2xl font-black shadow-lg transition-all" style={{backgroundColor: THEME.colors.primary}} onMouseEnter={(e) => e.target.style.opacity = '0.9'} onMouseLeave={(e) => e.target.style.opacity = '1'}>Unlock Panel</button>
              <button type="button" onClick={() => setShowAuthModal(false)} className="w-full text-sm font-bold text-slate-400 mt-2">Cancel</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
