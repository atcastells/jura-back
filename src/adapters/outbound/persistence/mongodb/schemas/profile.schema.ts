import { z } from "zod";

export const profileBasicsSchema = z.object({
  email: z.string().email(),
  phone: z.string().optional(),
  name: z.string().optional(),
  location: z.string().optional(),
  linkedIn: z.string().optional(),
  github: z.string().optional(),
  website: z.string().optional(),
});

export const profileRoleSchema = z.object({
  id: z.string(),
  title: z.string(),
  company: z.string().optional(),
  location: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  current: z.boolean().optional(),
  description: z.string().optional(),
  highlights: z.array(z.string()),
});

export const profileProjectSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  url: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  technologies: z.array(z.string()).optional(),
});

export const profileEducationSchema = z.object({
  id: z.string(),
  institution: z.string(),
  degree: z.string().optional(),
  field: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  description: z.string().optional(),
});

export const profileCertificationSchema = z.object({
  id: z.string(),
  name: z.string(),
  issuer: z.string().optional(),
  issueDate: z.string().optional(),
  expiryDate: z.string().optional(),
  credentialId: z.string().optional(),
  url: z.string().optional(),
});

export const profileAchievementSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  date: z.string().optional(),
});

export const profileLanguageSchema = z.object({
  language: z.string(),
  proficiency: z.string().optional(),
});

export const profilePreferencesSchema = z.object({
  lookingForWork: z.boolean().optional(),
  preferredRoles: z.array(z.string()).optional(),
  preferredLocations: z.array(z.string()).optional(),
  remoteOnly: z.boolean().optional(),
  salaryExpectation: z.string().optional(),
});

export const profileEvidenceSchema = z.object({
  fieldPath: z.string(),
  source: z.string(),
  confidence: z.number(),
});

export const profileSchema = z.object({
  userId: z.string(),
  basics: profileBasicsSchema,
  summary: z.string().optional(),
  roles: z.array(profileRoleSchema),
  projects: z.array(profileProjectSchema).optional(),
  education: z.array(profileEducationSchema).optional(),
  certifications: z.array(profileCertificationSchema).optional(),
  achievements: z.array(profileAchievementSchema).optional(),
  skills: z.array(z.string()).optional(),
  languages: z.array(profileLanguageSchema).optional(),
  preferences: profilePreferencesSchema.optional(),
  completenessScore: z.number(),
  evidence: z.array(profileEvidenceSchema).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type ProfileSchema = z.infer<typeof profileSchema>;
