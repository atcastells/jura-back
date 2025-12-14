export interface ProfileBasics {
  email: string;
  phone?: string;
  name?: string;
  location?: string;
  linkedIn?: string;
  github?: string;
  website?: string;
}

export interface ProfileRole {
  id: string;
  title: string;
  company?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  current?: boolean;
  description?: string;
  highlights: string[];
}

export interface ProfileProject {
  id: string;
  name: string;
  description?: string;
  url?: string;
  startDate?: string;
  endDate?: string;
  technologies?: string[];
}

export interface ProfileEducation {
  id: string;
  institution: string;
  degree?: string;
  field?: string;
  startDate?: string;
  endDate?: string;
  description?: string;
}

export interface ProfileCertification {
  id: string;
  name: string;
  issuer?: string;
  issueDate?: string;
  expiryDate?: string;
  credentialId?: string;
  url?: string;
}

export interface ProfileAchievement {
  id: string;
  title: string;
  description?: string;
  date?: string;
}

export interface ProfileLanguage {
  language: string;
  proficiency?: string;
}

export interface ProfilePreferences {
  lookingForWork?: boolean;
  preferredRoles?: string[];
  preferredLocations?: string[];
  remoteOnly?: boolean;
  salaryExpectation?: string;
}

export interface ProfileEvidence {
  fieldPath: string;
  source: string;
  confidence: number;
}

export interface Profile {
  id: string;
  userId: string;
  basics: ProfileBasics;
  summary?: string;
  roles: ProfileRole[];
  projects?: ProfileProject[];
  education?: ProfileEducation[];
  certifications?: ProfileCertification[];
  achievements?: ProfileAchievement[];
  skills?: string[];
  languages?: ProfileLanguage[];
  preferences?: ProfilePreferences;
  completenessScore: number;
  evidence?: ProfileEvidence[];
  createdAt: Date;
  updatedAt: Date;
}
