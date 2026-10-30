import { z } from "zod";

/** The form that asks for deletion. The gym name must be typed exactly, so it cannot be done by accident. */
export const buildDeleteSchema = (gymName) =>
  z.object({
    gymName: z.string().refine((value) => value.trim() === gymName, "Type the gym name exactly as shown."),
    password: z.string().min(1, "Enter your password."),
    understand: z.boolean().refine((value) => value === true, "Tick the box to confirm."),
  });