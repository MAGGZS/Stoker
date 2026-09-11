import { Router } from 'express';
import { feedbackController } from '../controllers/feedback.controller';
import { authenticate } from '../middlewares/authenticate';

const router = Router();

router.use(authenticate);
router.post('/', (req, res, next) => feedbackController.create(req, res).catch(next));

export default router;
