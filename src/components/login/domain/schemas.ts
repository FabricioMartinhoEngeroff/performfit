import { z } from "zod";
import { err, ok, type Result } from "./result";

// eslint-disable-next-line no-control-regex
const CONTROL_CHARS = /[\u0000-\u001f\u007f]/;
const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const EMAIL_MAX = 254;
const PASSWORD_MAX = 128;

export type EmailError = "REQUIRED" | "INVALID_EMAIL" | "TOO_LONG";

/** D2: o e-mail sofre trim e lowercase. */
export function parseEmail(input: unknown): Result<string, EmailError> {
  if (input === null || input === undefined) return err("REQUIRED");
  if (typeof input !== "string") return err("INVALID_EMAIL");
  const email = input.trim().toLowerCase();
  if (email === "") return err("REQUIRED");
  if (email.length > EMAIL_MAX) return err("TOO_LONG");
  if (CONTROL_CHARS.test(email) || !EMAIL_SHAPE.test(email)) return err("INVALID_EMAIL");
  return ok(email);
}

const emailField = z.unknown().transform((value, ctx) => {
  const parsed = parseEmail(value);
  if (!parsed.ok) {
    ctx.addIssue({ code: "custom", message: parsed.error });
    return z.NEVER;
  }
  return parsed.value;
});

/** D1: no login só valem "obrigatório" e "máximo 128". D2: senha nunca sofre trim. */
const loginPasswordField = z
  .string({ error: "REQUIRED" })
  .min(1, "REQUIRED")
  .max(PASSWORD_MAX, "TOO_LONG");

export interface PasswordRequirement {
  code: string;
  label: string;
  met: boolean;
}

export function getPasswordRequirements(password: string): PasswordRequirement[] {
  return [
    { code: "PASSWORD_TOO_SHORT", label: "Mínimo de 8 caracteres", met: password.length >= 8 },
    { code: "PASSWORD_NO_UPPERCASE", label: "Uma letra maiúscula", met: /[A-Z]/.test(password) },
    { code: "PASSWORD_NO_LOWERCASE", label: "Uma letra minúscula", met: /[a-z]/.test(password) },
    { code: "PASSWORD_NO_NUMBER", label: "Um número", met: /[0-9]/.test(password) },
    { code: "PASSWORD_NO_SPECIAL", label: "Um caractere especial", met: /[^A-Za-z0-9]/.test(password) },
  ];
}

const registerPasswordField = z
  .string({ error: "REQUIRED" })
  .min(1, "REQUIRED")
  .superRefine((password, ctx) => {
    if (password === "") return;
    if (password.length > PASSWORD_MAX) {
      ctx.addIssue({ code: "custom", message: "TOO_LONG" });
      return;
    }
    for (const req of getPasswordRequirements(password)) {
      if (!req.met) ctx.addIssue({ code: "custom", message: req.code });
    }
  });

export const loginSchema = z.object({
  email: emailField,
  password: loginPasswordField,
});

/**
 * Entrada do gateway no cadastro: só e-mail e senha, para não guardar outros dados pessoais.
 * Chaves extras (ex.: role, name) são descartadas (D4).
 */
export const signUpSchema = z.object({
  email: emailField,
  password: registerPasswordField,
});

export const registerSchema = z
  .object({
    email: emailField,
    password: registerPasswordField,
    confirmPassword: z.string({ error: "REQUIRED" }).min(1, "REQUIRED"),
  })
  .superRefine((data, ctx) => {
    if (data.confirmPassword !== data.password) {
      ctx.addIssue({ code: "custom", path: ["confirmPassword"], message: "PASSWORDS_DONT_MATCH" });
    }
  });

export type LoginInput = z.output<typeof loginSchema>;
export type SignUpInput = z.output<typeof signUpSchema>;
export type RegisterInput = z.output<typeof registerSchema>;
