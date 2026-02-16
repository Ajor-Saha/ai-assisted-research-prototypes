import { Request, Response } from 'express';
import { nanoid } from 'nanoid';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/api-response';
import { db } from '../db';
import { chatTable, chatMessageTable, courseTable } from '../db/schema';
import { eq, and, desc } from 'drizzle-orm';

/**
 * Create a new chat for a course
 * @route POST /api/chats
 */
export const createChat = asyncHandler(
  async (req: Request & { user?: any }, res: Response) => {
    try {
      const userId = req.user?.userId;
      const { courseId, title } = req.body;

      if (!userId) {
        return res
          .status(401)
          .json(new ApiResponse(401, {}, 'User not authenticated'));
      }

      if (!courseId) {
        return res
          .status(400)
          .json(new ApiResponse(400, {}, 'Course ID is required'));
      }

      // Verify the course belongs to the user
      const [course] = await db
        .select()
        .from(courseTable)
        .where(
          and(
            eq(courseTable.courseId, courseId),
            eq(courseTable.userId, userId)
          )
        )
        .limit(1);

      if (!course) {
        return res
          .status(404)
          .json(new ApiResponse(404, {}, 'Course not found or access denied'));
      }

      // Create new chat
      const newChat = {
        chatId: nanoid(),
        courseId,
        userId,
        title: title?.trim() || 'New Chat',
      };

      const [createdChat] = await db
        .insert(chatTable)
        .values(newChat)
        .returning();

      return res
        .status(201)
        .json(new ApiResponse(201, createdChat, 'Chat created successfully'));
    } catch (error) {
      console.error('Error creating chat:', error);
      res
        .status(500)
        .json(new ApiResponse(500, null, 'Internal server error'));
    }
  }
);

/**
 * Get all chats for a course
 * @route GET /api/chats/course/:courseId
 */
export const getCourseChats = asyncHandler(
  async (req: Request & { user?: any }, res: Response) => {
    try {
      const userId = req.user?.userId;
      const courseId = Array.isArray(req.params.courseId) ? req.params.courseId[0] : req.params.courseId;

      if (!userId) {
        return res
          .status(401)
          .json(new ApiResponse(401, {}, 'User not authenticated'));
      }

      // Verify the course belongs to the user
      const [course] = await db
        .select()
        .from(courseTable)
        .where(
          and(
            eq(courseTable.courseId, courseId),
            eq(courseTable.userId, userId)
          )
        )
        .limit(1);

      if (!course) {
        return res
          .status(404)
          .json(new ApiResponse(404, {}, 'Course not found or access denied'));
      }

      // Get all chats for the course
      const chats = await db
        .select()
        .from(chatTable)
        .where(eq(chatTable.courseId, courseId))
        .orderBy(desc(chatTable.updatedAt));

      return res
        .status(200)
        .json(new ApiResponse(200, chats, 'Chats retrieved successfully'));
    } catch (error) {
      console.error('Error fetching chats:', error);
      res
        .status(500)
        .json(new ApiResponse(500, null, 'Internal server error'));
    }
  }
);

/**
 * Get a single chat by ID with its messages
 * @route GET /api/chats/:chatId
 */
export const getChatById = asyncHandler(
  async (req: Request & { user?: any }, res: Response) => {
    try {
      const userId = req.user?.userId;
      const chatId = Array.isArray(req.params.chatId) ? req.params.chatId[0] : req.params.chatId;

      if (!userId) {
        return res
          .status(401)
          .json(new ApiResponse(401, {}, 'User not authenticated'));
      }

      // Get chat and verify ownership
      const [chat] = await db
        .select()
        .from(chatTable)
        .where(
          and(eq(chatTable.chatId, chatId), eq(chatTable.userId, userId))
        )
        .limit(1);

      if (!chat) {
        return res
          .status(404)
          .json(new ApiResponse(404, {}, 'Chat not found or access denied'));
      }

      // Get all messages for the chat
      const messages = await db
        .select()
        .from(chatMessageTable)
        .where(eq(chatMessageTable.chatId, chatId))
        .orderBy(chatMessageTable.createdAt);

      return res.status(200).json(
        new ApiResponse(
          200,
          {
            ...chat,
            messages,
          },
          'Chat retrieved successfully'
        )
      );
    } catch (error) {
      console.error('Error fetching chat:', error);
      res
        .status(500)
        .json(new ApiResponse(500, null, 'Internal server error'));
    }
  }
);

