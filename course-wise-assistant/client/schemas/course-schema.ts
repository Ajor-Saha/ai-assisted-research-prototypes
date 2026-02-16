import { z } from "zod";

export const createCourseSchema = z.object({
  name: z.string().min(1, "Course name is required"),
  description: z.string().optional(),
  color: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Invalid color format"),
});

export const updateCourseSchema = z.object({
  name: z.string().min(1, "Course name is required").optional(),
  description: z.string().optional(),
  color: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Invalid color format").optional(),
});

export type CreateCourseInput = z.infer<typeof createCourseSchema>;
export type UpdateCourseInput = z.infer<typeof updateCourseSchema>;
