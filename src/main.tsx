import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { AuthProvider } from "./components/login/context/AuthProvider";
import { createAuthGateway } from "./components/login/gateway/createAuthGateway";
import "./index.css";
import { router } from "./router/RouterTEMP";
import { GlobalStyles } from "./styles/GlobalStyles";
import { iniciarCapturaInstalacao } from "./utils/instalacao";
import { ConfirmacaoProvider } from "./mensagens/Confirmacao";
import { ErroBoundary, TelaDeErro } from "./mensagens/TelaDeErro";

// RN-12.3: o Chrome pede a instalação logo ao abrir; guarda o pedido para o Perfil.
iniciarCapturaInstalacao();

const raiz = createRoot(document.getElementById("root")!);

async function bootstrap() {
  // D9: em produção sem config do Firebase isto lança, e o app não inicia.
  const gateway = await createAuthGateway(import.meta.env);

  raiz.render(
    <StrictMode>
      {/* RN-14.1: qualquer tela que quebrar mostra a tela de erro, nunca tela branca */}
      <ErroBoundary>
        <AuthProvider gateway={gateway}>
          <GlobalStyles />
          {/* RN-13: caixa de confirmação disponível em todo o sistema */}
          <ConfirmacaoProvider>
            <RouterProvider router={router} />
          </ConfirmacaoProvider>
        </AuthProvider>
      </ErroBoundary>
    </StrictMode>
  );
}

// RN-14.1: se nem a inicialização der certo, mostra a tela de erro em vez de tela branca.
bootstrap().catch((erro: unknown) => {
  // eslint-disable-next-line no-console -- RN-14.1: diagnóstico da falha ao iniciar
  console.error("[PerformFit] Falha ao iniciar:", erro);
  raiz.render(<TelaDeErro />);
});
