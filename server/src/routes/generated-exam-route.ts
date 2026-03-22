import { Router } from 'express';
import {
  deleteGeneratedExam,
  generateExam,
  getGeneratedExamById,
  getGeneratedExamFullById,
  getGeneratedExams,
} from '../controllers/generated-exam-controllers';
import { verifyJWT } from '../middleware/auth-middleware';

const generated_exam_router = Router();

generated_exam_router.use(verifyJWT);

generated_exam_router.post('/generate', generateExam);
generated_exam_router.get('/', getGeneratedExams);
generated_exam_router.get('/:id/full', getGeneratedExamFullById);
generated_exam_router.get('/:id', getGeneratedExamById);
generated_exam_router.delete('/:id', deleteGeneratedExam);

export default generated_exam_router;
