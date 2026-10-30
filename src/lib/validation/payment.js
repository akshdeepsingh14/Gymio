import { z } from "zod";

import { checkPaymentRules, MAX_PAYMENT_AMOUNT } from "@/lib/payments";

const wholeAmount = z
  .string()
  .trim()
  .refine(
    (value) => /^\d+$/.test(value) && Number(value) >= 1 && Number(value) <= MAX_PAYMENT_AMOUNT,
    `Enter a whole amount between 1 and ${MAX_PAYMENT_AMOUNT}.`,
  );

// ---- Shared by every form that takes a payment (record, renew, add member) ----

/** A method the gym has switched on. The list comes from Settings, so the schema is built per form. */
export const methodField = (settings) =>
  z.string().refine((value) => settings.paymentMethods.includes(value), "Choose a payment method that is on.");

/**
 * Adds the gym's payment rules to a schema through superRefine.
 * `plans` is only needed where the owner can type an amount, to compare it with the plan price.
 */
export const paymentRulesCheck = (settings, plans) => (values, ctx) => {
  const planPrice = plans?.find((plan) => plan.id === values.planId)?.price;
  const broken = checkPaymentRules({ ...values, planPrice }, settings);
  // The method itself is already checked by methodField
  if (broken && broken.field !== "method") {
    ctx.addIssue({ code: "custom", path: [broken.field], message: broken.message });
  }
};

export const buildRecordPaymentSchema = (settings, plans) =>
  z
    .object({
      memberId: z.string().min(1, "Choose a member."),
      planId: z.string().min(1, "Choose a plan."),
      amount: wholeAmount,
      method: methodField(settings),
      reference: z.string().trim().max(40, "Keep it under 40 characters."),
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose the payment date."),
      note: z.string().trim().max(200, "Keep the note under 200 characters."),
    })
    .superRefine(paymentRulesCheck(settings, plans));

export const voidPaymentSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(5, "Give a reason of at least 5 characters.")
    .max(200, "Keep the reason under 200 characters."),
});

export const amendPaymentSchema = z.object({
  reference: z.string().trim().max(40, "Keep it under 40 characters."),
  note: z.string().trim().max(200, "Keep the note under 200 characters."),
});
