import { eq } from 'drizzle-orm';
import { Request, Response } from 'express';
import { nanoid } from 'nanoid';
import { db } from '../db';
import { courseTable } from '../db/schema';
import { ApiResponse } from '../utils/api-response';
import { asyncHandler } from '../utils/asyncHandler';

// Create a new course
export const createCourse = asyncHandler(
  async (req: Request & { user?: any }, res: Response) => {
    try {
      const { name, description, color } = req.body;
      const userId = req.user?.userId;

      // Validate required fields
      if (!name || name.trim() === '') {
        return res
          .status(400)
          .json(new ApiResponse(400, {}, 'Course name is required'));
      }

      if (!userId) {
        return res
          .status(401)
          .json(new ApiResponse(401, {}, 'User not authenticated'));
      }

      // Create new course
      const newCourse = {
        courseId: nanoid(),
        userId,
        name: name.trim(),
        description: description?.trim() || null,
        color: color || '#3B82F6',
      };

      const [createdCourse] = await db
        .insert(courseTable)
        .values(newCourse)
        .returning();

      return res
        .status(201)
        .json(
          new ApiResponse(201, createdCourse, 'Course created successfully')
        );
    } catch (error) {
      console.error('Error creating course:', error);
      res
        .status(500)
        .json(new ApiResponse(500, null, 'Internal server error'));
    }
  }
);

// Get all courses for the authenticated user
export const getUserCourses = asyncHandler(
  async (req: Request & { user?: any }, res: Response) => {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return res
          .status(401)
          .json(new ApiResponse(401, {}, 'User not authenticated'));
      }

      const courses = await db
        .select()
        .from(courseTable)
        .where(eq(courseTable.userId, userId))
        .orderBy(courseTable.createdAt);

      return res
        .status(200)
        .json(
          new ApiResponse(200, courses, 'Courses fetched successfully')
        );
    } catch (error) {
      console.error('Error fetching courses:', error);
      res
        .status(500)
        .json(new ApiResponse(500, null, 'Internal server error'));
    }
  }
);

// Get a single course by ID
export const getCourseById = asyncHandler(
  async (req: Request & { user?: any }, res: Response) => {
    try {
      const courseId = req.params.courseId as string;
      const userId = req.user?.userId;

      if (!userId) {
        return res
          .status(401)
          .json(new ApiResponse(401, {}, 'User not authenticated'));
      }

      const [course] = await db
        .select()
        .from(courseTable)
        .where(eq(courseTable.courseId, courseId));

      if (!course) {
        return res
          .status(404)
          .json(new ApiResponse(404, {}, 'Course not found'));
      }

      // Verify the course belongs to the user
      if (course.userId !== userId) {
        return res
          .status(403)
          .json(
            new ApiResponse(403, {}, 'You are not authorized to access this course')
          );
      }

      return res
        .status(200)
        .json(new ApiResponse(200, course, 'Course fetched successfully'));
    } catch (error) {
      console.error('Error fetching course:', error);
      res
        .status(500)
        .json(new ApiResponse(500, null, 'Internal server error'));
    }
  }
);

// Update a course
export const updateCourse = asyncHandler(
  async (req: Request & { user?: any }, res: Response) => {
    try {
      const courseId = req.params.courseId as string;
      const { name, description, color } = req.body;
      const userId = req.user?.userId;

      if (!userId) {
        return res
          .status(401)
          .json(new ApiResponse(401, {}, 'User not authenticated'));
      }

      // Check if course exists and belongs to user
      const [existingCourse] = await db
        .select()
        .from(courseTable)
        .where(eq(courseTable.courseId, courseId));

      if (!existingCourse) {
        return res
          .status(404)
          .json(new ApiResponse(404, {}, 'Course not found'));
      }

      if (existingCourse.userId !== userId) {
        return res
          .status(403)
          .json(
            new ApiResponse(403, {}, 'You are not authorized to update this course')
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
      if (color !== undefined) {
        updateData.color = color;
      }

      // Update course
      const [updatedCourse] = await db
        .update(courseTable)
        .set(updateData)
        .where(eq(courseTable.courseId, courseId))
        .returning();

      return res
        .status(200)
        .json(
          new ApiResponse(200, updatedCourse, 'Course updated successfully')
        );
    } catch (error) {
      console.error('Error updating course:', error);
      res
        .status(500)
        .json(new ApiResponse(500, null, 'Internal server error'));
    }
  }
);

// Delete a course
export const deleteCourse = asyncHandler(
  async (req: Request & { user?: any }, res: Response) => {
    try {
      const courseId = req.params.courseId as string;
      const userId = req.user?.userId;

      if (!userId) {
        return res
          .status(401)
          .json(new ApiResponse(401, {}, 'User not authenticated'));
      }

      // Check if course exists and belongs to user
      const [existingCourse] = await db
        .select()
        .from(courseTable)
        .where(eq(courseTable.courseId, courseId));

      if (!existingCourse) {
        return res
          .status(404)
          .json(new ApiResponse(404, {}, 'Course not found'));
      }

      if (existingCourse.userId !== userId) {
        return res
          .status(403)
          .json(
            new ApiResponse(403, {}, 'You are not authorized to delete this course')
          );
      }

      // Delete course (cascade will handle related records)
      await db.delete(courseTable).where(eq(courseTable.courseId, courseId));

      return res
        .status(200)
        .json(new ApiResponse(200, {}, 'Course deleted successfully'));
    } catch (error) {
      console.error('Error deleting course:', error);
      res
        .status(500)
        .json(new ApiResponse(500, null, 'Internal server error'));
    }
  }
);
