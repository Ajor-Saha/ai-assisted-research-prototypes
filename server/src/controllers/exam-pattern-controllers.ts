import { eq } from 'drizzle-orm';
import { Request, Response } from 'express';
import { nanoid } from 'nanoid';
import { db } from '../db';
import { examPatternTable } from '../db/schema';
import { ApiResponse } from '../utils/api-response';
import { asyncHandler } from '../utils/asyncHandler';

// List all exam patterns
export const getAllExamPatterns = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const patterns = await db
        .select({
          examPatternId: examPatternTable.examPatternId,
          patternCode: examPatternTable.patternCode,
          name: examPatternTable.name,
          description: examPatternTable.description,
          defaultMarks: examPatternTable.defaultMarks,
          defaultTimeMinutes: examPatternTable.defaultTimeMinutes,
          allowCustomMarks: examPatternTable.allowCustomMarks,
          allowCustomTime: examPatternTable.allowCustomTime,
          hasSections: examPatternTable.hasSections,
          hasMCQ: examPatternTable.hasMCQ,
          hasBroadQuestions: examPatternTable.hasBroadQuestions,
          hasShortQuestions: examPatternTable.hasShortQuestions,
          createdAt: examPatternTable.createdAt,
          updatedAt: examPatternTable.updatedAt,
        })
        .from(examPatternTable)
        .orderBy(examPatternTable.name);

      return res
        .status(200)
        .json(
          new ApiResponse(200, patterns, 'Exam patterns fetched successfully')
        );
    } catch (error) {
      console.error('Error fetching exam patterns:', error);
      res
        .status(500)
        .json(new ApiResponse(500, null, 'Internal server error'));
    }
  }
);

// Get single exam pattern with full config
export const getExamPatternById = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const examPatternId = req.params.id as string;

      const [pattern] = await db
        .select()
        .from(examPatternTable)
        .where(eq(examPatternTable.examPatternId, examPatternId));

      if (!pattern) {
        return res
          .status(404)
          .json(new ApiResponse(404, {}, 'Exam pattern not found'));
      }

      return res
        .status(200)
        .json(
          new ApiResponse(200, pattern, 'Exam pattern fetched successfully')
        );
    } catch (error) {
      console.error('Error fetching exam pattern:', error);
      res
        .status(500)
        .json(new ApiResponse(500, null, 'Internal server error'));
    }
  }
);

// Create new exam pattern (admin only)
export const createExamPattern = asyncHandler(
  async (req: Request & { user?: any }, res: Response) => {
    try {
      const {
        patternCode,
        name,
        description,
        defaultMarks,
        defaultTimeMinutes,
        allowCustomMarks,
        allowCustomTime,
        hasSections,
        hasMCQ,
        hasBroadQuestions,
        hasShortQuestions,
        config,
      } = req.body;

      // Validate required fields
      if (!patternCode || patternCode.trim() === '') {
        return res
          .status(400)
          .json(new ApiResponse(400, {}, 'Pattern code is required'));
      }

      if (!name || name.trim() === '') {
        return res
          .status(400)
          .json(new ApiResponse(400, {}, 'Pattern name is required'));
      }

      if (!defaultMarks || isNaN(defaultMarks)) {
        return res
          .status(400)
          .json(new ApiResponse(400, {}, 'Valid default marks is required'));
      }

      if (!config || typeof config !== 'object') {
        return res
          .status(400)
          .json(new ApiResponse(400, {}, 'Valid config object is required'));
      }

      // Check if pattern code already exists
      const [existingPattern] = await db
        .select()
        .from(examPatternTable)
        .where(eq(examPatternTable.patternCode, patternCode));

      if (existingPattern) {
        return res
          .status(409)
          .json(new ApiResponse(409, {}, 'Pattern code already exists'));
      }

      // Create new exam pattern
      const newPattern = {
        examPatternId: nanoid(),
        patternCode: patternCode.trim(),
        name: name.trim(),
        description: description?.trim() || null,
        defaultMarks: parseInt(defaultMarks),
        defaultTimeMinutes: defaultTimeMinutes ? parseInt(defaultTimeMinutes) : null,
        allowCustomMarks: allowCustomMarks ?? true,
        allowCustomTime: allowCustomTime ?? true,
        hasSections: hasSections ?? false,
        hasMCQ: hasMCQ ?? false,
        hasBroadQuestions: hasBroadQuestions ?? true,
        hasShortQuestions: hasShortQuestions ?? false,
        config,
      };

      const [createdPattern] = await db
        .insert(examPatternTable)
        .values(newPattern)
        .returning();

      return res
        .status(201)
        .json(
          new ApiResponse(
            201,
            createdPattern,
            'Exam pattern created successfully'
          )
        );
    } catch (error) {
      console.error('Error creating exam pattern:', error);
      res
        .status(500)
        .json(new ApiResponse(500, null, 'Internal server error'));
    }
  }
);

