import { Request, Response } from 'express';
import { feedbackService } from '../services/feedback.service';

export class FeedbackController {
  async create(req: Request, res: Response) {
    const userId = req.user?.id;
    const { type, title, message, rating } = req.body;

    const feedback = await feedbackService.createFeedback(userId, {
      type,
      title,
      message,
      rating: rating ? Number(rating) : undefined,
    });

    res.status(201).json({
      message: 'Feedback enviado com sucesso! Agradecemos sua contribuição.',
      data: feedback,
    });
  }
}

export const feedbackController = new FeedbackController();
