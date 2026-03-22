import { z } from "zod"

export const updateProfileSchema = z.object({
  firstName: z.string().trim().min(2, "First name must be at least 2 characters."),
  lastName: z.string().trim().optional(),
  email: z.string().email("Please enter a valid email address."),
})

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(8, "Current password must be at least 8 characters."),
    newPassword: z.string().min(8, "New password must be at least 8 characters."),
    confirmPassword: z.string().min(8, "Confirm password must be at least 8 characters."),
  })
  .refine((payload) => payload.newPassword === payload.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  })