import * as z from "zod";

// Zod schema for signup
export const signupSchema = z.object({
  firstName: z
    .string()
    .min(2, "First name must be at least 2 characters"),
  lastName: z
    .string()
    .min(2, "Last name must be at least 2 characters"),
  email: z.email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters"),
});

// Zod schema for login
export const loginSchema = z.object({
  email: z.email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters"),
});
