import { createContext } from "react";
import type { AuthError } from "../domain/authErrors";
import type { Result } from "../domain/result";
import type { AuthUser } from "../domain/types";
import type { SignInInput, SignUpInput } from "../gateway/AuthGateway";

export interface AuthContextValue {
  status: "loading" | "anonymous" | "authenticated";
  user: AuthUser | null;
  signIn: (input: SignInInput) => Promise<Result<AuthUser, AuthError>>;
  signUp: (input: SignUpInput) => Promise<Result<AuthUser, AuthError>>;
  signOut: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<Result<void, AuthError>>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);
