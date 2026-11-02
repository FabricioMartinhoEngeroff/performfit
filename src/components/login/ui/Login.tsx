import { useEffect, useRef } from "react";
import { FaEnvelope, FaLock } from "react-icons/fa";
import styled from "styled-components";
import { Button } from "../../ui/Button";
import { Footer, FormContainer, LoginBox, RightPanel } from "../../../styles/GlobalStyles";
import type { UseLoginFormReturn } from "../hooks/useLoginForm";
import { AuthField } from "./AuthField";

export const LinkButton = styled.button`
  background: none;
  border: none;
  padding: 0;
  color: #0066cc;
  text-decoration: underline;
  cursor: pointer;
  font-size: inherit;
`;

export const FormAlert = styled.p`
  color: #dc3545;
  font-size: 14px;
  margin: 0;
  text-align: left;
`;

export type LoginProps = UseLoginFormReturn & {
  onToggleRegister: () => void;
  onForgotPassword: () => void;
};

/** Tela de login: tudo chega via props (nenhum hook de dados aqui dentro). */
export function Login({
  formData,
  errors,
  formError,
  loading,
  passwordVisible,
  submitCount,
  handleChange,
  handleBlur,
  handleSubmit,
  togglePasswordVisibility,
  onToggleRegister,
  onForgotPassword,
}: LoginProps) {
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  // Após um submit inválido, leva o foco ao primeiro campo com erro.
  useEffect(() => {
    if (submitCount === 0) return;
    if (errors.email) emailRef.current?.focus();
    else if (errors.password) passwordRef.current?.focus();
    // Só reage a um novo submit; os erros já estão atualizados nesse mesmo render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submitCount]);

  return (
    <RightPanel>
      <LoginBox>
        <h1>Acesse sua conta</h1>

        <form onSubmit={handleSubmit} noValidate>
          <FormContainer>
            <AuthField
              id="login-email"
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
              inputRef={emailRef}
            />
            <AuthField
              id="login-password"
              name="password"
              label="Senha"
              icon={FaLock}
              autoComplete="current-password"
              maxLength={128}
              value={formData.password}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.password}
              inputRef={passwordRef}
              passwordVisible={passwordVisible}
              onTogglePassword={togglePasswordVisibility}
            />

            {formError && <FormAlert role="alert">{formError}</FormAlert>}

            <Button type="submit" disabled={loading} aria-busy={loading ? "true" : undefined}>
              {loading ? "Entrando…" : "Entrar"}
            </Button>
          </FormContainer>
        </form>

        <Footer style={{ flexDirection: "column", gap: 8, alignItems: "center", cursor: "default" }}>
          <LinkButton type="button" onClick={onForgotPassword}>
            Esqueci minha senha
          </LinkButton>
          <span style={{ color: "#333" }}>
            Ainda não tem conta?{" "}
            <LinkButton type="button" onClick={onToggleRegister}>
              Cadastre-se
            </LinkButton>
          </span>
        </Footer>
      </LoginBox>
    </RightPanel>
  );
}
