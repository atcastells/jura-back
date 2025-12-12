import { createClient, SupabaseClient } from '@supabase/supabase-js';

export class SupabaseClientSingleton {
  private static instance: SupabaseClient | null = null;

  private constructor() {}

  public static getInstance(): SupabaseClient {
    if (!this.instance) {
      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error(
          'SUPABASE_URL and SUPABASE_ANON_KEY must be defined in environment variables',
        );
      }

      this.instance = createClient(supabaseUrl, supabaseAnonKey);
    }

    return this.instance;
  }

  public static getAdminClient(): SupabaseClient {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error(
        'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be defined in environment variables',
      );
    }

    return createClient(supabaseUrl, supabaseServiceRoleKey);
  }
}
