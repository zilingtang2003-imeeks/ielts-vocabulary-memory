import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import { NeedLogin } from '@lark-apaas/fullstack-nestjs-core';
import type { Request } from 'express';

import type {
  LearningDashboard,
  SubmitReviewRequest,
  SubmitReviewResponse,
} from '@shared/api.interface';

import { LearningService } from './learning.service';

@Controller('api/learning')
export class LearningController {
  constructor(private readonly learningService: LearningService) {}

  @Get('dashboard')
  async getDashboard(@Req() req: Request): Promise<LearningDashboard> {
    return this.learningService.getDashboard(req.userContext?.userId);
  }

  @NeedLogin()
  @Post('review')
  async submitReview(
    @Req() req: Request,
    @Body() request: SubmitReviewRequest,
  ): Promise<SubmitReviewResponse> {
    return this.learningService.submitReview(
      req.userContext.userId,
      request.wordKey,
      request.chapterId,
      request.rating,
    );
  }
}
