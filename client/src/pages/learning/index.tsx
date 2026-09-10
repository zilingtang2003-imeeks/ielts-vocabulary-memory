import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  BookOpen,
  Brain,
  Check,
  ChevronRight,
  Clock3,
  Flame,
  Headphones,
  RotateCcw,
  Sparkles,
  Target,
  Trophy,
} from 'lucide-react';
import { toast } from 'sonner';

import { getDashboard, submitReview } from '@/api/learning';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import type {
  LearningDashboard,
  LearningProgressItem,
  ReviewRating,
  VocabularyChapter,
  VocabularyWord,
} from '@shared/api.interface';

type ViewMode = 'dashboard' | 'study';

interface RatingOption {
  rating: ReviewRating;
  label: string;
  hint: string;
  className: string;
}

const RATING_OPTIONS: RatingOption[] = [
  { rating: 'again', label: '忘记', hint: '立即重来', className: 'border-rose-200 text-rose-700 hover:bg-rose-50' },
  { rating: 'hard', label: '模糊', hint: '保持当前阶段', className: 'border-amber-200 text-amber-700 hover:bg-amber-50' },
  { rating: 'good', label: '记得', hint: '进入下一阶段', className: 'border-teal-200 text-teal-700 hover:bg-teal-50' },
  { rating: 'easy', label: '熟练', hint: '跨越两个阶段', className: 'border-indigo-200 text-indigo-700 hover:bg-indigo-50' },
];

