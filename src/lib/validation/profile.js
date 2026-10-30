import { z } from "zod";

import { currencyOptions, timeZoneOptions } from "@/data/options";
import { DAYS, TIME_PATTERN } from "@/lib/profile";
import { usernameSchema } from "@/lib/validation/auth";

const image = z.string().max(400_000, "That image is too large. Choose a smaller one.");

const optionalLink = z
  .string()
  .trim()
  .max(120, "Keep it under 120 characters.")
  .refine((value) => {
    if (value === "") return true;
    try {
      const url = new URL(value);
      return url.protocol === "https:" || url.protocol === "http:";
    } catch {
      return false;
    }
  }, "Enter the full link, starting with https://");

const daySchema = z.object({
  open: z.boolean(),
  from: z.string(),
  to: z.string(),
});

export const profileSchema = z
  .object({
    gymName: z.string().trim().min(2, "Enter your gym name.").max(60, "Keep it under 60 characters."),
    username: usernameSchema,
    description: z.string().trim().max(300, "Keep it under 300 characters."),
    logo: image,
    cover: image,

    phone: z
      .string()
      .trim()
      .regex(/^$|^\+?[0-9\s-]{7,15}$/, "Enter a valid phone number, or leave it empty."),
    address: z.string().trim().max(120, "Keep it under 120 characters."),
    city: z.string().trim().min(2, "Enter your city.").max(60, "Keep it under 60 characters."),
    locality: z.string().trim().max(60, "Keep it under 60 characters."),
    website: optionalLink,
    instagram: z
      .string()
      .trim()
      .regex(/^$|^@?[A-Za-z0-9._]{1,30}$/, "Enter your Instagram username, like @ironforge."),

    hours: z.object(Object.fromEntries(DAYS.map(({ key }) => [key, daySchema]))),

    currency: z.enum(currencyOptions.map((option) => option.value)),
    timeZone: z.enum(timeZoneOptions.map((option) => option.value)),

    ownerName: z.string().trim().min(2, "Enter your name.").max(60, "Keep it under 60 characters."),
    email: z
      .string()
      .trim()
      .min(1, "Enter your email address.")
      .email("Enter a valid email address."),
    ownerPhoto: image,
  })
  .superRefine((data, ctx) => {
    for (const { key } of DAYS) {
      const day = data.hours[key];
      if (!day.open) continue;

      if (!TIME_PATTERN.test(day.from)) {
        ctx.addIssue({ code: "custom", path: ["hours", key, "from"], message: "Set an opening time." });
      }
      if (!TIME_PATTERN.test(day.to)) {
        ctx.addIssue({ code: "custom", path: ["hours", key, "to"], message: "Set a closing time." });
      } else if (TIME_PATTERN.test(day.from) && day.to <= day.from) {
        ctx.addIssue({
          code: "custom",
          path: ["hours", key, "to"],
          message: "Closing time must be after opening time.",
        });
      }
    }
  });