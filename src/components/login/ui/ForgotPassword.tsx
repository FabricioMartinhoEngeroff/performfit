import { FaEnvelope } from "react-icons/fa";
import { Button } from "../../ui/Button";
import { Footer, FormContainer, LoginBox, RightPanel } from "../../../styles/GlobalStyles";
import { usePasswordReset } from "../hooks/usePasswordReset";
import { AuthField } from "./AuthField";
import { FormAlert, LinkButton } from "./Login";

export function ForgotPassword({ onBack }: { onBack: () => void }) {
  const { email, error, message, loading, cooldownRemaining, handleChange, handleSubmit } = usePasswordReset();

  return (
    <RightPanel>
      <LoginBox>
        <h1>Recuperar senha</h1>

        <form onSubmit={handleSubmit} noValidate>
          <FormContainer>
            <AuthField
              id="reset-email"
              name="email"
              label="E-mail"
              type="email"
              icon={FaEnvelope}
              autoComplete="email"
              inputMode="email"
              maxLength={254}
              value={email}
              onChange={handleChange}
              onBlur={() => undefined}
              error={error ?? undefined}
            />

            {message && <p role="status">{message}</p>}
            {cooldownRemaining > 0 && message && (
              <FormAlert role="alert">Você poderá reenviar em até {cooldownRemaining} segundos.</FormAlert>
            )}

            <Button type="submit" disabled={loading} aria-busy={loading ? "true" : undefined}>
              {loading ? "Enviando…" : "Enviar link"}
            </Button>
          </FormContainer>
        </form>

        <Footer style={{ cursor: "default" }}>
          <LinkButton type="button" onClick={onBack}>
            Voltar ao login
          </LinkButton>
        </Footer>
      </LoginBox>
    </RightPanel>
  );
}
