import { z } from "zod";

import { ROLE_VALUES } from "@/lib/staff";

export const inviteStaffSchema = z.object({
  name: z.string().trim().min(2, "Enter their name.").max(60, "Keep it under 60 characters."),
  email: z
    .string()
    .trim()
    .min(1, "Enter their email address.")
    .max(120, "Keep it under 120 characters.")
    .email("Enter a valid email address."),
  phone: z
    .string()
    .trim()
    .regex(/^$|^\+?[0-9\s-]{7,15}$/, "Enter a valid phone number, or leave it empty."),
  role: z.enum(ROLE_VALUES),
});

// A staff member's email is their sign-in, so it cannot be edited.
export const editStaffSchema = inviteStaffSchema.omit({ email: true });