const LearningPage: React.FC = () => {
  const [dashboard, setDashboard] = useState<LearningDashboard | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
  const [chapter, setChapter] = useState<VocabularyChapter | null>(null);
  const [wordIndex, setWordIndex] = useState<number>(0);
  const [revealed, setRevealed] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);

  useEffect((): void => {
    void loadDashboard();
  }, []);

  const progressMap: Map<string, LearningProgressItem> = useMemo(
    (): Map<string, LearningProgressItem> =>
      new Map(
        (dashboard?.progress ?? []).map(
          (item: LearningProgressItem): [string, LearningProgressItem] => [
            item.wordKey,
            item,
          ],
        ),
      ),
    [dashboard],
  );

  const currentWord: VocabularyWord | undefined = chapter?.words[wordIndex];
  const totalWords: number = dashboard?.chapters.reduce(
    (sum: number, item: VocabularyChapter): number => sum + item.wordCount,
    0,
  ) ?? 0;
  const overallPercent: number = totalWords > 0
    ? Math.round(((dashboard?.learnedCount ?? 0) / totalWords) * 100)
    : 0;

  const loadDashboard = async (): Promise<void> => {
    setLoading(true);
    try {
      const data: LearningDashboard = await getDashboard();
      setDashboard(data);
    } catch (error) {
      toast.error(`无法加载学习数据：${String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  const startChapter = (selectedChapter: VocabularyChapter): void => {
    setChapter(selectedChapter);
    setWordIndex(0);
    setRevealed(false);
    setViewMode('study');
  };

  const startDueReview = (): void => {
    const firstChapter: VocabularyChapter | undefined = dashboard?.chapters.find(
      (item: VocabularyChapter): boolean =>
        item.words.some((word: VocabularyWord): boolean => {
          const progress: LearningProgressItem | undefined = progressMap.get(word.key);
          return Boolean(progress && new Date(progress.nextReviewAt) <= new Date());
        }),
    );
    const selectedChapter: VocabularyChapter | undefined =
      firstChapter ?? dashboard?.chapters[0];
    if (selectedChapter) startChapter(selectedChapter);
  };

  const speakWord = (): void => {
    if (!currentWord || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance: SpeechSynthesisUtterance = new SpeechSynthesisUtterance(
      currentWord.word,
    );
    utterance.lang = 'en-GB';
    utterance.rate = 0.86;
    window.speechSynthesis.speak(utterance);
  };

  const rateWord = async (rating: ReviewRating): Promise<void> => {
    if (!chapter || !currentWord || saving) return;
    setSaving(true);
    try {
      const response = await submitReview({
        wordKey: currentWord.key,
        chapterId: chapter.id,
        rating,
      });
      setDashboard((current: LearningDashboard | null): LearningDashboard | null => {
        if (!current) return current;
        const withoutCurrent: LearningProgressItem[] = current.progress.filter(
          (item: LearningProgressItem): boolean => item.wordKey !== currentWord.key,
        );
        return {
          ...current,
          progress: [...withoutCurrent, response.progress],
          learnedCount: current.progress.some(
            (item: LearningProgressItem): boolean => item.wordKey === currentWord.key,
          )
            ? current.learnedCount
            : current.learnedCount + 1,
        };
      });
      toast.success(`已安排${response.nextIntervalLabel}复习`);
      if (wordIndex < chapter.words.length - 1) {
        setWordIndex((current: number): number => current + 1);
        setRevealed(false);
      } else {
        setViewMode('dashboard');
        toast.success('本章学习完成');
        void loadDashboard();
      }
    } catch (error) {
      toast.error(`保存失败：${String(error)}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !dashboard) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f4f1ea]">
        <div className="flex items-center gap-3 text-stone-600">
          <Brain className="size-6 animate-pulse text-[#d65a31]" />
          <span>正在准备今日词汇...</span>
        </div>
      </main>
    );
  }

  if (viewMode === 'study' && chapter && currentWord) {
    return (
      <main className="min-h-screen bg-[#f4f1ea] px-4 py-5 text-stone-900 sm:px-8 sm:py-8">
        <div className="mx-auto max-w-5xl">
          <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <Button variant="ghost" onClick={(): void => setViewMode('dashboard')}>
              <ArrowLeft className="size-4" /> 返回章节
            </Button>
            <div className="text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#d65a31]">
                Chapter {chapter.id}
              </p>
              <p className="font-medium text-stone-700">{chapter.title}</p>
            </div>
            <Badge variant="outline" className="border-stone-300 bg-white/70">
              {wordIndex + 1} / {chapter.words.length}
            </Badge>
          </header>

          <Progress
            value={((wordIndex + 1) / chapter.words.length) * 100}
            className="mb-8 h-1.5 bg-stone-200"
          />

          <motion.section
            key={currentWord.key}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="overflow-hidden rounded-[2rem] border border-stone-200 bg-[#fffdf8] shadow-[0_28px_70px_-35px_rgba(77,52,38,0.35)]"
          >
            <div className="border-b border-stone-100 px-6 py-5 sm:px-10">
              <div className="flex items-center justify-between gap-4">
                <Badge className="bg-[#243b53] text-white">{currentWord.partOfSpeech}</Badge>
                <Button variant="ghost" size="icon" onClick={speakWord} aria-label="播放发音">
                  <Headphones className="size-5 text-[#d65a31]" />
                </Button>
              </div>
              <h1 className="mt-8 break-words font-serif text-5xl font-semibold tracking-tight sm:text-7xl">
                {currentWord.word}
              </h1>
              <p className="mt-3 font-mono text-base text-stone-500">{currentWord.phonetic}</p>
            </div>

            <div className="min-h-72 px-6 py-8 sm:px-10">
              {!revealed ? (
                <div className="flex min-h-56 flex-col items-center justify-center text-center">
                  <p className="max-w-md text-lg leading-relaxed text-stone-500">
                    先在脑中回忆它的含义，再查看答案。主动提取会让记忆更牢固。
                  </p>
                  <Button
                    className="mt-8 bg-[#d65a31] text-white"
                    onClick={(): void => setRevealed(true)}
                    data-ai-section-type="button"
                  >
                    显示释义 <ChevronRight className="size-4" />
                  </Button>
                </div>
              ) : (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <h2 className="text-3xl font-semibold text-[#243b53]">{currentWord.meaning}</h2>
                  {currentWord.example && (
                    <div className="mt-7 rounded-2xl bg-[#f4f1ea] p-5">
                      <p className="font-serif text-xl leading-relaxed">{currentWord.example}</p>
                      <p className="mt-2 text-sm leading-relaxed text-stone-500">
                        {currentWord.exampleMeaning}
                      </p>
                    </div>
                  )}
                  <div className="mt-5 flex items-start gap-3 text-sm text-stone-600">
                    <Sparkles className="mt-0.5 size-4 shrink-0 text-[#d65a31]" />
                    <p><span className="font-semibold">记忆钩子：</span>{currentWord.memoryTip}</p>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.section>

          {revealed && (
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {RATING_OPTIONS.map((option: RatingOption) => (
                <Button
                  key={option.rating}
                  variant="outline"
                  disabled={saving}
                  className={`h-auto flex-col gap-1 py-4 ${option.className}`}
                  onClick={(): void => { void rateWord(option.rating); }}
                  data-ai-section-type="button"
                >
                  <span className="font-semibold">{option.label}</span>
                  <span className="text-[11px] font-normal opacity-70">{option.hint}</span>
                </Button>
              ))}
            </div>
          )}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f4f1ea] text-stone-900">
      <div className="border-b border-stone-200 bg-[#fffdf8]">
        <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:py-12">
          <div className="flex flex-wrap items-start justify-between gap-8">
            <div>
              <div className="mb-5 flex items-center gap-3">
                <div className="grid size-10 place-items-center rounded-xl bg-[#d65a31] text-white">
                  <BookOpen className="size-5" />
                </div>
                <span className="text-sm font-semibold tracking-wide text-stone-500">IELTS VOCABULARY</span>
              </div>
              <h1 className="max-w-2xl font-serif text-4xl font-semibold leading-tight tracking-tight sm:text-6xl">
                让每一次复习，<br />都发生在快要忘记之前。
              </h1>
              <p className="mt-5 max-w-xl leading-relaxed text-stone-600">
                基于《雅思词汇真经》按章节学习，由艾宾浩斯间隔算法安排下一次复习。
              </p>
            </div>
            <div className="rounded-3xl bg-[#243b53] p-6 text-white shadow-xl sm:min-w-72">
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <Clock3 className="size-4" /> 今日待复习
              </div>
              <p className="mt-3 text-5xl font-semibold">{dashboard.dueCount}</p>
              <Button
                className="mt-6 w-full bg-[#f5c26b] text-[#243b53]"
                onClick={startDueReview}
                data-ai-section-type="button"
              >
                开始今日任务 <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" data-ai-section-type="card-stat">
          {[
            { icon: Target, label: '已学词汇', value: dashboard.learnedCount, suffix: ` / ${totalWords}` },
            { icon: Trophy, label: '完全掌握', value: dashboard.masteredCount, suffix: ' 个' },
            { icon: Flame, label: '连续学习', value: dashboard.streakDays, suffix: ' 天' },
            { icon: Brain, label: '整体进度', value: overallPercent, suffix: '%' },
          ].map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-stone-200 bg-white/75 p-5">
              <stat.icon className="size-5 text-[#d65a31]" />
              <p className="mt-5 text-sm text-stone-500">{stat.label}</p>
              <p className="mt-1 text-2xl font-semibold">{stat.value}<span className="text-sm font-normal text-stone-400">{stat.suffix}</span></p>
            </div>
          ))}
        </section>

        <section className="mt-10">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#d65a31]">Book chapters</p>
              <h2 className="mt-2 font-serif text-3xl font-semibold">按章节学习</h2>
            </div>
            <p className="text-sm text-stone-500">先理解主题语境，再建立词汇网络</p>
          </div>
          <div className="grid gap-5 lg:grid-cols-2" data-ai-section-type="card-list">
            {dashboard.chapters.map((item: VocabularyChapter) => {
              const learned: number = item.words.filter(
                (word: VocabularyWord): boolean => progressMap.has(word.key),
              ).length;
              const percent: number = Math.round((learned / item.wordCount) * 100);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={(): void => startChapter(item)}
                  className="group rounded-3xl border border-stone-200 bg-[#fffdf8] p-6 text-left transition duration-300 hover:-translate-y-1 hover:border-[#d65a31]/40 hover:shadow-xl"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex gap-4">
                      <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[#243b53] font-serif text-lg text-white">
                        {String(item.id).padStart(2, '0')}
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold">{item.title}</h3>
                        <p className="mt-1 text-sm text-stone-500">{item.subtitle}</p>
                      </div>
                    </div>
                    <ChevronRight className="size-5 text-stone-300 transition group-hover:translate-x-1 group-hover:text-[#d65a31]" />
                  </div>
                  <div className="mt-7 flex items-center gap-4">
                    <Progress value={percent} className="h-1.5 flex-1 bg-stone-200" />
                    <span className="text-xs font-medium text-stone-500">{learned}/{item.wordCount}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <section className="mt-10 flex flex-wrap items-center justify-between gap-5 rounded-3xl border border-[#f5c26b] bg-[#fff4dc] p-6">
          <div className="flex items-center gap-4">
            <div className="grid size-11 place-items-center rounded-full bg-[#f5c26b] text-[#243b53]">
              <RotateCcw className="size-5" />
            </div>
            <div>
              <h3 className="font-semibold">复习节奏已自动安排</h3>
              <p className="mt-1 text-sm text-stone-600">即时、8 小时、1 天、2 天、4 天、7 天、15 天、30 天</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm font-medium text-teal-700">
            <Check className="size-4" /> 学习记录自动保存
          </div>
        </section>
      </div>
    </main>
  );
};

export default LearningPage;
