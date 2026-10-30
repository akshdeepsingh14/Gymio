import { z } from "zod";

import { methodField, paymentRulesCheck } from "@/lib/validation/payment";

// A renewal is always the plan price, so only the method and reference rules can apply here.
export const buildRenewalSchema = (settings) =>
  z
    .object({
      planId: z.string().min(1, "Choose a plan."),
      method: methodField(settings),
      reference: z.string().trim().max(40, "Keep it under 40 characters."),
    })
    .superRefine(paymentRulesCheck(settings));

// Collecting a pending payment does not change the plan
export const buildCollectSchema = (settings) =>
  z
    .object({
      method: methodField(settings),
      reference: z.string().trim().max(40, "Keep it under 40 characters."),
    })
    .superRefine(paymentRulesCheck(settings));
