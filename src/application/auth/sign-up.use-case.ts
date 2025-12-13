import { Service, Inject } from "typedi";
import { User } from "../../domain/user/user.js";
import { SupabaseClient } from "../../adapters/outbound/authentication/supabase-client.js";
import { HttpError } from "../../adapters/inbound/http/errors/http-error.js";
import { AuthRepository } from "../../domain/auth/auth-repository.js";
import { AUTH_REPOSITORY } from "../../infrastructure/constants.js";

@Service()
export class SignUpUseCase {
  constructor(
    @Inject(AUTH_REPOSITORY)
    private readonly authRepository: AuthRepository,
    @Inject(() => SupabaseClient)
    private readonly supabaseClient: SupabaseClient,
  ) {}

  async execute(
    email: string,
    password: string,
    organizationId: string,
  ): Promise<User> {
    // 1. Check if user already exists in MongoDB to prevent race condition
    const existingUser = await this.authRepository.findByEmail(email);
    if (existingUser) {
      throw new HttpError(409, "User with this email already exists");
    }

    const supabase = this.supabaseClient.getClient();

    // 2. Create user in Supabase
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
      throw new HttpError(500, "Supabase signup failed: No user data");
    }

    // 3. Check if user profile already exists (idempotency/edge case)
    const existingAuthUser = await this.authRepository.findByAuthId(
      data.user.id,
    );
    if (existingAuthUser) {
      return existingAuthUser;
    }

    // 4. Create user profile in MongoDB
    const user: Omit<User, "id"> = {
      email,
      authId: data.user.id,
      organizationId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return this.authRepository.create(user);
  }
}
