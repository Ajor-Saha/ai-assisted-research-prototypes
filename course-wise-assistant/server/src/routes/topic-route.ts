import { Router } from 'express';
import {
  createTopic,
  deleteTopic,
  getTopicById,
  getCourseTopics,
  updateTopic,
} from '../controllers/topic-controllers';
import { verifyJWT } from '../middleware/auth-middleware';

const topic_router = Router();

// All topic routes require authentication
topic_router.use(verifyJWT);

// Topic CRUD routes
topic_router.route('/').post(createTopic);

// Get all topics for a specific course
topic_router.route('/course/:courseId').get(getCourseTopics);

// Topic operations by ID
topic_router
  .route('/:topicId')
  .get(getTopicById)
  .put(updateTopic)
  .delete(deleteTopic);

export default topic_router;
