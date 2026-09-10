import { logger } from '@lark-apaas/client-toolkit/logger';
import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';

import type {
  LearningDashboard,
  SubmitReviewRequest,
  SubmitReviewResponse,
} from '@shared/api.interface';

export async function getDashboard(): Promise<LearningDashboard> {
  try {
    const response = await axiosForBackend({
      url: '/api/learning/dashboard',
      method: 'GET',
    });
    return response.data as LearningDashboard;
  } catch (error) {
    logger.error(`获取学习数据失败: ${String(error)}`);
    throw error;
  }
}

export async function submitReview(
  request: SubmitReviewRequest,
): Promise<SubmitReviewResponse> {
  try {
    const response = await axiosForBackend({
      url: '/api/learning/review',
      method: 'POST',
      data: request,
    });
    return response.data as SubmitReviewResponse;
  } catch (error) {
    logger.error(`保存复习结果失败: ${String(error)}`);
    throw error;
  }
}
