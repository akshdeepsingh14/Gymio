import { z } from "zod";
import {
  currencyOptions,
  graceOptions,
  reminderOptions,
  timeZoneOptions,
  RESERVED_USERNAMES,
} from "@/data/options";

const email = z
  .string()
  .trim()
  .min(1, "Enter your email address.")
  .email("Enter a valid email address.");

const password = z
  .string()
  .min(8, "Use at least 8 characters.")
  .regex(/[A-Za-z]/, "Include at least one letter.")
  .regex(/[0-9]/, "Include at least one number.");

/** The password rule, shared with the staff invitation form. */
export const passwordRule = password;

export const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, "Use at least 3 characters.")
  .max(30, "Use 30 characters or fewer.")
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Use letters, numbers and single hyphens only. No spaces.",
  )
  .refine((value) => !RESERVED_USERNAMES.includes(value), "That username is reserved.");

export const signInSchema = z.object({
  email,
  password: z.string().min(1, "Enter your password."),
});

/** Owner sign-in adds the "keep me signed in" choice. Staff sign-in uses signInSchema as it is. */
export const ownerSignInSchema = signInSchema.extend({ remember: z.boolean() });

export const signUpSchema = z
  .object({
    gymName: z.string().trim().min(2, "Enter your gym name.").max(60, "Keep it under 60 characters."),
    email,
    password,
    confirmPassword: z.string().min(1, "Confirm your password."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export const forgotPasswordSchema = z.object({ email });

export const resetPasswordSchema = z
  .object({
    password,
    confirmPassword: z.string().min(1, "Confirm your password."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password."),
    newPassword: password,
    confirmPassword: z.string().min(1, "Confirm your new password."),
    signOutOthers: z.boolean(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  })
  .refine((data) => data.newPassword !== data.currentPassword, {
    message: "The new password must be different from the current one.",
    path: ["newPassword"],
  });

export const onboardingSchema = z.object({
  username: usernameSchema,
  ownerName: z.string().trim().min(2, "Enter your name.").max(60, "Keep it under 60 characters."),
  phone: z
    .string()
    .trim()
    .regex(/^$|^\+?[0-9\s-]{7,15}$/, "Enter a valid phone number, or leave it empty."),
  city: z.string().trim().min(2, "Enter your city.").max(60, "Keep it under 60 characters."),
  locality: z.string().trim().max(60, "Keep it under 60 characters."),
  currency: z.enum(currencyOptions.map((o) => o.value)),
  timeZone: z.enum(timeZoneOptions.map((o) => o.value)),
  graceDays: z.enum(graceOptions.map((o) => o.value)),
  reminderDays: z.enum(reminderOptions.map((o) => o.value)),
});