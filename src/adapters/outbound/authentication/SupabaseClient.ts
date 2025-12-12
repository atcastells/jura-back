import { createClient, SupabaseClient as SupabaseJsClient } from '@supabase/supabase-js';
import { Service } from 'typedi';

@Service()
export class SupabaseClient {
  private client: SupabaseJsClient | null = null;
  private adminClient: SupabaseJsClient | null = null;

  private supabaseUrl: string;
  private supabaseAnonKey: string;

  constructor(
    supabaseUrl: string,
    supabaseAnonKey: string,
  ) {
    this.supabaseUrl = supabaseUrl;
    this.supabaseAnonKey = supabaseAnonKey;
    this.initializeClient();
  }

  private initializeClient(): void {

    console.log('Initializing Supabase Client with:', {
      url: this.supabaseUrl,
      keyConfigured: !!this.supabaseAnonKey
    });

    if (!this.supabaseUrl || !this.supabaseAnonKey) {
      throw new Error(
        'SUPABASE_URL and SUPABASE_ANON_KEY must be defined in environment variables',
      );
    }

    this.client = createClient(this.supabaseUrl, this.supabaseAnonKey);
  }

  public getClient(): SupabaseJsClient {
    if (!this.client) {
      this.initializeClient();
    }
    return this.client!;
  }

  public getAdminClient(): SupabaseJsClient {
    if (!this.adminClient) {
      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

      if (!supabaseUrl || !supabaseServiceRoleKey) {
        throw new Error(
          'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be defined in environment variables',
        );
      }

      this.adminClient = createClient(supabaseUrl, supabaseServiceRoleKey);
    }
    return this.adminClient;
  }
}
