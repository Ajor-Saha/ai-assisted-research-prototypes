import { Router } from 'express';
import {
  abandonExamSession,
  getExamSessionById,
  getExamSessionRemainingTime,
  getExamSessions,
  saveExamSessionAnswers,
  selectExamQuestions,
  startExamSession,
  submitExamSession,
} from '../controllers/exam-session-controllers';
import { verifyJWT } from '../middleware/auth-middleware';

const exam_session_router = Router();

exam_session_router.use(verifyJWT);

exam_session_router.post('/', startExamSession);
exam_session_router.get('/', getExamSessions);
exam_session_router.get('/:id/time', getExamSessionRemainingTime);
exam_session_router.get('/:id', getExamSessionById);
exam_session_router.put('/:id/answers', saveExamSessionAnswers);
exam_session_router.put('/:id/select-questions', selectExamQuestions);
exam_session_router.post('/:id/submit', submitExamSession);
exam_session_router.post('/:id/abandon', abandonExamSession);

export default exam_session_router;
