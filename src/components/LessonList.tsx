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
      title: 'Beginner Level',
      color: 'emerald',
      desc: 'Home row, top & bottom rows.',
      icon: Compass,
    },
    {
      id: 'intermediate',
      title: 'Intermediate Level',
      color: 'amber',
      desc: 'Rhythm, Shift, punctuation, fluency.',
      icon: Target,
    },
    {
      id: 'advanced',
      title: 'Advanced Level',
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

  const getBiomeMeta = (modNum: number) => {
    switch (modNum) {
      case 1:
        return {
          title: 'Module 1: Roots & Anchor Foundation',
          desc: 'Establish ergonomic hand posture and F & J home-row muscle memory.',
          badge: 'Biome 1 · Foundation',
        };
      case 2:
        return {
          title: 'Module 2: Home Row Trunk',
          desc: 'Build 8-finger independence across the complete home row.',
          badge: 'Biome 2 · Home Row',
        };
      case 3:
        return {
          title: 'Module 3: Canopy Reaches',
          desc: 'Extend accurate reaches to the top, bottom, and number rows.',
          badge: 'Biome 3 · Extended Rows',
        };
      case 4:
        return {
          title: 'Module 4: Sentences, Shift & Endurance',
          desc: 'Combine all rows into fluid sentences, paragraphs, and graduation tests.',
          badge: 'Biome 4 · Fluency',
        };
      case 5:
        return {
          title: 'Module 5: Numbers, Mastery & Graduation',
          desc: 'Master numbers, symbols, themed paragraphs, and final certification exams.',
          badge: 'Biome 5 · Mastery',
        };
      default:
        return {
          title: `Module ${modNum}: Specialized Growth`,
          desc: 'Targeted drills to build speed and accuracy.',
          badge: `Biome ${modNum}`,
        };
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10 animate-fadeIn">
      {/* Compact Studio Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-white/[0.08]">
        <div className="space-y-1.5">
          <p className="text-xs font-mono uppercase tracking-widest text-emerald-400">
            QWERTY Curriculum
          </p>
          <h1 className="text-2xl sm:text-3xl font-semibold text-zinc-50 tracking-tight">
            All {lessons.length} Lessons
          </h1>
        </div>

        <button
          type="button"
          onClick={onOpenAssessment}
          className="inline-flex items-center gap-2 self-start sm:self-auto px-4 py-2 rounded-lg bg-[#111113] hover:bg-zinc-900 border border-white/[0.1] text-zinc-200 font-medium text-xs transition-colors whitespace-nowrap"
        >
          <Zap className="w-3.5 h-3.5 text-emerald-400" />
          <span>Take Placement Test</span>
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
              onClick={() => setSelectedLevel(lvl.id)}
              className={`text-left relative overflow-hidden p-6 rounded-2xl border transition-all duration-200 flex flex-col justify-between ${
                isSelected
                  ? 'bg-slate-800/90 border-emerald-500 ring-2 ring-emerald-500/25 shadow-xl'
                  : 'bg-slate-900/70 hover:bg-slate-800/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="space-y-4 w-full">
                <div className="flex items-center justify-between">
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center border ${
                      lvl.color === 'emerald'
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                        : lvl.color === 'amber'
                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                        : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-mono tabular-nums text-emerald-400 font-semibold">
                    {bloomedCount}/{levelLessons.length} completed
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-white">{lvl.title}</h3>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800 w-full flex items-center justify-between text-xs font-semibold">
                <span className={isSelected ? 'text-emerald-400' : 'text-slate-400'}>
                  {isSelected ? 'Active Track' : 'View Track'}
                </span>
                <ArrowRight
                  className={`w-4 h-4 transition-transform ${
                    isSelected ? 'translate-x-1 text-emerald-400' : 'text-slate-500'
                  }`}
                />
              </div>
            </button>
          );
        })}
        </div>
      </section>

      {/* Curriculum Filter & Section Header */}
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-white capitalize">
              {selectedLevel === 'all' ? 'All Curriculum Levels' : `${selectedLevel} Level`}
            </h2>
            {selectedLevel !== 'all' && (
              <button
                type="button"
                onClick={() => setSelectedLevel('all')}
                className="text-xs text-sky-400 hover:text-sky-300 font-semibold underline"
              >
                Show All Levels
              </button>
            )}
          </div>

          {/* Accurate Segmented Filter Controls */}
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setGrowthFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap tabular-nums ${
                growthFilter === 'all'
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All ({levelScopedLessons.length})
            </button>
            <button
              type="button"
              onClick={() => setGrowthFilter('unbloomed')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap tabular-nums ${
                growthFilter === 'unbloomed'
                  ? 'bg-sky-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              To Do ({unbloomedCountInScope})
            </button>
            <button
              type="button"
              onClick={() => setGrowthFilter('bloomed')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap tabular-nums ${
                growthFilter === 'bloomed'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Completed ({bloomedCountInScope})
            </button>
          </div>
        </div>

        {/* Empty State for Filters */}
        {filteredLessons.length === 0 ? (
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-10 text-center space-y-3">
            <p className="text-base font-semibold text-white">
              {growthFilter === 'bloomed'
                ? 'No completed lessons in this track yet.'
                : 'Every lesson in this track is already complete!'}
            </p>
            <button
              type="button"
              onClick={() => setGrowthFilter('all')}
              className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white border border-slate-700 transition-colors"
            >
              Show All Lessons
            </button>
          </div>
        ) : (
          modules.map((modNum) => {
            const modLessons = filteredLessons.filter((l) => l.module === modNum);
            const biome = getBiomeMeta(modNum);
            const modCompleted = modLessons.filter(isLessonCompleted).length;
            const isExpanded = expandedModule === modNum;

            return (
              <div key={modNum} className="space-y-4">
                <button
                  type="button"
                  onClick={() => toggleModule(modNum)}
                  aria-expanded={isExpanded}
                  className="w-full text-left flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 p-4 sm:p-5 rounded-2xl transition-colors"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-base font-mono shrink-0">
                      {modNum}
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-white">{biome.title}</h3>
                      <p className="text-xs text-slate-400 mt-0.5 tabular-nums">
                        {modCompleted}/{modLessons.length} completed
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                    <span className="text-xs font-mono text-emerald-400">{biome.badge}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                        isExpanded ? 'rotate-180' : ''
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
