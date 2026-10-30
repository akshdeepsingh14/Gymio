import { z } from "zod";

const visibility = z.enum(["members", "hidden"]);

export const announcementSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Enter a title of at least 3 characters.")
    .max(80, "Keep the title under 80 characters."),
  message: z
    .string()
    .trim()
    .min(5, "Write a message of at least 5 characters.")
    .max(500, "Keep the message under 500 characters."),
  visibility,
});

export const photoSchema = z.object({
  caption: z.string().trim().max(100, "Keep the caption under 100 characters."),
  visibility,
});