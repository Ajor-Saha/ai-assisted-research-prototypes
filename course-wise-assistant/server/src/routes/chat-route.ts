import { Router } from 'express';
import {
  createChat,
  getCourseChats,
  getChatById,
  updateChat,
  deleteChat,
  addMessage,
  getChatMessages,
  deleteAllCourseChats,
} from '../controllers/chat-controllers';
import {
  streamAIChatResponse,
  getAIChatResponse,
} from '../controllers/chat-ai-controller';
import { verifyJWT } from '../middleware/auth-middleware';

const chat_router = Router();

// All chat routes require authentication
chat_router.use(verifyJWT);

// Chat CRUD routes
chat_router.route('/').post(createChat);

// Get all chats for a course
chat_router.route('/course/:courseId').get(getCourseChats).delete(deleteAllCourseChats);

// Single chat operations
chat_router
  .route('/:chatId')
  .get(getChatById)
  .put(updateChat)
  .delete(deleteChat);

// Chat message operations
chat_router.route('/:chatId/messages').post(addMessage).get(getChatMessages);

// AI chat response routes (with RAG)
chat_router.route('/:chatId/ai-response').post(streamAIChatResponse); // Streaming response
chat_router.route('/:chatId/ai-response-sync').post(getAIChatResponse); // Non-streaming fallback

export default chat_router;
