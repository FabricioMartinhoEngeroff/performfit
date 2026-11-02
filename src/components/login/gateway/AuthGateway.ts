import type { AuthError } from "../domain/authErrors";
import type { Result } from "../domain/result";
import type { AuthUser } from "../domain/types";

export interface SignInInput {
  email: string;
  password: string;
}

export interface SignUpInput {
  email: string;
  password: string;
}

export interface AuthGateway {
  signIn(input: SignInInput): Promise<Result<AuthUser, AuthError>>;
  signUp(input: SignUpInput): Promise<Result<AuthUser, AuthError>>;
  signOut(): Promise<void>;
  restore(): Promise<AuthUser | null>;
  onAuthChange(cb: (user: AuthUser | null) => void): () => void;
  sendPasswordReset(email: string): Promise<Result<void, AuthError>>;
}