/**
 * Update chat title
 * @route PUT /api/chats/:chatId
 */
export const updateChat = asyncHandler(
  async (req: Request & { user?: any }, res: Response) => {
    try {
      const userId = req.user?.userId;
      const chatId = Array.isArray(req.params.chatId) ? req.params.chatId[0] : req.params.chatId;
      const { title } = req.body;

      if (!userId) {
        return res
          .status(401)
          .json(new ApiResponse(401, {}, 'User not authenticated'));
      }

      if (!title || !title.trim()) {
        return res
          .status(400)
          .json(new ApiResponse(400, {}, 'Title is required'));
      }

      // Verify chat ownership
      const [existingChat] = await db
        .select()
        .from(chatTable)
        .where(
          and(eq(chatTable.chatId, chatId), eq(chatTable.userId, userId))
        )
        .limit(1);

      if (!existingChat) {
        return res
          .status(404)
          .json(new ApiResponse(404, {}, 'Chat not found or access denied'));
      }

      // Update chat
      const [updatedChat] = await db
        .update(chatTable)
        .set({ title: title.trim() })
        .where(eq(chatTable.chatId, chatId))
        .returning();

      return res
        .status(200)
        .json(new ApiResponse(200, updatedChat, 'Chat updated successfully'));
    } catch (error) {
      console.error('Error updating chat:', error);
      res
        .status(500)
        .json(new ApiResponse(500, null, 'Internal server error'));
    }
  }
);

/**
 * Delete a chat and all its messages
 * @route DELETE /api/chats/:chatId
 */
export const deleteChat = asyncHandler(
  async (req: Request & { user?: any }, res: Response) => {
    try {
      const userId = req.user?.userId;
      const chatId = Array.isArray(req.params.chatId) ? req.params.chatId[0] : req.params.chatId;

      if (!userId) {
        return res
          .status(401)
          .json(new ApiResponse(401, {}, 'User not authenticated'));
      }

      // Verify chat ownership
      const [existingChat] = await db
        .select()
        .from(chatTable)
        .where(
          and(eq(chatTable.chatId, chatId), eq(chatTable.userId, userId))
        )
        .limit(1);

      if (!existingChat) {
        return res
          .status(404)
          .json(new ApiResponse(404, {}, 'Chat not found or access denied'));
      }

      // Delete chat (messages will be cascade deleted)
      await db.delete(chatTable).where(eq(chatTable.chatId, chatId));

      return res
        .status(200)
        .json(new ApiResponse(200, {}, 'Chat deleted successfully'));
    } catch (error) {
      console.error('Error deleting chat:', error);
      res
        .status(500)
        .json(new ApiResponse(500, null, 'Internal server error'));
    }
  }
);

/**
 * Add a message to a chat
 * @route POST /api/chats/:chatId/messages
 */
