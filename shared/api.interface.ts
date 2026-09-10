export interface VocabularyWord {
  key: string;
  word: string;
  phonetic: string;
  partOfSpeech: string;
  meaning: string;
  example: string;
  exampleMeaning: string;
  memoryTip: string;
}

export interface VocabularyChapter {
  id: number;
  title: string;
  subtitle: string;
  wordCount: number;
  words: VocabularyWord[];
}

export type ReviewRating = 'again' | 'hard' | 'good' | 'easy';

export interface LearningProgressItem {
  wordKey: string;
  chapterId: number;
  stage: number;
  status: string;
  correctCount: number;
  wrongCount: number;
  lastRating?: string;
  lastReviewedAt?: string;
  nextReviewAt: string;
}

export interface LearningDashboard {
  isAnonymous: boolean;
  chapters: VocabularyChapter[];
  progress: LearningProgressItem[];
  dueCount: number;
  learnedCount: number;
  masteredCount: number;
  streakDays: number;
}

export interface SubmitReviewRequest {
  wordKey: string;
  chapterId: number;
  rating: ReviewRating;
}

export interface SubmitReviewResponse {
  progress: LearningProgressItem;
  nextIntervalLabel: string;
}
