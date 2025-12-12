import {
  createClient,
  SupabaseClient as SupabaseJsClient,
} from "@supabase/supabase-js";
import { Service } from "typedi";

@Service()
export class SupabaseClient {
  private client: SupabaseJsClient | undefined = undefined;
  private adminClient: SupabaseJsClient | undefined = undefined;

  private readonly supabaseUrl: string;
  private readonly supabaseAnonKey: string;
  private readonly supabaseServiceRoleKey: string;

  constructor(
    supabaseUrl: string,
    supabaseAnonKey: string,
    supabaseServiceRoleKey: string,
  ) {
    this.supabaseUrl = supabaseUrl;
    this.supabaseAnonKey = supabaseAnonKey;
    this.supabaseServiceRoleKey = supabaseServiceRoleKey;
    this.initializeClient();
  }

  private initializeClient(): void {
    console.log("Initializing Supabase Client with:", {
      url: this.supabaseUrl,
      keyConfigured: !!this.supabaseAnonKey,
    });

    if (!this.supabaseUrl || !this.supabaseAnonKey) {
      throw new Error("SUPABASE_URL and SUPABASE_ANON_KEY must be defined");
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
      if (!this.supabaseUrl || !this.supabaseServiceRoleKey) {
        throw new Error(
          "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be defined",
        );
      }

      this.adminClient = createClient(
        this.supabaseUrl,
        this.supabaseServiceRoleKey,
      );
    }
    return this.adminClient;
  }
}
