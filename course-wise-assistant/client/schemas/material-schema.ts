import { z } from "zod";

export const createMaterialSchema = z.object({
  courseId: z.string().min(1, "Course ID is required"),
  topicId: z.string().optional().nullable(),
  name: z.string().min(1, "Material name is required"),
  description: z.string().optional(),
  type: z.string().min(1, "Material type is required"),
  url: z.union([z.string().url("Must be a valid URL"), z.literal("")]).optional(),
  fileSize: z.string().optional(),
});

export const updateMaterialSchema = z.object({
  name: z.string().min(1, "Material name is required").optional(),
  description: z.string().optional(),
  topicId: z.string().optional().nullable(),
  type: z.string().optional(),
  url: z.string().url("Must be a valid URL").optional(),
  fileSize: z.string().optional(),
});

export type CreateMaterialInput = z.infer<typeof createMaterialSchema>;
export type UpdateMaterialInput = z.infer<typeof updateMaterialSchema>;
