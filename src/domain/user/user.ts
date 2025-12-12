export interface User {
  id: string;
  email: string;
  authId: string; // Supabase User ID
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
}
