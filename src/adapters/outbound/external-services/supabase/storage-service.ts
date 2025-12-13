import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { Service } from "typedi";
import { config } from "../../../../infrastructure/config.js";

// File interface for upload operations
export interface UploadFile {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
}

/**
 * Supabase Storage Adapter - handles file storage operations with Supabase
 * This adapter can be used as an outbound port implementation for storage operations
 */
@Service()
export class SupabaseStorageAdapter {
  private readonly supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(config.supabase.url, config.supabase.anonKey);
  }

  async uploadFile(
    file: UploadFile,
    bucketName: string,
  ): Promise<{ path: string; publicUrl: string }> {
    const fileName = `${Date.now()}-${file.originalname}`;
    const { error } = await this.supabase.storage
      .from(bucketName)
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (error) {
      throw new Error(`Failed to upload file to Supabase: ${error.message}`);
    }

    // Get public URL
    const { data: publicUrlData } = this.supabase.storage
      .from(bucketName)
      .getPublicUrl(fileName);

    return {
      path: fileName,
      publicUrl: publicUrlData.publicUrl,
    };
  }

  async deleteFile(path: string, bucketName: string): Promise<void> {
    const { error } = await this.supabase.storage
      .from(bucketName)
      .remove([path]);

    if (error) {
      throw new Error(`Failed to delete file from Supabase: ${error.message}`);
    }
  }
}
