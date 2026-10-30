import { z } from "zod";

import { methodField, paymentRulesCheck } from "@/lib/validation/payment";

const optionalEmail = z
  .string()
  .trim()
  .max(120, "Keep it under 120 characters.")
  .regex(/^$|^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Enter a valid email, or leave it empty.");

const optionalPhone = z
  .string()
  .trim()
  .regex(/^$|^\+?[0-9\s-]{7,15}$/, "Enter a valid phone number, or leave it empty.");

export const memberDetailsSchema = z.object({
  name: z.string().trim().min(2, "Enter the member's name.").max(60, "Keep it under 60 characters."),
  phone: optionalPhone,
  email: optionalEmail,
  locality: z.string().trim().max(60, "Keep it under 60 characters."),
  notes: z.string().trim().max(300, "Keep notes under 300 characters."),
});

// The payment rules only apply when the member pays now. "Pay later" records no payment.
export const buildNewMemberSchema = (settings) => {
  const rules = paymentRulesCheck(settings);

  return memberDetailsSchema
    .extend({
      planId: z.string().min(1, "Choose a plan."),
      startsOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a start date."),
      paymentMode: z.enum(["paid", "later"]),
      method: methodField(settings),
      reference: z.string().trim().max(40, "Keep it under 40 characters."),
    })
    .superRefine((values, ctx) => {
      if (values.paymentMode === "paid") rules(values, ctx);
    });
};
