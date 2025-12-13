export type DocumentCategory =
  | "resume"
  | "cover_letter"
  | "portfolio"
  | "certification"
  | "transcript"
  | "reference"
  | "other";

export interface Document {
  id: string; // or ObjectId if MongoDB specific, but domain should be agnostic ideally. Using string is safer.
  userId: string;
  category: DocumentCategory;
  originalName: string;
  mimeType: string;
  size: number;
  provider: "supabase" | "s3"; // In case we add S3 later
  path: string; // The path in the storage bucket
  publicUrl: string;
  createdAt: Date;
  updatedAt: Date;
}
