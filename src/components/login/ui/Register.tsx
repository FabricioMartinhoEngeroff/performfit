import { useEffect, useRef } from "react";
import { FaEnvelope, FaLock } from "react-icons/fa";
import { Button } from "../../ui/Button";
import { Footer, FormContainer, LoginBox, RightPanel } from "../../../styles/GlobalStyles";
import type { UseRegisterFormReturn } from "../hooks/useRegisterForm";
import { AuthField } from "./AuthField";
import { FormAlert, LinkButton } from "./Login";

export type RegisterProps = UseRegisterFormReturn & {
  onToggleLogin: () => void;
};

const FIELD_ORDER = ["email", "password", "confirmPassword"] as const;

export function Register({
  formData,
  errors,
  formError,
  loading,
  passwordVisible,
  submitCount,
  requirements,
  handleChange,
  handleBlur,
  handleSubmit,
  togglePasswordVisibility,
  onToggleLogin,
}: RegisterProps) {
  const refs = {
    email: useRef<HTMLInputElement>(null),
    password: useRef<HTMLInputElement>(null),
    confirmPassword: useRef<HTMLInputElement>(null),
  };

  useEffect(() => {
    if (submitCount === 0) return;
    const first = FIELD_ORDER.find((f) => errors[f]);
    if (first) refs[first].current?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submitCount]);

  return (
    <RightPanel>
      <LoginBox>
        <h1>Crie sua conta</h1>

        <form onSubmit={handleSubmit} noValidate>
          <FormContainer>
            <AuthField
              id="register-email"
              name="email"
              label="E-mail"
              type="email"
              icon={FaEnvelope}
              autoComplete="email"
              inputMode="email"
              maxLength={254}
              value={formData.email}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.email}
              inputRef={refs.email}
            />
            <AuthField
              id="register-password"
              name="password"
              label="Senha"
              icon={FaLock}
              autoComplete="new-password"
              maxLength={128}
              value={formData.password}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.password}
              inputRef={refs.password}
              passwordVisible={passwordVisible}
              onTogglePassword={togglePasswordVisibility}
            />

            <ul aria-label="Requisitos da senha" style={{ listStyle: "none", margin: 0, padding: 0, textAlign: "left" }}>
              {requirements.map((r) => (
                <li key={r.code} data-met={r.met ? "true" : "false"} style={{ color: r.met ? "#198754" : "#6c757d" }}>
                  <span aria-hidden="true">{r.met ? "✓" : "○"} </span>
                  {r.label}
                </li>
              ))}
            </ul>

            <AuthField
              id="register-confirm"
              name="confirmPassword"
              label="Confirmar senha"
              icon={FaLock}
              autoComplete="new-password"
              maxLength={128}
              value={formData.confirmPassword}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.confirmPassword}
              inputRef={refs.confirmPassword}
              passwordVisible={passwordVisible}
              onTogglePassword={togglePasswordVisibility}
            />

            {formError && <FormAlert role="alert">{formError}</FormAlert>}

            <Button type="submit" disabled={loading} aria-busy={loading ? "true" : undefined}>
              {loading ? "Cadastrando…" : "Criar conta"}
            </Button>
          </FormContainer>
        </form>

        <Footer style={{ cursor: "default" }}>
          <LinkButton type="button" onClick={onToggleLogin}>
            Já tenho conta
          </LinkButton>
        </Footer>
      </LoginBox>
    </RightPanel>
  );
}
