import { z } from "zod";

export const createTopicSchema = z.object({
  courseId: z.string().min(1, "Course ID is required"),
  name: z.string().min(1, "Topic name is required"),
  description: z.string().optional(),
  content: z.string().optional(),
  orderIndex: z.number().optional(),
});

export const updateTopicSchema = z.object({
  name: z.string().min(1, "Topic name is required").optional(),
  description: z.string().optional(),
  content: z.string().optional(),
  orderIndex: z.number().optional(),
});

export type CreateTopicInput = z.infer<typeof createTopicSchema>;
export type UpdateTopicInput = z.infer<typeof updateTopicSchema>;
