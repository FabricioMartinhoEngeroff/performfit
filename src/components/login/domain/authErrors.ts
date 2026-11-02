export const AUTH_ERRORS = [
  "INVALID_CREDENTIALS",
  "TOO_MANY_ATTEMPTS",
  "NETWORK",
  "EMAIL_IN_USE",
  "WEAK_PASSWORD",
  "INVALID_INPUT",
  "UNKNOWN",
] as const;

export type AuthError = (typeof AUTH_ERRORS)[number];

export const authErrorMessages: Record<AuthError, string> = {
  INVALID_CREDENTIALS: "E-mail ou senha inválidos.",
  TOO_MANY_ATTEMPTS: "Muitas tentativas. Aguarde um pouco e tente novamente.",
  NETWORK: "Não foi possível conectar. Verifique sua conexão e tente novamente.",
  EMAIL_IN_USE: "Este e-mail já está em uso.",
  WEAK_PASSWORD: "A senha escolhida é fraca. Use letras, números e símbolos.",
  INVALID_INPUT: "Dados inválidos. Revise os campos e tente novamente.",
  UNKNOWN: "Algo deu errado. Tente novamente em instantes.",
};

export function getAuthErrorMessage(
  code: AuthError,
  opts: { retryAfterSeconds?: number } = {},
): string {
  if (code === "TOO_MANY_ATTEMPTS" && opts.retryAfterSeconds !== undefined) {
    return `Muitas tentativas. Tente novamente em ${opts.retryAfterSeconds} segundos.`;
  }
  return authErrorMessages[code];
}

/** Mensagens (PT-BR) para os códigos de validação dos schemas. */
const fieldErrorMessages: Record<string, string> = {
  REQUIRED: "Campo obrigatório.",
  INVALID_EMAIL: "Informe um e-mail válido.",
  TOO_LONG: "Valor longo demais.",
  PASSWORD_TOO_SHORT: "A senha deve ter pelo menos 8 caracteres.",
  PASSWORD_NO_UPPERCASE: "A senha deve ter uma letra maiúscula.",
  PASSWORD_NO_LOWERCASE: "A senha deve ter uma letra minúscula.",
  PASSWORD_NO_NUMBER: "A senha deve ter um número.",
  PASSWORD_NO_SPECIAL: "A senha deve ter um caractere especial.",
  PASSWORDS_DONT_MATCH: "As senhas não conferem.",
};

export function getFieldErrorMessage(code: string): string {
  return fieldErrorMessages[code] ?? authErrorMessages.INVALID_INPUT;
}
