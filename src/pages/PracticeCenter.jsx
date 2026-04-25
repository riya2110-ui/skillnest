import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import api from '../services/api';
import Sidebar from '../components/Sidebar';
import { Skeleton, Spinner } from '../components/LoadingUI';
import { 
  Trophy, Clock, ChevronRight, AlertCircle, 
  CheckCircle2, Brain, Users, Layout, RotateCcw, 
  Home, Star, MessageSquare, Zap, Database, Timer, Code2, Sparkles, RefreshCcw, ArrowRight
} from 'lucide-react';

// ─── Llama Badge (AI Evaluator) ──────────────────────────────────
const LlamaBadge = () => (
  <div className="flex items-center gap-2 px-3 py-1 bg-indigo-50 border border-indigo-100 rounded-full shrink-0">
     <Sparkles size={12} className="text-indigo-600" />
     <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">AI Evaluator</span>
  </div>
);

const PracticeCenter = () => {
  const { user, setUser } = useUser();
  const navigate = useNavigate();
  
  // High-level mode: 'selection', 'interview', 'aptitude', 'sql'
  const [mode, setMode] = useState('selection');
  const [loadingType, setLoadingType] = useState(null); // tracks which card triggered loading
  
  // ─── MOCK INTERVIEW STATE ─────────────────────────────────────────
  const [step, setStep] = useState(1); 
  const [type, setType] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [evaluations, setEvaluations] = useState({});
  const [loading, setLoading] = useState(false);
  const [interviewTimer, setInterviewTimer] = useState(0);

  // ─── MASTERY LAB STATE ───────────────────────────────────────────
  const [aptitudeData, setAptitudeData] = useState(null);
  const [aptIndex, setAptIndex] = useState(0);
  const [aptAnswers, setAptAnswers] = useState({});
  const [aptScore, setAptScore] = useState(null);
  const [aptTimer, setAptTimer] = useState(300);
  
  const [sqlChallenge, setSqlChallenge] = useState(null);
  const [userSql, setUserSql] = useState('');
  const [sqlResult, setSqlResult] = useState(null);

  // ─── TIMERS ──────────────────────────────────────────────────────
  useEffect(() => {
    let interval;
    if (mode === 'interview' && step === 2 && !loading) {
      interval = setInterval(() => setInterviewTimer(prev => prev + 1), 1000);
    } else if (mode === 'aptitude' && !aptScore && aptTimer > 0) {
      interval = setInterval(() => setAptTimer(t => t - 1), 1000);
    } else if (mode === 'aptitude' && aptTimer === 0 && !aptScore) {
      handleFinishAptitude();
    }
    return () => clearInterval(interval);
  }, [mode, step, loading, aptTimer, aptScore]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // ─── INTERVIEW LOGIC ─────────────────────────────────────────────
  const startInterview = async (selectedType) => {
    setType(selectedType);
    setLoading(true);
    setLoadingType(selectedType);
    try {
      const res = await api.post('/career/mock-interview/questions-set', { type: selectedType });
      setQuestions(res.data.questions);
      setMode('interview');
      setStep(2);
      setInterviewTimer(0);
      setCurrentIndex(0);
      setAnswers({});
      setEvaluations({});
    } catch (err) {
      console.error(err);
      alert("Failed to start interview. Please try again.");
    } finally {
      setLoading(false);
      setLoadingType(null);
    }
  };

  const handleNextQuestion = async () => {
    const currentAnswer = answers[currentIndex];
    if (!currentAnswer || currentAnswer.length < 10) {
      alert("Please provide a more detailed answer.");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/career/mock-interview/evaluate', {
        question: questions[currentIndex].text,
        answer: currentAnswer,
        type: type
      });
      
      setEvaluations(prev => ({ ...prev, [currentIndex]: res.data }));

      if (currentIndex < 4) {
        setCurrentIndex(prev => prev + 1);
        setInterviewTimer(0);
      } else {
        finalizeInterviewResults(res.data);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const finalizeInterviewResults = async (lastEval) => {
    const allEvals = { ...evaluations, [currentIndex]: lastEval };
    const avgScore = Object.values(allEvals).reduce((acc, curr) => acc + curr.score, 0) / 5;
    try {
      const res = await api.post('/career/mock-interview/session-save', {
        type,
        score: avgScore,
        questionBreakdown: questions.map((q, i) => ({
          question: q.text,
          answer: answers[i],
          score: allEvals[i].score,
          feedback: allEvals[i].feedback,
          improvement: allEvals[i].improvement
        }))
      });
      setUser(prev => ({ ...prev, confidenceScore: res.data.newConfidenceScore }));
      setStep(3);
    } catch (err) { console.error(err); }
  };

  // ─── MASTERY LOGIC ───────────────────────────────────────────────
  const startAptitude = async () => {
    setLoading(true);
    setLoadingType('Aptitude');
    try {
      const res = await api.post('/practice/aptitude/generate');
      setAptitudeData(res.data.questions);
      setAptScore(null);
      setAptAnswers({});
      setAptIndex(0);
      setAptTimer(300);
      setMode('aptitude');
    } catch (err) { console.error(err); }
    finally { setLoading(false); setLoadingType(null); }
  };

  const startSql = async () => {
    setLoading(true);
    setLoadingType('SQL');
    try {
      const res = await api.post('/practice/sql/generate');
      setSqlChallenge(res.data);
      setSqlResult(null);
      setUserSql('');
      setMode('sql');
    } catch (err) { console.error(err); }
    finally { setLoading(false); setLoadingType(null); }
  };

  const handleFinishAptitude = () => {
    let score = 0;
    aptitudeData.forEach((q, idx) => {
      if (aptAnswers[idx] === q.correct) score++;
    });
    setAptScore(score);
    if (score >= 5) {
      const xp = score * 5;
      setUser(prev => ({ ...prev, xp: (prev.xp || 0) + xp }));
    }
  };

  const validateSql = async () => {
    setLoading(true);
    try {
      const res = await api.post('/practice/sql/validate', {
        task: sqlChallenge.task,
        schema: sqlChallenge.schema,
        userSql
      });
      setSqlResult(res.data);
      if (res.data.correct) {
        setUser(prev => ({ ...prev, xp: (prev.xp || 0) + 25 }));
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const resetToSelection = () => {
    setMode('selection');
    setStep(1);
    setType(null);
    setAptScore(null);
    setSqlResult(null);
  };

  // ──────────────────────────────────────────────────────────────────────────
  // SUB-SCREENS
  // ──────────────────────────────────────────────────────────────────────────
  
  const selectionScreen = (
    <div className="max-w-6xl mx-auto py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-black font-nunito mb-3 text-slate-800 tracking-tight">Practice Arena</h1>
        <p className="text-slate-500 font-medium max-w-2xl mx-auto">Master the technical stack and sharpen your soft skills with our AI-powered simulators.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          { id: 'Technical / OA', icon: <Brain size={24} />, color: 'bg-blue-50 text-blue-600', group: 'Mock Interview', desc: 'DSA, Coding & Online Assessment' },
          { id: 'HR', icon: <Users size={24} />, color: 'bg-purple-50 text-purple-600', group: 'Mock Interview', desc: 'Behavioral & Culture Fit' },
          { id: 'System Design', icon: <Layout size={24} />, color: 'bg-pink-50 text-pink-600', group: 'Mock Interview', desc: 'Architecture & Scalability' },
        ].map(card => (
          <motion.div
            key={card.id}
            whileHover={{ y: -5, scale: 1.02 }}
            onClick={() => !loading && startInterview(card.id)}
            className="bg-white p-8 rounded-[2.5rem] border border-slate-100 hover:border-indigo-200 cursor-pointer shadow-sm hover:shadow-xl transition-all relative overflow-hidden group"
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 ${card.color}`}>
              {card.icon}
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">{card.group}</span>
            <h3 className="text-xl font-black text-slate-800 mb-2">{card.id}</h3>
            <p className="text-xs text-slate-400 font-medium">{card.desc || '5 Targeted AI Questions'}</p>
            <div className="mt-6 flex items-center justify-between">
               <span className="text-indigo-500 font-bold text-sm">Start Session</span>
               <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all">
                  <ChevronRight size={16} />
               </div>
            </div>
          </motion.div>
        ))}

        <motion.div
          whileHover={{ y: -5, scale: 1.02 }}
          onClick={startAptitude}
          className="bg-white p-8 rounded-[2.5rem] border border-slate-100 hover:border-amber-200 cursor-pointer shadow-sm hover:shadow-xl transition-all relative overflow-hidden group"
        >
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-6">
            <Zap size={24} fill="currentColor" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Mastery Drills</span>
          <h3 className="text-xl font-black text-slate-800 mb-2">Aptitude Sprint</h3>
          <p className="text-xs text-slate-400 font-medium">10 Questions • 5 Mins</p>
          <div className="mt-6 flex items-center justify-between">
               <span className="text-amber-600 font-bold text-sm">Start Sprint</span>
               <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-all">
                  <ChevronRight size={16} />
               </div>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -5, scale: 1.02 }}
          onClick={startSql}
          className="bg-white p-8 rounded-[2.5rem] border border-slate-100 hover:border-emerald-200 cursor-pointer shadow-sm hover:shadow-xl transition-all relative overflow-hidden group"
        >
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-6">
            <Database size={24} fill="currentColor" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Mastery Drills</span>
          <h3 className="text-xl font-black text-slate-800 mb-2">SQL Architect</h3>
          <p className="text-xs text-slate-400 font-medium">AI Evaluated Code</p>
          <div className="mt-6 flex items-center justify-between">
               <span className="text-emerald-600 font-bold text-sm">Start Challenge</span>
               <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-all">
                  <ChevronRight size={16} />
               </div>
          </div>
        </motion.div>
      </div>

      {/* Full-screen generating overlay */}
      <AnimatePresence>
        {loading && loadingType && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-gradient-to-br from-white/90 via-indigo-50/80 to-white/90 backdrop-blur-xl flex flex-col items-center justify-center"
          >
            {/* Animated orbital system */}
            <div className="relative w-44 h-44 mb-12">
              {/* Outer rotating orbit */}
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-dashed border-indigo-400/20"
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
              >
                <div className="absolute -top-1.5 left-1/2 -ml-1.5 w-3 h-3 rounded-full bg-indigo-400 shadow-lg shadow-indigo-400/50" />
                <div className="absolute -bottom-1.5 left-1/2 -ml-1.5 w-2 h-2 rounded-full bg-purple-400 shadow-lg shadow-purple-400/50" />
              </motion.div>

              {/* Middle rotating orbit (reverse) */}
              <motion.div
                className="absolute inset-4 rounded-full border border-indigo-300/15"
                animate={{ rotate: -360 }}
                transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
              >
                <div className="absolute top-1/2 -right-1 -mt-1 w-2 h-2 rounded-full bg-cyan-400 shadow-lg shadow-cyan-400/50" />
                <div className="absolute top-1/2 -left-1 -mt-1 w-1.5 h-1.5 rounded-full bg-violet-400" />
              </motion.div>

              {/* Inner glow ring */}
              <motion.div
                className="absolute inset-8 rounded-full"
                style={{ background: 'conic-gradient(from 0deg, transparent, rgba(99,102,241,0.3), transparent, rgba(168,85,247,0.2), transparent)' }}
                animate={{ rotate: 360 }}
                transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
              />

              {/* Center brain icon */}
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.div
                  className="w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 flex items-center justify-center shadow-2xl"
                  style={{ boxShadow: '0 0 60px rgba(99,102,241,0.4), 0 0 120px rgba(99,102,241,0.15)' }}
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <Brain size={36} className="text-white" />
                </motion.div>
              </div>

              {/* Floating particles */}
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1 h-1 rounded-full bg-indigo-300"
                  style={{
                    top: `${20 + Math.random() * 60}%`,
                    left: `${20 + Math.random() * 60}%`,
                  }}
                  animate={{
                    y: [0, -12, 0],
                    opacity: [0, 0.8, 0],
                  }}
                  transition={{
                    duration: 2 + Math.random() * 2,
                    repeat: Infinity,
                    delay: i * 0.4,
                  }}
                />
              ))}
            </div>

            <h2 className="text-2xl font-black text-slate-800 mb-3 tracking-tight">Generating Questions</h2>
            <p className="text-slate-500 font-medium text-sm mb-8 max-w-md text-center">
              AI is crafting a personalized <span className="text-indigo-600 font-black">{loadingType}</span> session based on your profile...
            </p>

            {/* Progress dots */}
            <div className="flex items-center gap-2">
              {[0, 1, 2, 3, 4].map(i => (
                <motion.div
                  key={i}
                  className="w-2.5 h-2.5 rounded-full bg-indigo-500"
                  animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  const interviewView = (
    <div className="max-w-4xl mx-auto py-6">
      {step === 2 && (
        <div className="space-y-8">
           <div className="flex justify-between items-center bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
             <div className="flex items-center gap-4">
                <button onClick={resetToSelection} className="p-2 hover:bg-slate-50 rounded-xl transition-colors">
                  <RotateCcw size={18} className="text-slate-400" />
                </button>
                <div className="h-6 w-px bg-slate-100"></div>
                <div className="text-sm font-black text-slate-400 uppercase tracking-widest">{type} Interview</div>
             </div>
             <div className="flex items-center gap-6">
                <div className="flex items-center gap-2 text-slate-500 font-bold text-sm">
                   <Clock size={16} /> {formatTime(interviewTimer)}
                </div>
                <div className="flex items-center gap-3">
                   <span className="text-xs font-black text-indigo-600">{currentIndex + 1}/5</span>
                   <div className="w-24 h-1.5 bg-slate-50 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-600 transition-all duration-500" style={{ width: `${(currentIndex + 1) * 20}%` }} />
                   </div>
                </div>
             </div>
           </div>

           <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden">
              <h2 className="text-2xl font-bold font-nunito text-slate-800 mb-4">{questions[currentIndex]?.text}</h2>
              <p className="text-sm text-slate-400 italic mb-10">Hint: {questions[currentIndex]?.context}</p>
              <textarea
                value={answers[currentIndex] || ''}
                onChange={e => setAnswers({ ...answers, [currentIndex]: e.target.value })}
                className="w-full h-48 p-6 bg-slate-50 border-2 border-slate-100 rounded-3xl font-dm-sans text-lg focus:bg-white focus:border-indigo-600 transition-all outline-none"
                placeholder="Type your answer here..."
              />
              <div className="flex justify-end mt-8">
                <button onClick={handleNextQuestion} disabled={loading} className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-xl shadow-indigo-600/20 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50">
                  {loading ? <Spinner size={16} /> : currentIndex === 4 ? 'Complete' : 'Next Question'}
                </button>
              </div>
           </div>
        </div>
      )}
      {step === 3 && (
        <div className="py-10 text-center">
           <Trophy size={64} className="text-yellow-500 mx-auto mb-6" />
           <h2 className="text-4xl font-black font-nunito text-slate-800 mb-8">Performance Summary</h2>
           <div className="flex justify-center gap-4">
              <button onClick={resetToSelection} className="px-10 py-4 bg-slate-800 text-white rounded-2xl font-black">Back to Arena</button>
           </div>
        </div>
      )}
    </div>
  );

  const aptitudeView = (
    <div className="max-w-3xl mx-auto py-10">
      {aptScore !== null ? (
        <div className="text-center py-20">
          <Trophy size={80} className="text-amber-500 mx-auto mb-8" />
          <h2 className="text-4xl font-black text-slate-800 mb-2">Sprint Results</h2>
          <div className="text-7xl font-black text-amber-600 my-10">{aptScore}/10</div>
          <button onClick={resetToSelection} className="px-12 py-4 bg-amber-600 text-white rounded-2xl font-black shadow-xl">Return to Arena</button>
        </div>
      ) : (
        <div className="space-y-8">
           <div className="flex justify-between items-center bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
             <button onClick={resetToSelection} className="p-2 hover:bg-slate-50 rounded-xl transition-colors"><RotateCcw size={18} className="text-slate-400" /></button>
             <div className="flex items-center gap-2 font-black text-sm text-slate-500">
                <Timer size={16} /> {Math.floor(aptTimer / 60)}:{String(aptTimer % 60).padStart(2, '0')}
             </div>
           </div>
           <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm">
              <h2 className="text-2xl font-bold text-slate-800 leading-relaxed mb-10">{aptitudeData?.[aptIndex]?.question}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {aptitudeData?.[aptIndex]?.options.map((opt, i) => (
                  <button key={i} onClick={() => setAptAnswers({ ...aptAnswers, [aptIndex]: i })} className={`p-5 rounded-2xl border-2 text-left font-bold transition-all ${aptAnswers[aptIndex] === i ? 'border-amber-600 bg-amber-50 text-amber-700' : 'border-slate-50 bg-slate-50 hover:border-amber-200'}`}>{opt}</button>
                ))}
              </div>
           </div>
           <div className="flex justify-between items-center">
              <button disabled={aptIndex === 0} onClick={() => setAptIndex(prev => prev - 1)} className="text-slate-400 font-bold">Previous</button>
              <button onClick={() => aptIndex === 9 ? handleFinishAptitude() : setAptIndex(aptIndex + 1)} className="px-10 py-4 bg-slate-800 text-white rounded-2xl font-black">
                {aptIndex === 9 ? 'Finish' : 'Next'}
              </button>
           </div>
        </div>
      )}
    </div>
  );

  const sqlView = (
    <div className="max-w-6xl mx-auto py-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
         <div className="flex items-center justify-between mb-8">
           <button onClick={resetToSelection} className="text-slate-400 font-bold"><RotateCcw size={16} /> Exit</button>
           <LlamaBadge />
         </div>
         <h2 className="text-2xl font-black text-slate-800 mb-4">{sqlChallenge?.scenario}</h2>
         <p className="text-sm font-bold text-slate-700 leading-relaxed mb-6">{sqlChallenge?.task}</p>
         <div className="p-4 bg-slate-900 rounded-2xl font-mono text-xs text-emerald-400/80 leading-relaxed overflow-x-auto">
           {sqlChallenge?.schema}
         </div>
         {sqlResult && (
           <div className={`mt-6 p-6 rounded-2xl ${sqlResult.correct ? 'bg-emerald-50' : 'bg-rose-50'}`}>
              <div className="font-black mb-2">{sqlResult.correct ? '🎯 Correct!' : '🔨 Try Again'}</div>
              <p className="text-xs">{sqlResult.feedback}</p>
           </div>
         )}
      </div>
      <div className="bg-[#0F111A] rounded-[2.5rem] p-8 flex flex-col min-h-[500px]">
         <textarea value={userSql} onChange={e => setUserSql(e.target.value)} className="flex-1 bg-transparent border-none outline-none text-emerald-100 font-mono text-sm resize-none" placeholder="-- Write query here..." />
         <div className="pt-6 flex gap-4">
            <button onClick={startSql} className="p-4 bg-white/5 text-slate-400 rounded-2xl"><RefreshCcw size={18} /></button>
            <button onClick={validateSql} disabled={loading || !userSql} className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl font-black">
              {loading ? <Spinner size={16} /> : 'Evaluate'}
            </button>
         </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-[var(--bg-page)] font-dm-sans">
      <Sidebar />
      <main className="flex-1 h-screen overflow-y-auto overflow-x-hidden custom-scrollbar px-8">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-32">
          {mode === 'selection' && selectionScreen}
          {mode === 'interview' && interviewView}
          {mode === 'aptitude' && aptitudeView}
          {mode === 'sql' && sqlView}
        </motion.div>
      </main>
    </div>
  );
};

export default PracticeCenter;
