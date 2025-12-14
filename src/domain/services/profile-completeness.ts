import { Profile } from "../entities/profile.js";

export interface CompletenessResult {
  score: number;
  missingFields: string[];
}

/**
 * Service to calculate profile completeness score based on filled fields.
 * Score is 0-100 representing percentage of important fields completed.
 */
export const ProfileCompletenessService = {
  /**
   * Calculate completeness score for a profile
   * @param profile The profile to evaluate
   * @returns Score (0-100) and list of missing important fields
   */
  calculate(profile: Profile): CompletenessResult {
    const missingFields: string[] = [];
    let totalFields = 0;
    let completedFields = 0;

    // Basics (weight: 6 fields, 30 points)
    totalFields += 6;
    if (profile.basics.email) completedFields += 1;
    else missingFields.push("basics.email");

    if (profile.basics.phone) completedFields += 1;
    else missingFields.push("basics.phone");

    if (profile.basics.name) completedFields += 1;
    else missingFields.push("basics.name");

    if (profile.basics.location) completedFields += 1;
    else missingFields.push("basics.location");

    if (profile.basics.linkedIn) completedFields += 1;
    else missingFields.push("basics.linkedIn");

    if (profile.basics.github || profile.basics.website) completedFields += 1;
    else missingFields.push("basics.github or basics.website");

    // Summary (weight: 1 field, 10 points)
    totalFields += 1;
    if (profile.summary && profile.summary.trim().length > 0)
      completedFields += 1;
    else missingFields.push("summary");

    // Roles (weight: 1 field, 15 points)
    totalFields += 1;
    if (profile.roles && profile.roles.length > 0) completedFields += 1;
    else missingFields.push("roles");

    // Skills (weight: 1 field, 10 points)
    totalFields += 1;
    if (profile.skills && profile.skills.length > 0) completedFields += 1;
    else missingFields.push("skills");

    // Education (weight: 1 field, 10 points)
    totalFields += 1;
    if (profile.education && profile.education.length > 0) completedFields += 1;
    else missingFields.push("education");

    // Projects (weight: 1 field, 8 points)
    totalFields += 1;
    if (profile.projects && profile.projects.length > 0) completedFields += 1;
    else missingFields.push("projects");

    // Certifications (weight: 1 field, 8 points)
    totalFields += 1;
    if (profile.certifications && profile.certifications.length > 0)
      completedFields += 1;
    else missingFields.push("certifications");

    // Languages (weight: 1 field, 8 points)
    totalFields += 1;
    if (profile.languages && profile.languages.length > 0) completedFields += 1;
    else missingFields.push("languages");

    // Calculate score as percentage
    const score = Math.round((completedFields / totalFields) * 100);

    return {
      score,
      missingFields,
    };
  },
};
