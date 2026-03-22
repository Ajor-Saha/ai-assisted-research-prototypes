import { Router } from 'express';
import {
  getLatestStudyPathByCourse,
  regenerateStudyPathByCourse,
} from '../controllers/study-path-controllers';
import { verifyJWT } from '../middleware/auth-middleware';

const study_path_router = Router();

study_path_router.use(verifyJWT);

study_path_router.route('/course/:courseId').get(getLatestStudyPathByCourse);
study_path_router.route('/course/:courseId/regenerate').post(regenerateStudyPathByCourse);

export default study_path_router;
