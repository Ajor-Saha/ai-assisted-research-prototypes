import { eq, and } from 'drizzle-orm';
import { Request, Response } from 'express';
import { nanoid } from 'nanoid';
import { db } from '../db';
import { topicTable, courseTable } from '../db/schema';
import { ApiResponse } from '../utils/api-response';
import { asyncHandler } from '../utils/asyncHandler';

// Create a new topic
export const createTopic = asyncHandler(
  async (req: Request & { user?: any }, res: Response) => {
    try {
      const { courseId, name, description, content, orderIndex } = req.body;
      const userId = req.user?.userId;

      // Validate required fields
      if (!name || name.trim() === '') {
        return res
          .status(400)
          .json(new ApiResponse(400, {}, 'Topic name is required'));
      }

      if (!courseId) {
        return res
          .status(400)
          .json(new ApiResponse(400, {}, 'Course ID is required'));
      }

      if (!userId) {
        return res
          .status(401)
          .json(new ApiResponse(401, {}, 'User not authenticated'));
      }

      // Verify the course belongs to the user
      const [course] = await db
        .select()
        .from(courseTable)
        .where(eq(courseTable.courseId, courseId));

      if (!course) {
        return res
          .status(404)
          .json(new ApiResponse(404, {}, 'Course not found'));
      }

      if (course.userId !== userId) {
        return res
          .status(403)
          .json(
            new ApiResponse(403, {}, 'You are not authorized to add topics to this course')
          );
      }

      // Create new topic
      const newTopic = {
        topicId: nanoid(),
        courseId,
        name: name.trim(),
        description: description?.trim() || null,
        content: content?.trim() || null,
        orderIndex: orderIndex || 0,
      };

      const [createdTopic] = await db
        .insert(topicTable)
        .values(newTopic)
        .returning();

      return res
        .status(201)
        .json(
          new ApiResponse(201, createdTopic, 'Topic created successfully')
        );
    } catch (error) {
      console.error('Error creating topic:', error);
      res
        .status(500)
        .json(new ApiResponse(500, null, 'Internal server error'));
    }
  }
);

// Get all topics for a course
export const getCourseTopics = asyncHandler(
  async (req: Request & { user?: any }, res: Response) => {
    try {
      const courseId = req.params.courseId as string;
      const userId = req.user?.userId;

      if (!userId) {
        return res
          .status(401)
          .json(new ApiResponse(401, {}, 'User not authenticated'));
      }

      // Verify the course belongs to the user
      const [course] = await db
        .select()
        .from(courseTable)
        .where(eq(courseTable.courseId, courseId));

      if (!course) {
        return res
          .status(404)
          .json(new ApiResponse(404, {}, 'Course not found'));
      }

      if (course.userId !== userId) {
        return res
          .status(403)
          .json(
            new ApiResponse(403, {}, 'You are not authorized to access this course')
          );
      }

      const topics = await db
        .select()
        .from(topicTable)
        .where(eq(topicTable.courseId, courseId))
        .orderBy(topicTable.orderIndex, topicTable.createdAt);

      return res
        .status(200)
        .json(
          new ApiResponse(200, topics, 'Topics fetched successfully')
        );
    } catch (error) {
      console.error('Error fetching topics:', error);
      res
        .status(500)
        .json(new ApiResponse(500, null, 'Internal server error'));
    }
  }
);

