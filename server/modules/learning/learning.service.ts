import { Inject, Injectable } from '@nestjs/common';
import {
  DRIZZLE_DATABASE,
  type PostgresJsDatabase,
} from '@lark-apaas/fullstack-nestjs-core';
import { and, eq, lte } from 'drizzle-orm';

import { learningProgress } from '@server/database/schema';
import type {
  LearningDashboard,
  LearningProgressItem,
  ReviewRating,
  SubmitReviewResponse,
} from '@shared/api.interface';

import { VOCABULARY_CHAPTERS } from './vocabulary.data';

const REVIEW_INTERVALS_HOURS: number[] = [0, 8, 24, 48, 96, 168, 360, 720];

@Injectable()
export class LearningService {
  constructor(
    @Inject(DRIZZLE_DATABASE)
    private readonly db: PostgresJsDatabase,
  ) {}

  async getDashboard(userId: string): Promise<LearningDashboard> {
    const rows: typeof learningProgress.$inferSelect[] = await this.db
      .select()
      .from(learningProgress)
      .where(eq(learningProgress.learner, userId));
    const now: Date = new Date();
    const progress: LearningProgressItem[] = rows.map(
      (row: typeof learningProgress.$inferSelect): LearningProgressItem =>
        this.toProgressItem(row),
    );
    const dueCount: number = rows.filter(
      (row: typeof learningProgress.$inferSelect): boolean =>
        row.nextReviewAt <= now,
    ).length;
    const learnedCount: number = rows.length;
    const masteredCount: number = rows.filter(
      (row: typeof learningProgress.$inferSelect): boolean =>
        row.status === 'mastered',
    ).length;
    const activeDays: Set<string> = new Set(
      rows
        .filter((row: typeof learningProgress.$inferSelect): boolean =>
          Boolean(row.lastReviewedAt),
        )
        .map((row: typeof learningProgress.$inferSelect): string =>
          row.lastReviewedAt?.toISOString().slice(0, 10) ?? '',
        ),
    );

    return {
      chapters: VOCABULARY_CHAPTERS,
      progress,
      dueCount,
      learnedCount,
      masteredCount,
      streakDays: this.calculateStreak(activeDays, now),
    };
  }

  async submitReview(
    userId: string,
    wordKey: string,
    chapterId: number,
    rating: ReviewRating,
  ): Promise<SubmitReviewResponse> {
    const rows: typeof learningProgress.$inferSelect[] = await this.db
      .select()
      .from(learningProgress)
      .where(
        and(
          eq(learningProgress.learner, userId),
          eq(learningProgress.wordKey, wordKey),
        ),
      )
      .limit(1);
    const current: typeof learningProgress.$inferSelect | undefined = rows[0];
    const now: Date = new Date();
    const nextStage: number = this.getNextStage(current?.stage ?? 0, rating);
    const intervalHours: number = REVIEW_INTERVALS_HOURS[nextStage] ?? 720;
    const nextReviewAt: Date = new Date(now.getTime() + intervalHours * 3_600_000);
    const status: string = nextStage >= REVIEW_INTERVALS_HOURS.length - 1
      ? 'mastered'
      : 'learning';
    const correctIncrement: number = rating === 'again' ? 0 : 1;
    const wrongIncrement: number = rating === 'again' ? 1 : 0;

    if (current) {
      await this.db
        .update(learningProgress)
        .set({
          stage: nextStage,
          status,
          correctCount: current.correctCount + correctIncrement,
          wrongCount: current.wrongCount + wrongIncrement,
          lastRating: rating,
          lastReviewedAt: now,
          nextReviewAt,
          updatedAt: now,
          updatedBy: userId,
        })
        .where(eq(learningProgress.id, current.id));
    } else {
      await this.db.insert(learningProgress).values({
        learner: userId,
        wordKey,
        chapterId,
        stage: nextStage,
        status,
        correctCount: correctIncrement,
        wrongCount: wrongIncrement,
        lastRating: rating,
        lastReviewedAt: now,
        nextReviewAt,
        createdBy: userId,
        updatedBy: userId,
      });
    }

    const updated: typeof learningProgress.$inferSelect[] = await this.db
      .select()
      .from(learningProgress)
      .where(
        and(
          eq(learningProgress.learner, userId),
          eq(learningProgress.wordKey, wordKey),
        ),
      )
      .limit(1);

    return {
      progress: this.toProgressItem(updated[0]),
      nextIntervalLabel: this.formatInterval(intervalHours),
    };
  }

  async getDueCount(userId: string): Promise<number> {
    const dueRows: { id: string }[] = await this.db
      .select({ id: learningProgress.id })
      .from(learningProgress)
      .where(
        and(
          eq(learningProgress.learner, userId),
          lte(learningProgress.nextReviewAt, new Date()),
        ),
      );
    return dueRows.length;
  }

  private getNextStage(currentStage: number, rating: ReviewRating): number {
    if (rating === 'again') return 0;
    if (rating === 'hard') return Math.max(1, currentStage);
    if (rating === 'easy') {
      return Math.min(currentStage + 2, REVIEW_INTERVALS_HOURS.length - 1);
    }
    return Math.min(currentStage + 1, REVIEW_INTERVALS_HOURS.length - 1);
  }

  private formatInterval(hours: number): string {
    if (hours === 0) return '立即再复习';
    if (hours < 24) return `${hours} 小时后`;
    return `${Math.round(hours / 24)} 天后`;
  }

  private calculateStreak(activeDays: Set<string>, now: Date): number {
    let streak: number = 0;
    const cursor: Date = new Date(now);
    while (activeDays.has(cursor.toISOString().slice(0, 10))) {
      streak += 1;
      cursor.setUTCDate(cursor.getUTCDate() - 1);
    }
    return streak;
  }

  private toProgressItem(
    row: typeof learningProgress.$inferSelect,
  ): LearningProgressItem {
    return {
      wordKey: row.wordKey,
      chapterId: row.chapterId,
      stage: row.stage,
      status: row.status,
      correctCount: row.correctCount,
      wrongCount: row.wrongCount,
      lastRating: row.lastRating ?? undefined,
      lastReviewedAt: row.lastReviewedAt?.toISOString(),
      nextReviewAt: row.nextReviewAt.toISOString(),
    };
  }
}
