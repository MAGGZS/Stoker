import { prisma } from '../lib/prisma';
import { FeedbackType, FeedbackStatus } from '@prisma/client';
import { ValidationError } from '../utils/errors';

export interface CreateFeedbackInput {
  type?: FeedbackType;
  title: string;
  message: string;
  rating?: number;
}

export class FeedbackService {
  async createFeedback(userId: string | undefined, input: CreateFeedbackInput) {
    if (!input.title || input.title.trim().length < 3) {
      throw new ValidationError('O título do feedback deve ter pelo menos 3 caracteres.');
    }
    if (!input.message || input.message.trim().length < 5) {
      throw new ValidationError('A mensagem do feedback deve ter pelo menos 5 caracteres.');
    }

    let userName: string | undefined;
    let userEmail: string | undefined;

    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, email: true },
      });
      if (user) {
        userName = user.name;
        userEmail = user.email;
      }
    }

    const feedback = await prisma.feedback.create({
      data: {
        user_id: userId || null,
        user_name: userName,
        user_email: userEmail,
        type: input.type || FeedbackType.SUGGESTION,
        title: input.title.trim(),
        message: input.message.trim(),
        rating: input.rating ? Math.min(Math.max(input.rating, 1), 5) : null,
        status: FeedbackStatus.PENDING,
      },
    });

    return feedback;
  }
}

export const feedbackService = new FeedbackService();