// Update exam pattern (admin only)
export const updateExamPattern = asyncHandler(
  async (req: Request & { user?: any }, res: Response) => {
    try {
      const examPatternId = req.params.id as string;
      const {
        patternCode,
        name,
        description,
        defaultMarks,
        defaultTimeMinutes,
        allowCustomMarks,
        allowCustomTime,
        hasSections,
        hasMCQ,
        hasBroadQuestions,
        hasShortQuestions,
        config,
      } = req.body;

      // Check if pattern exists
      const [existingPattern] = await db
        .select()
        .from(examPatternTable)
        .where(eq(examPatternTable.examPatternId, examPatternId));

      if (!existingPattern) {
        return res
          .status(404)
          .json(new ApiResponse(404, {}, 'Exam pattern not found'));
      }

      // If updating patternCode, check for duplicates
      if (patternCode && patternCode.trim() !== existingPattern.patternCode) {
        const [duplicatePattern] = await db
          .select()
          .from(examPatternTable)
          .where(eq(examPatternTable.patternCode, patternCode.trim()));

        if (duplicatePattern) {
          return res
            .status(409)
            .json(new ApiResponse(409, {}, 'Pattern code already exists'));
        }
      }

      // Prepare update data
      const updateData: any = {};

      if (patternCode !== undefined && patternCode.trim() !== '') {
        updateData.patternCode = patternCode.trim();
      }
      if (name !== undefined && name.trim() !== '') {
        updateData.name = name.trim();
      }
      if (description !== undefined) {
        updateData.description = description?.trim() || null;
      }
      if (defaultMarks !== undefined && !isNaN(defaultMarks)) {
        updateData.defaultMarks = parseInt(defaultMarks);
      }
      if (defaultTimeMinutes !== undefined) {
        updateData.defaultTimeMinutes = defaultTimeMinutes
          ? parseInt(defaultTimeMinutes)
          : null;
      }
      if (allowCustomMarks !== undefined) {
        updateData.allowCustomMarks = allowCustomMarks;
      }
      if (allowCustomTime !== undefined) {
        updateData.allowCustomTime = allowCustomTime;
      }
      if (hasSections !== undefined) {
        updateData.hasSections = hasSections;
      }
      if (hasMCQ !== undefined) {
        updateData.hasMCQ = hasMCQ;
      }
      if (hasBroadQuestions !== undefined) {
        updateData.hasBroadQuestions = hasBroadQuestions;
      }
      if (hasShortQuestions !== undefined) {
        updateData.hasShortQuestions = hasShortQuestions;
      }
      if (config !== undefined && typeof config === 'object') {
        updateData.config = config;
      }

      // Update pattern
      const [updatedPattern] = await db
        .update(examPatternTable)
        .set(updateData)
        .where(eq(examPatternTable.examPatternId, examPatternId))
        .returning();

      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            updatedPattern,
            'Exam pattern updated successfully'
          )
        );
    } catch (error) {
      console.error('Error updating exam pattern:', error);
      res
        .status(500)
        .json(new ApiResponse(500, null, 'Internal server error'));
    }
  }
);

// Delete exam pattern (admin only)
export const deleteExamPattern = asyncHandler(
  async (req: Request & { user?: any }, res: Response) => {
    try {
      const examPatternId = req.params.id as string;

      // Check if pattern exists
      const [existingPattern] = await db
        .select()
        .from(examPatternTable)
        .where(eq(examPatternTable.examPatternId, examPatternId));

      if (!existingPattern) {
        return res
          .status(404)
          .json(new ApiResponse(404, {}, 'Exam pattern not found'));
      }

      // Delete pattern (cascade will handle related generated exams)
      await db
        .delete(examPatternTable)
        .where(eq(examPatternTable.examPatternId, examPatternId));

      return res
        .status(200)
        .json(new ApiResponse(200, {}, 'Exam pattern deleted successfully'));
    } catch (error) {
      console.error('Error deleting exam pattern:', error);
      res
        .status(500)
        .json(new ApiResponse(500, null, 'Internal server error'));
    }
  }
);
