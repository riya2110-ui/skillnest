import React, { useState } from 'react';
import { Lock, CheckCircle2, ChevronDown, ChevronUp, Youtube, FileText, BookOpen, Code2, Award, Sparkles, ExternalLink } from 'lucide-react';

const resourceIcons = {
  youtube_playlist: { icon: Youtube, color: 'text-red-500', bg: 'bg-red-50', label: '📺 Video' },
  worksheet: { icon: FileText, color: 'text-blue-500', bg: 'bg-blue-50', label: '📄 Article' },
  docs: { icon: BookOpen, color: 'text-emerald-500', bg: 'bg-emerald-50', label: '📚 Docs' },
  practice: { icon: Code2, color: 'text-amber-500', bg: 'bg-amber-50', label: '🏋️ Practice' },
  cheatsheet: { icon: Award, color: 'text-purple-500', bg: 'bg-purple-50', label: '📋 Cheat Sheet' },
};

const RoadmapCard = ({ week, focus, tasks, resources, project, isUnlocked, isCurrent, isCompleted, onTaskComplete, onQuizStart }) => {
  const [isOpen, setIsOpen] = useState(isCurrent || isCompleted);

  const getStatusColor = () => {
    if (isCompleted) return { circle: 'bg-[#E1F5EE]', text: 'text-[#085041]', border: 'border-[#1D9E7520]', accent: '#1D9E75' };
    if (isCurrent) return { circle: 'bg-[#F0EDFF]', text: 'text-[#3C3489]', border: 'border-[#7F77DD40]', accent: '#7F77DD' };
    return { circle: 'bg-slate-50', text: 'text-slate-400', border: 'border-slate-100', accent: '#94a3b8' };
  };

  const styles = getStatusColor();

  // Group resources by type
  const groupedResources = (resources || []).reduce((acc, r) => {
    const type = r.type || 'docs';
    if (!acc[type]) acc[type] = [];
    acc[type].push(r);
    return acc;
  }, {});

  return (
    <div className="relative pl-12 pb-12 last:pb-0">
      {/* Timeline Line */}
      <div className="absolute left-[23px] top-12 bottom-0 w-0.5 bg-slate-100 -z-10" />
      
      {/* Week Circle Indicator */}
      <div 
        className={`absolute left-0 top-0 w-12 h-12 rounded-full border-2 flex items-center justify-center z-10 transition-all ${
          isCompleted ? 'bg-[#E1F5EE] border-[#1D9E75] text-[#1D9E75]' : 
          isCurrent ? 'bg-[#F0EDFF] border-[#7F77DD] text-[#7F77DD] shadow-lg shadow-[#7F77DD20]' : 
          'bg-white border-slate-200 text-slate-400'
        }`}
      >
        {isCompleted ? <CheckCircle2 size={24} /> : <span className="font-black text-lg">{week}</span>}
      </div>

      <div 
        className={`bg-white rounded-3xl border transition-all overflow-hidden ${styles.border} ${isCurrent ? 'shadow-xl shadow-[#7F77DD10]' : 'shadow-sm'}`}
      >
        <div 
          className="p-6 cursor-pointer flex items-center justify-between"
          onClick={() => setIsOpen(!isOpen)}
        >
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className={`text-[10px] font-black uppercase tracking-widest ${styles.text} opacity-60`}>Week {week}</span>
              {isCompleted && <span className="bg-[#E1F5EE] text-[#1D9E75] text-[9px] font-black px-2 py-0.5 rounded uppercase">Done</span>}
              {isCurrent && <span className="bg-[#F0EDFF] text-[#7F77DD] text-[9px] font-black px-2 py-0.5 rounded uppercase">Current</span>}
            </div>
            <h3 className={`text-xl font-bold ${isUnlocked ? 'text-slate-900' : 'text-slate-400'}`}>{focus}</h3>
          </div>
          
          <div className="flex items-center gap-4">
            {!isUnlocked && <Lock size={18} className="text-slate-300" />}
            {isUnlocked && (isOpen ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />)}
          </div>
        </div>

        {isOpen && isUnlocked && (
          <div className="px-6 pb-6 pt-0 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="h-px bg-slate-50 w-full mb-6" />
            
            {/* Tasks with Quiz Button */}
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">📝 Tasks to Complete</h4>
            <ul className="space-y-3 mb-8">
              {tasks.map((task, idx) => {
                const taskText = typeof task === 'string' ? task : (task.task || task.text || task.name || '');
                const isTaskDone = !!task.completed;
                const quizScore = task.quizScore;
                return (
                  <li key={idx} className="flex gap-3 items-start group">
                    <button
                      onClick={() => {
                        if (!isTaskDone && onQuizStart) {
                          onQuizStart(idx, taskText);
                        }
                      }}
                      disabled={isTaskDone}
                      className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                        isTaskDone 
                          ? 'bg-[#1D9E75] border-[#1D9E75] text-white cursor-default' 
                          : 'border-slate-300 hover:border-[#7F77DD] hover:bg-[#F0EDFF] cursor-pointer'
                      }`}
                    >
                      {isTaskDone && <CheckCircle2 size={12} strokeWidth={4} />}
                    </button>
                    <div className="flex-1">
                      <span className={`text-[15px] font-medium leading-tight select-none transition-all ${
                        isTaskDone ? 'text-slate-400 line-through' : 'text-slate-600 group-hover:text-slate-900'
                      }`}>
                        {taskText}
                      </span>
                      {isTaskDone && quizScore !== undefined && (
                        <span className="ml-2 text-[10px] font-black bg-[#E1F5EE] text-[#1D9E75] px-2 py-0.5 rounded">
                          Quiz: {quizScore}/5
                        </span>
                      )}
                      {!isTaskDone && (
                        <button
                          onClick={() => onQuizStart && onQuizStart(idx, taskText)}
                          className="ml-2 text-[10px] font-black bg-[#F0EDFF] text-[#7F77DD] px-2.5 py-1 rounded hover:bg-[#7F77DD] hover:text-white transition-all inline-flex items-center gap-1"
                        >
                          <Sparkles size={10} /> Take Quiz to Complete
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>

            {/* Project */}
            {project && (
              <div className="bg-gradient-to-r from-[#F0EDFF] to-[#E8E4FF] rounded-2xl p-5 mb-6 border border-[#7F77DD20]">
                <div className="text-[10px] font-black uppercase tracking-widest text-[#7F77DD] mb-2">🚀 Week Project</div>
                <p className="text-[#3C3489] font-bold text-sm">{project}</p>
              </div>
            )}

            {/* Resources Section */}
            {Object.keys(groupedResources).length > 0 && (
              <div>
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">📚 Learning Resources</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(resources || []).map((r, idx) => {
                    const config = resourceIcons[r.type] || resourceIcons.docs;
                    const Icon = config.icon;
                    return (
                      <a
                        key={idx}
                        href={r.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex items-start gap-3 p-3.5 rounded-2xl border border-slate-100 hover:border-[#7F77DD40] hover:shadow-md transition-all group bg-white`}
                      >
                        <div className={`w-9 h-9 rounded-xl ${config.bg} flex items-center justify-center shrink-0`}>
                          <Icon size={16} className={config.color} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5">{config.label}</div>
                          <p className="text-xs font-bold text-slate-700 leading-snug line-clamp-2 group-hover:text-[#7F77DD] transition-colors">{r.title}</p>
                        </div>
                        <ExternalLink size={14} className="text-slate-300 group-hover:text-[#7F77DD] shrink-0 mt-1" />
                      </a>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default RoadmapCard;
