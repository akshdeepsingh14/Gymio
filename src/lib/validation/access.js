import { z } from "zod";

import { normalizeCode } from "@/lib/credentials";

export const accessLookupSchema = z.object({
  username: z.string().trim().min(1, "Enter your gym's username."),
  code: z
    .string()
    .trim()
    .min(1, "Enter your access code.")
    .refine(
      (value) => normalizeCode(value).length === 12,
      "Check the code. It has 12 letters and numbers, like K7QM-4TXD-9HWB.",
    ),
});

export const rejectRequestSchema = z.object({
  reason: z.string().trim().max(200, "Keep the note under 200 characters."),
  revokeCode: z.boolean(),
});