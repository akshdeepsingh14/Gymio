import { z } from "zod";

/** Form rules for a staff member's own profile. Email and role are not here: the owner controls them. */
export const staffProfileSchema = z.object({
  name: z.string().trim().min(2, "Enter your name.").max(60, "Keep it under 60 characters."),
  phone: z
    .string()
    .trim()
    .regex(/^$|^\+?[0-9\s-]{7,15}$/, "Enter a valid phone number, or leave it empty."),
});