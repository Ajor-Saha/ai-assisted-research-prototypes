import { Router } from 'express';
import {
  createCourse,
  deleteCourse,
  getCourseById,
  getUserCourses,
  updateCourse,
} from '../controllers/course-controllers';
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

export default course_router;
