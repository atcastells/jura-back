import "reflect-metadata";
import { Service, Inject } from "typedi";
import { User } from "../../domain/user/user.js"
import { SupabaseClient } from "../../adapters/outbound/authentication/supabase-client.js";
import { HttpError } from "../../adapters/inbound/http/errors/http-error.js";
import { AuthRepository } from "../../domain/auth/auth-repository.js";
import { AUTH_REPOSITORY } from "../../infrastructure/constants.js";

@Service()
export class SignInUseCase {
  constructor(
    @Inject(AUTH_REPOSITORY)
    private readonly authRepository: AuthRepository,
    @Inject(() => SupabaseClient)
    private readonly supabaseClient: SupabaseClient,
  ) {}

  async execute(
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
      throw new HttpError(404, "User profile not found");
    }

    return { token: data.session.access_token, user };
  }
}
