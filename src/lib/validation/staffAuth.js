import { z } from "zod";

import { passwordRule } from "@/lib/validation/auth";

/**
 * Form rules for accepting a staff invitation.
 * Whether the email matches the invitation is checked by the service, not here, so the
 * address the invitation was sent to is never handed to the browser.
 */
export const acceptInviteSchema = z
  .object({
    name: z.string().trim().min(2, "Enter your name.").max(60, "Keep it under 60 characters."),
    phone: z
      .string()
      .trim()
      .regex(/^$|^\+?[0-9\s-]{7,15}$/, "Enter a valid phone number, or leave it empty."),
    confirmEmail: z
      .string()
      .trim()
      .min(1, "Type the email address your invitation was sent to.")
      .email("Enter a valid email address."),
    password: passwordRule,
    confirmPassword: z.string().min(1, "Confirm your password."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });