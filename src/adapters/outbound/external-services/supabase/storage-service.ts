import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { Service } from "typedi";
import { config } from "../../../../infrastructure/config.js";

// Define interface locally to avoid 'Express' namespace issues if types aren't global
interface MulterFile {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
}

@Service()
export class StorageService {
  private supabase: SupabaseClient;
  private readonly bucketName: string;

  constructor(bucketName: string) {
    this.supabase = createClient(config.supabase.url, config.supabase.anonKey);
    this.bucketName = bucketName;
  }

  async uploadFile(file: MulterFile): Promise<string> {
    const fileName = `${Date.now()}-${file.originalname}`;
    const { error } = await this.supabase.storage
      .from(this.bucketName)
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (error) {
      throw new Error(`Failed to upload file to Supabase: ${error.message}`);
    }

    // Get public URL
    const { data: publicUrlData } = this.supabase.storage
      .from(this.bucketName)
      .getPublicUrl(fileName);

    return publicUrlData.publicUrl;
  }

  async deleteFile(path: string): Promise<void> {
    const { error } = await this.supabase.storage
      .from(this.bucketName)
      .remove([path]);

    if (error) {
      throw new Error(`Failed to delete file from Supabase: ${error.message}`);
    }
  }
}
