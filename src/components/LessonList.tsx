import React, { useState, useEffect } from 'react';
import { Lesson, SkillLevel, SessionResult, UserStats } from '../types';
import { LessonGrowthCard } from './LessonGrowthCard';
import { Award, ArrowRight, Zap, Compass, Target, ChevronDown } from 'lucide-react';

interface LessonListProps {
  lessons: Lesson[];
  sessionHistory: SessionResult[];
  userStats: UserStats;
  initialLevel?: SkillLevel;
  onStartLesson: (lesson: Lesson) => void;
  onOpenAssessment: () => void;
}

export const LessonList: React.FC<LessonListProps> = ({
  lessons,
  sessionHistory,
  userStats,
  initialLevel = 'beginner',
  onStartLesson,
  onOpenAssessment,
}) => {
  const [selectedLevel, setSelectedLevel] = useState<SkillLevel | 'all'>(initialLevel);
  const [growthFilter, setGrowthFilter] = useState<'all' | 'bloomed' | 'unbloomed'>('all');
  const [expandedModule, setExpandedModule] = useState<number | null>(1);

  const toggleModule = (modNum: number) => {
    setExpandedModule((prev) => (prev === modNum ? null : modNum));
  };

  useEffect(() => {
    setSelectedLevel(initialLevel);
  }, [initialLevel]);

  const levels: {
    id: SkillLevel;
    title: string;
    color: 'emerald' | 'amber' | 'rose';
    desc: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    {
      id: 'beginner',
      title: 'Beginner',
      color: 'emerald',
      desc: 'Home row, top & bottom rows.',
      icon: Compass,
    },
    {
      id: 'intermediate',
      title: 'Intermediate',
      color: 'amber',
      desc: 'Rhythm, Shift, punctuation, fluency.',
      icon: Target,
    },
    {
      id: 'advanced',
      title: 'Advanced',
      color: 'rose',
      desc: 'Code, speed bursts, endurance.',
      icon: Award,
    },
  ];

  const isLessonCompleted = (lesson: Lesson) =>
    sessionHistory.some(
      (s) => s.type === 'lesson' && s.passed && (s.itemId === lesson.id || s.title === lesson.title)
    );

  // All lessons in the currently selected level (used for accurate filter tab counts)
  const levelScopedLessons = lessons.filter(
    (l) => selectedLevel === 'all' || l.level === selectedLevel
  );
  const bloomedCountInScope = levelScopedLessons.filter(isLessonCompleted).length;
  const unbloomedCountInScope = levelScopedLessons.length - bloomedCountInScope;

  const filteredLessons = levelScopedLessons.filter((l) => {
    const completed = isLessonCompleted(l);
    if (growthFilter === 'bloomed') return completed;
    if (growthFilter === 'unbloomed') return !completed;
    return true;
  });

  // Identify the single true next uncompleted lesson in this scope
  const nextLessonId = levelScopedLessons.find((l) => !isLessonCompleted(l))?.id ?? null;

  const modules: number[] = Array.from(new Set(filteredLessons.map((l) => l.module)));

  const getBiomeMeta = (modNum: number, level: SkillLevel | 'all') => {
    if (level === 'beginner') {
      switch (modNum) {
        case 1:
          return { title: 'Foundation', badge: 'Module 1' };
        case 2:
          return { title: 'Home Row', badge: 'Module 2' };
        case 3:
          return { title: 'Top Row', badge: 'Module 3' };
        case 4:
          return { title: 'Bottom Row', badge: 'Module 4' };
        case 5:
          return { title: 'Shift & Punctuation', badge: 'Module 5' };
        case 6:
          return { title: 'Numbers & Mastery', badge: 'Module 6' };
        default:
          return { title: `Module ${modNum}`, badge: `Module ${modNum}` };
      }
    }
    if (level === 'intermediate') {
      switch (modNum) {
        case 1:
          return { title: 'Fluency & Rhythm', badge: 'Module 1' };
        case 2:
          return { title: 'Hand & Row Balance', badge: 'Module 2' };
        case 3:
          return { title: 'Shift & Punctuation', badge: 'Module 3' };
        case 4:
          return { title: 'Numbers & Symbols', badge: 'Module 4' };
        case 5:
          return { title: 'Applied Mastery', badge: 'Module 5' };
        default:
          return { title: `Module ${modNum}`, badge: `Module ${modNum}` };
      }
    }
    if (level === 'advanced') {
      switch (modNum) {
        case 1:
          return { title: 'Speed & Bigrams', badge: 'Module 1' };
        case 2:
          return { title: 'Code & Syntax', badge: 'Module 2' };
        case 3:
          return { title: 'Technical Prose', badge: 'Module 3' };
        case 4:
          return { title: 'Editorial Essays', badge: 'Module 4' };
        case 5:
          return { title: 'Mastery Sprints', badge: 'Module 5' };
        default:
          return { title: `Module ${modNum}`, badge: `Module ${modNum}` };
      }
    }
    return {
      title: `Module ${modNum}`,
      badge: `Module ${modNum}`,
    };
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 animate-fadeIn">
      {/* Compact Studio Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-zinc-200 dark:border-white/[0.08]">
        <div className="space-y-1.5">
          <p className="text-sm font-mono uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
            QWERTY Curriculum
          </p>
          <h1 className="text-3xl sm:text-4xl font-semibold text-zinc-950 dark:text-zinc-50 tracking-tight">
            Lessons
          </h1>
        </div>

        <button
          type="button"
          onClick={onOpenAssessment}
          className="inline-flex items-center gap-2 self-start sm:self-auto px-4 py-2.5 rounded-lg bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-800 dark:bg-[#111113] dark:hover:bg-zinc-900 dark:border-white/[0.1] dark:text-zinc-200 font-medium text-sm transition-colors whitespace-nowrap shadow-sm dark:shadow-none"
        >
          <Zap className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>Placement test</span>
        </button>
      </div>

      {/* Level Selector Cards */}
      <section aria-labelledby="curriculum-tracks-heading">
        <h2 id="curriculum-tracks-heading" className="sr-only">
          Touch Typing Curriculum Tracks
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {levels.map((lvl) => {
          const Icon = lvl.icon;
          const isSelected = selectedLevel === lvl.id;
          const levelLessons = lessons.filter((l) => l.level === lvl.id);
          const bloomedCount = levelLessons.filter(isLessonCompleted).length;

          return (
            <button
              key={lvl.id}
              type="button"
              onClick={() => {
                setSelectedLevel(lvl.id);
                setExpandedModule(1);
              }}
              className={`text-left relative overflow-hidden p-5 rounded-xl border transition-colors duration-150 flex flex-col justify-between shadow-sm dark:shadow-none ${
                isSelected
                  ? 'bg-white border-emerald-500/60 dark:bg-[#111113] dark:border-emerald-500/50'
                  : 'bg-white hover:bg-zinc-50 border-zinc-200 hover:border-zinc-300 dark:bg-[#111113] dark:hover:bg-zinc-900 dark:border-white/[0.08] dark:hover:border-white/[0.16]'
              }`}
            >
              <div className="space-y-3 w-full">
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-zinc-100 border border-zinc-200 text-zinc-700 dark:bg-zinc-950 dark:border-white/[0.08] dark:text-zinc-300">
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-mono tabular-nums text-emerald-600 dark:text-emerald-400 font-medium">
                    {bloomedCount}/{levelLessons.length} completed
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-zinc-950 dark:text-zinc-100">{lvl.title}</h3>
                  <p className="text-sm text-zinc-500 mt-0.5">{lvl.desc}</p>
                </div>
              </div>

              <div className="mt-5 pt-3.5 border-t border-zinc-100 dark:border-white/[0.06] w-full flex items-center justify-between text-sm font-medium">
                <span className={isSelected ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-500 dark:text-zinc-400'}>
                  {isSelected ? 'Active Track' : 'View Track'}
                </span>
                <ArrowRight
                  className={`w-3.5 h-3.5 transition-transform ${
                    isSelected ? 'translate-x-0.5 text-emerald-600 dark:text-emerald-400' : 'text-zinc-400 dark:text-zinc-500'
                  }`}
                />
              </div>
            </button>
          );
        })}
        </div>
      </section>

      {/* Curriculum Filter & Section Header */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-200 dark:border-white/[0.08] pb-4">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold text-zinc-950 dark:text-zinc-100 tracking-tight">
              {selectedLevel === 'all'
                ? 'All Tracks'
                : `${selectedLevel.charAt(0).toUpperCase()}${selectedLevel.slice(1)}`}
            </h2>
            {selectedLevel !== 'all' && (
              <button
                type="button"
                onClick={() => setSelectedLevel('all')}
                className="text-xs text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 font-medium underline"
              >
                Show all
              </button>
            )}
          </div>

          {/* Accurate Segmented Filter Controls */}
          <div className="flex items-center gap-1 bg-zinc-100 dark:bg-[#111113] p-1 rounded-lg border border-zinc-200 dark:border-white/[0.08]">
            <button
              type="button"
              onClick={() => setGrowthFilter('all')}
              className={`px-3.5 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap tabular-nums ${
                growthFilter === 'all'
                  ? 'bg-white text-zinc-950 shadow-sm dark:shadow-none dark:bg-zinc-800 dark:text-zinc-100'
                  : 'text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-200'
              }`}
            >
              All ({levelScopedLessons.length})
            </button>
            <button
              type="button"
              onClick={() => setGrowthFilter('unbloomed')}
              className={`px-3.5 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap tabular-nums ${
                growthFilter === 'unbloomed'
                  ? 'bg-white text-zinc-950 shadow-sm dark:shadow-none dark:bg-zinc-800 dark:text-zinc-100'
                  : 'text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-200'
              }`}
            >
              To Do ({unbloomedCountInScope})
            </button>
            <button
              type="button"
              onClick={() => setGrowthFilter('bloomed')}
              className={`px-3.5 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap tabular-nums ${
                growthFilter === 'bloomed'
                  ? 'bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300'
                  : 'text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-200'
              }`}
            >
              Completed ({bloomedCountInScope})
            </button>
          </div>
        </div>

        {/* Empty State for Filters */}
        {filteredLessons.length === 0 ? (
          <div className="bg-white dark:bg-[#111113] border border-zinc-200 dark:border-white/[0.08] rounded-xl p-10 text-center space-y-3">
            <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
              {growthFilter === 'bloomed'
                ? 'No completed lessons in this track yet.'
                : 'Every lesson in this track is already complete!'}
            </p>
            <button
              type="button"
              onClick={() => setGrowthFilter('all')}
              className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-900 border border-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-xs font-medium dark:text-zinc-100 dark:border-white/[0.08] transition-colors"
            >
              Show All Lessons
            </button>
          </div>
        ) : (
          modules.map((modNum) => {
            const modLessons = filteredLessons.filter((l) => l.module === modNum);
            const biome = getBiomeMeta(modNum, selectedLevel);
            const modCompleted = modLessons.filter(isLessonCompleted).length;
            const isExpanded = expandedModule === modNum;

            return (
              <div key={modNum} className="space-y-4">
                <button
                  type="button"
                  onClick={() => toggleModule(modNum)}
                  aria-expanded={isExpanded}
                  className="w-full text-left flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white hover:bg-zinc-50 border border-zinc-200 hover:border-zinc-300 dark:bg-[#111113] dark:hover:bg-zinc-900 dark:border-white/[0.08] dark:hover:border-white/[0.16] p-4 sm:p-5 rounded-xl shadow-sm dark:shadow-none transition-colors"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-9 h-9 rounded-lg bg-zinc-100 border border-zinc-200 text-emerald-600 dark:bg-zinc-950 dark:border-white/[0.08] flex items-center justify-center dark:text-emerald-400 font-semibold text-sm font-mono shrink-0">
                      {modNum}
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-semibold text-zinc-900 dark:text-zinc-100">{biome.title}</h3>
                      <p className="text-sm text-zinc-500 mt-0.5 tabular-nums font-mono">
                        {modCompleted}/{modLessons.length} completed
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                    <span className="text-sm font-mono text-zinc-500 dark:text-zinc-400">{biome.badge}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-zinc-400 dark:text-zinc-500 transition-transform duration-200 ${
                        isExpanded ? 'rotate-180 text-zinc-700 dark:text-zinc-200' : ''
                      }`}
                    />
                  </div>
                </button>

                {isExpanded && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {modLessons.map((lesson, idx) => (
                      <LessonGrowthCard
                        key={lesson.id}
                        lesson={lesson}
                        index={idx}
                        sessionHistory={sessionHistory}
                        onStartLesson={onStartLesson}
                        isNextToGrow={lesson.id === nextLessonId}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