// Get a single topic by ID
export const getTopicById = asyncHandler(
  async (req: Request & { user?: any }, res: Response) => {
    try {
      const topicId = req.params.topicId as string;
      const userId = req.user?.userId;

      if (!userId) {
        return res
          .status(401)
          .json(new ApiResponse(401, {}, 'User not authenticated'));
      }

      const [topic] = await db
        .select()
        .from(topicTable)
        .where(eq(topicTable.topicId, topicId));

      if (!topic) {
        return res
          .status(404)
          .json(new ApiResponse(404, {}, 'Topic not found'));
      }

      // Verify the course belongs to the user
      const [course] = await db
        .select()
        .from(courseTable)
        .where(eq(courseTable.courseId, topic.courseId));

      if (!course || course.userId !== userId) {
        return res
          .status(403)
          .json(
            new ApiResponse(403, {}, 'You are not authorized to access this topic')
          );
      }

      return res
        .status(200)
        .json(new ApiResponse(200, topic, 'Topic fetched successfully'));
    } catch (error) {
      console.error('Error fetching topic:', error);
      res
        .status(500)
        .json(new ApiResponse(500, null, 'Internal server error'));
    }
  }
);

// Update a topic
export const updateTopic = asyncHandler(
  async (req: Request & { user?: any }, res: Response) => {
    try {
      const topicId = req.params.topicId as string;
      const { name, description, content, orderIndex } = req.body;
      const userId = req.user?.userId;

      if (!userId) {
        return res
          .status(401)
          .json(new ApiResponse(401, {}, 'User not authenticated'));
      }

      // Check if topic exists
      const [existingTopic] = await db
        .select()
        .from(topicTable)
        .where(eq(topicTable.topicId, topicId));

      if (!existingTopic) {
        return res
          .status(404)
          .json(new ApiResponse(404, {}, 'Topic not found'));
      }

      // Verify the course belongs to the user
      const [course] = await db
        .select()
        .from(courseTable)
        .where(eq(courseTable.courseId, existingTopic.courseId));

      if (!course || course.userId !== userId) {
        return res
          .status(403)
          .json(
            new ApiResponse(403, {}, 'You are not authorized to update this topic')
          );
      }

      // Prepare update data
      const updateData: any = {};
      if (name !== undefined && name.trim() !== '') {
        updateData.name = name.trim();
      }
      if (description !== undefined) {
        updateData.description = description?.trim() || null;
      }
      if (content !== undefined) {
        updateData.content = content?.trim() || null;
      }
      if (orderIndex !== undefined) {
        updateData.orderIndex = orderIndex;
      }

      // Update topic
      const [updatedTopic] = await db
        .update(topicTable)
        .set(updateData)
        .where(eq(topicTable.topicId, topicId))
        .returning();

      return res
        .status(200)
        .json(
          new ApiResponse(200, updatedTopic, 'Topic updated successfully')
        );
    } catch (error) {
      console.error('Error updating topic:', error);
      res
        .status(500)
        .json(new ApiResponse(500, null, 'Internal server error'));
    }
  }
);

// Delete a topic
export const deleteTopic = asyncHandler(
  async (req: Request & { user?: any }, res: Response) => {
    try {
      const topicId = req.params.topicId as string;
      const userId = req.user?.userId;

      if (!userId) {
        return res
          .status(401)
          .json(new ApiResponse(401, {}, 'User not authenticated'));
      }

      // Check if topic exists
      const [existingTopic] = await db
        .select()
        .from(topicTable)
        .where(eq(topicTable.topicId, topicId));

      if (!existingTopic) {
        return res
          .status(404)
          .json(new ApiResponse(404, {}, 'Topic not found'));
      }

      // Verify the course belongs to the user
      const [course] = await db
        .select()
        .from(courseTable)
        .where(eq(courseTable.courseId, existingTopic.courseId));

      if (!course || course.userId !== userId) {
        return res
          .status(403)
          .json(
            new ApiResponse(403, {}, 'You are not authorized to delete this topic')
          );
      }

      // Delete topic (cascade will handle related records)
      await db.delete(topicTable).where(eq(topicTable.topicId, topicId));

      return res
        .status(200)
        .json(new ApiResponse(200, {}, 'Topic deleted successfully'));
    } catch (error) {
      console.error('Error deleting topic:', error);
      res
        .status(500)
        .json(new ApiResponse(500, null, 'Internal server error'));
    }
  }
);