export const addMessage = asyncHandler(
  async (req: Request & { user?: any }, res: Response) => {
    try {
      const userId = req.user?.userId;
      const chatId = Array.isArray(req.params.chatId) ? req.params.chatId[0] : req.params.chatId;
      const { role, content, attachments } = req.body;

      if (!userId) {
        return res
          .status(401)
          .json(new ApiResponse(401, {}, 'User not authenticated'));
      }

      if (!role || !content) {
        return res
          .status(400)
          .json(new ApiResponse(400, {}, 'Role and content are required'));
      }

      if (!['user', 'assistant'].includes(role)) {
        return res
          .status(400)
          .json(new ApiResponse(400, {}, 'Role must be "user" or "assistant"'));
      }

      // Verify chat ownership
      const [chat] = await db
        .select()
        .from(chatTable)
        .where(
          and(eq(chatTable.chatId, chatId), eq(chatTable.userId, userId))
        )
        .limit(1);

      if (!chat) {
        return res
          .status(404)
          .json(new ApiResponse(404, {}, 'Chat not found or access denied'));
      }

      // Create message
      const newMessage = {
        messageId: nanoid(),
        chatId,
        role,
        content,
        attachments: attachments || null,
      };

      const [createdMessage] = await db
        .insert(chatMessageTable)
        .values(newMessage)
        .returning();

      // Update chat's updatedAt timestamp
      await db
        .update(chatTable)
        .set({ updatedAt: new Date() })
        .where(eq(chatTable.chatId, chatId));

      return res
        .status(201)
        .json(
          new ApiResponse(201, createdMessage, 'Message added successfully')
        );
    } catch (error) {
      console.error('Error adding message:', error);
      res
        .status(500)
        .json(new ApiResponse(500, null, 'Internal server error'));
    }
  }
);

/**
 * Get messages for a chat
 * @route GET /api/chats/:chatId/messages
 */
export const getChatMessages = asyncHandler(
  async (req: Request & { user?: any }, res: Response) => {
    try {
      const userId = req.user?.userId;
      const chatId = Array.isArray(req.params.chatId) ? req.params.chatId[0] : req.params.chatId;

      if (!userId) {
        return res
          .status(401)
          .json(new ApiResponse(401, {}, 'User not authenticated'));
      }

      // Verify chat ownership
      const [chat] = await db
        .select()
        .from(chatTable)
        .where(
          and(eq(chatTable.chatId, chatId), eq(chatTable.userId, userId))
        )
        .limit(1);

      if (!chat) {
        return res
          .status(404)
          .json(new ApiResponse(404, {}, 'Chat not found or access denied'));
      }

      // Get messages
      const messages = await db
        .select()
        .from(chatMessageTable)
        .where(eq(chatMessageTable.chatId, chatId))
        .orderBy(chatMessageTable.createdAt);

      return res
        .status(200)
        .json(
          new ApiResponse(200, messages, 'Messages retrieved successfully')
        );
    } catch (error) {
      console.error('Error fetching messages:', error);
      res
        .status(500)
        .json(new ApiResponse(500, null, 'Internal server error'));
    }
  }
);

/**
 * Delete all chats for a course (optional - for cleanup)
 * @route DELETE /api/chats/course/:courseId
 */
export const deleteAllCourseChats = asyncHandler(
  async (req: Request & { user?: any }, res: Response) => {
    try {
      const userId = req.user?.userId;
      const courseId = Array.isArray(req.params.courseId) ? req.params.courseId[0] : req.params.courseId;

      if (!userId) {
        return res
          .status(401)
          .json(new ApiResponse(401, {}, 'User not authenticated'));
      }

      // Verify the course belongs to the user
      const [course] = await db
        .select()
        .from(courseTable)
        .where(
          and(
            eq(courseTable.courseId, courseId),
            eq(courseTable.userId, userId)
          )
        )
        .limit(1);

      if (!course) {
        return res
          .status(404)
          .json(new ApiResponse(404, {}, 'Course not found or access denied'));
      }

      // Delete all chats for the course
      await db.delete(chatTable).where(eq(chatTable.courseId, courseId));

      return res
        .status(200)
        .json(new ApiResponse(200, {}, 'All chats deleted successfully'));
    } catch (error) {
      console.error('Error deleting chats:', error);
      res
        .status(500)
        .json(new ApiResponse(500, null, 'Internal server error'));
    }
  }
);
