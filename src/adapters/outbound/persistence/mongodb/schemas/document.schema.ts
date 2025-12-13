import { z } from "zod";

export const documentSchema = z.object({
  userId: z.string(),
  category: z
    .enum([
      "resume",
      "cover_letter",
      "portfolio",
      "certification",
      "transcript",
      "reference",
      "other",
    ])
    .default("other"),
  originalName: z.string(),
  mimeType: z.string(),
  size: z.number(),
  provider: z.enum(["supabase", "s3"]).default("supabase"),
  path: z.string(),
  publicUrl: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type DocumentSchema = z.infer<typeof documentSchema>;
