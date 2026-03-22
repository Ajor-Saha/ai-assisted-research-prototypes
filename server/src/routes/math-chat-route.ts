import { Router } from 'express';
import {
  createMathChat,
  getUserMathChats,
  getMathChatById,
  updateMathChat,
  deleteMathChat,
  addMathChatMessage,
  streamMathAIResponse,
  translateToBangla,
  banglaTextToSpeech,
} from '../controllers/math-ai-controllers';
import { verifyJWT } from '../middleware/auth-middleware';

const math_chat_router = Router();

// All math chat routes require authentication
math_chat_router.use(verifyJWT);

// Translation route
math_chat_router.route('/translate')
  .post(translateToBangla); // Translate content to Bangla

// Text-to-Speech route
math_chat_router.route('/text-to-speech')
  .post(banglaTextToSpeech); // Convert Bangla text to speech

// Math Chat CRUD routes
math_chat_router.route('/')
  .post(createMathChat)  // Create new math chat
  .get(getUserMathChats); // Get all math chats for the user

// Single math chat operations
math_chat_router
  .route('/:chatId')
  .get(getMathChatById)   // Get chat with messages
  .put(updateMathChat)    // Update chat title
  .delete(deleteMathChat); // Delete chat

// Math chat message operations
math_chat_router.route('/:chatId/messages')
  .post(addMathChatMessage); // Add message manually

// AI math response route (streaming with step-by-step solutions)
math_chat_router.route('/:chatId/stream')
  .post(streamMathAIResponse); // Stream AI math solution

export default math_chat_router;
