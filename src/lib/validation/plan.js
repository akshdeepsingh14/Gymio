import { z } from "zod";

import { benefitsFromText, CUSTOM_LIMITS, durationTypeOptions } from "@/lib/plans";

export const planSchema = z
  .object({
    name: z.string().trim().min(2, "Enter a plan name.").max(40, "Keep it under 40 characters."),
    durationType: z.enum(durationTypeOptions.map((option) => option.value)),
    customValue: z.string().trim(),
    customUnit: z.enum(["days", "months"]),
    price: z
      .string()
      .trim()
      .refine(
        (value) => /^\d+$/.test(value) && Number(value) >= 1 && Number(value) <= 1000000,
        "Enter a whole amount between 1 and 1000000.",
      ),
    description: z.string().trim().max(160, "Keep it under 160 characters."),
    benefits: z.string().max(600, "That is too long. Shorten the list."),
  })
  .superRefine((data, ctx) => {
    if (data.durationType === "custom") {
      const max = CUSTOM_LIMITS[data.customUnit];
      const valid =
        /^\d+$/.test(data.customValue) && Number(data.customValue) >= 1 && Number(data.customValue) <= max;
      if (!valid) {
        ctx.addIssue({
          code: "custom",
          path: ["customValue"],
          message: `Enter a whole number from 1 to ${max}.`,
        });
      }
    }

    const lines = benefitsFromText(data.benefits);
    if (lines.length > 6) {
      ctx.addIssue({ code: "custom", path: ["benefits"], message: "List up to 6 benefits, one per line." });
    } else if (lines.some((line) => line.length > 60)) {
      ctx.addIssue({ code: "custom", path: ["benefits"], message: "Keep each benefit under 60 characters." });
    }
  });