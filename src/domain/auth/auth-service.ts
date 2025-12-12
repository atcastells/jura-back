import { Service, Inject } from "typedi";
import { User } from "../user/user.js";
import { SupabaseClient } from "../../adapters/outbound/authentication/supabase-client.js";
import { HttpError } from "../../adapters/inbound/http/errors/http-error.js";
import { AuthRepository } from "./auth-repository.js";

@Service()
export class AuthService {
  constructor(
    @Inject("AuthRepository")
    private readonly authRepository: AuthRepository,
    @Inject(() => SupabaseClient)
    private readonly supabaseClient: SupabaseClient,
  ) {}

  async signup(
    email: string,
    password: string,
    organizationId: string,
  ): Promise<User> {
    const supabase = this.supabaseClient.getClient();

    // 1. Create user in Supabase
    console.log("Attempting Supabase signup for:", email);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      console.error("Supabase signup error:", error);
      const status = error.status ?? 400;
      throw new HttpError(status, error.message || "Supabase signup failed");
    }

    if (!data.user) {
      console.error("Supabase signup succeeded but no user returned:", data);
      throw new Error("Supabase signup failed: No user data");
    }

    // 2. Check if user profile already exists (idempotency/edge case)
    const existingUser = await this.authRepository.findByAuthId(data.user.id);
    if (existingUser) {
      return existingUser;
    }

    // 3. Create user profile in MongoDB
    const user: Omit<User, "id"> = {
      email,
      authId: data.user.id,
      organizationId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return this.authRepository.create(user);
  }

  async signin(
    email: string,
    password: string,
  ): Promise<{ token: string; user: User }> {
    const supabase = this.supabaseClient.getClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.session) {
      const status = error ? (error.status ?? 400) : 401;
      throw new HttpError(status, error?.message || "Signin failed");
    }

    // Fetch full user profile from MongoDB
    const user = await this.authRepository.findByAuthId(data.user.id);
    if (!user) {
      throw new Error("User profile not found");
    }

    return { token: data.session.access_token, user };
  }

  async validateToken(token: string): Promise<User | undefined> {
    const supabase = this.supabaseClient.getClient();

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      return undefined;
    }

    return this.authRepository.findByAuthId(user.id);
  }
}
