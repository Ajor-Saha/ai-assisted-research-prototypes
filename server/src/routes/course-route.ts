import { Router } from 'express';
import {
  createCourse,
  deleteCourse,
  getCourseById,
  getUserCourses,
  updateCourse,
} from '../controllers/course-controllers';
import {
  getCourseExamPatterns,
  getGeneratedExamsByCourse,
} from '../controllers/generated-exam-controllers';
import { verifyJWT } from '../middleware/auth-middleware';

const course_router = Router();

// All course routes require authentication
course_router.use(verifyJWT);

// Course CRUD routes
course_router.route('/').post(createCourse).get(getUserCourses);

course_router
  .route('/:courseId')
  .get(getCourseById)
  .put(updateCourse)
  .delete(deleteCourse);

// Course extension routes for AI generated exams
course_router.route('/:courseId/exams').get(getGeneratedExamsByCourse);
course_router.route('/:courseId/exam-patterns').get(getCourseExamPatterns);

export default course_router;
