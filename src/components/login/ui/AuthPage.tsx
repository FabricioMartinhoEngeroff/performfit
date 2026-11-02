import { useState } from "react";
import { Navigate } from "react-router-dom";
import { Container, LeftPanel, LogoText, RightPanel } from "../../../styles/GlobalStyles";
import { useAuth } from "../context/useAuth";
import { useLoginForm } from "../hooks/useLoginForm";
import { useRegisterForm } from "../hooks/useRegisterForm";
import { AuthLoading } from "./AuthLoading";
import { ForgotPassword } from "./ForgotPassword";
import { Login } from "./Login";
import { Register } from "./Register";

type Mode = "login" | "register" | "forgot";

// Cada modo é um componente próprio: ao alternar, o estado do formulário anterior
// (erros e senhas) é descartado junto com o componente.
function LoginMode({ setMode }: { setMode: (m: Mode) => void }) {
  const form = useLoginForm();
  return <Login {...form} onToggleRegister={() => setMode("register")} onForgotPassword={() => setMode("forgot")} />;
}

function RegisterMode({ setMode }: { setMode: (m: Mode) => void }) {
  const form = useRegisterForm();
  return <Register {...form} onToggleLogin={() => setMode("login")} />;
}

export function AuthPage() {
  const { status } = useAuth();
  const [mode, setMode] = useState<Mode>("login");

  if (status === "authenticated") return <Navigate to="/app" replace />;

  return (
    <Container>
      <LeftPanel>
        <LogoText as="p">Bem-vindo</LogoText>
        <LogoText as="p">PerformFit</LogoText>
        <p style={{ fontSize: 16, color: "#4b5563", margin: 0 }}>Treino e performance encaixados na sua vida</p>
      </LeftPanel>
      {status === "loading" ? (
        <RightPanel>
          <AuthLoading />
        </RightPanel>
      ) : mode === "register" ? (
        <RegisterMode setMode={setMode} />
      ) : mode === "forgot" ? (
        <ForgotPassword onBack={() => setMode("login")} />
      ) : (
        <LoginMode setMode={setMode} />
      )}
    </Container>
  );
}
