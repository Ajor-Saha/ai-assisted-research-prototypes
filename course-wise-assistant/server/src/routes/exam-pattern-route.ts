import { Router } from 'express';
import {
  createExamPattern,
  deleteExamPattern,
  getAllExamPatterns,
  getExamPatternById,
  updateExamPattern,
} from '../controllers/exam-pattern-controllers';
import { verifyAdmin } from '../middleware/admin-middleware';
import { verifyJWT } from '../middleware/auth-middleware';

const exam_pattern_router = Router();

// All exam pattern routes require authentication
exam_pattern_router.use(verifyJWT);

// Public exam pattern routes (authenticated users)
exam_pattern_router.route('/').get(getAllExamPatterns);

exam_pattern_router.route('/:id').get(getExamPatternById);

// Admin-only exam pattern routes
exam_pattern_router.route('/').post(verifyAdmin, createExamPattern);

exam_pattern_router
  .route('/:id')
  .put(verifyAdmin, updateExamPattern)
  .delete(verifyAdmin, deleteExamPattern);

export default exam_pattern_router;
