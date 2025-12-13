import { Service, Inject } from "typedi";
import { User } from "../../domain/user/user.js";
import { SupabaseClient } from "../../adapters/outbound/authentication/supabase-client.js";
import { AuthRepository } from "../../domain/auth/auth-repository.js";
import { AUTH_REPOSITORY } from "../../infrastructure/constants.js";

@Service()
export class ValidateTokenUseCase {
  constructor(
    @Inject(AUTH_REPOSITORY)
    private readonly authRepository: AuthRepository,
    @Inject(() => SupabaseClient)
    private readonly supabaseClient: SupabaseClient,
  ) {}

  async execute(token: string): Promise<User | undefined> {
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
