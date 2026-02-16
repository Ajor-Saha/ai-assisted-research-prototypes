import * as z from "zod";

export const formSchema = z.object({
  firstName: z
    .string()
    .min(2, "First name must be at least 2 characters."),
  lastName: z
    .string()
    .min(2, "Last name must be at least 2 characters."),
  email: z.email("Please enter a valid email address."),
  avatar: z.any().refine((file) => file instanceof File && file.size > 0, "Please upload a valid image file."),
});