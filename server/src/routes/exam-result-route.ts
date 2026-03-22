import { Router } from 'express';
import {
  evaluateExamSession,
  getExamResultBreakdown,
  getExamResultById,
  getExamResults,
} from '../controllers/exam-result-controllers';
import { verifyJWT } from '../middleware/auth-middleware';

const exam_result_router = Router();

exam_result_router.use(verifyJWT);

exam_result_router.get('/', getExamResults);
exam_result_router.get('/:id/breakdown', getExamResultBreakdown);
exam_result_router.get('/:id', getExamResultById);
exam_result_router.post('/:sessionId/evaluate', evaluateExamSession);

export default exam_result_router;
