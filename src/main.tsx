import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { AuthProvider } from "./components/login/context/AuthProvider";
import { createAuthGateway } from "./components/login/gateway/createAuthGateway";
import "./index.css";
import { router } from "./router/RouterTEMP";
import { GlobalStyles } from "./styles/GlobalStyles";
import { iniciarCapturaInstalacao } from "./utils/instalacao";

// RN-12.3: o Chrome pede a instalação logo ao abrir; guarda o pedido para o Perfil.
iniciarCapturaInstalacao();

async function bootstrap() {
  // D9: em produção sem config do Firebase isto lança, e o app não inicia.
  const gateway = await createAuthGateway(import.meta.env);

  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <AuthProvider gateway={gateway}>
        <GlobalStyles />
        <RouterProvider router={router} />
      </AuthProvider>
    </StrictMode>
  );
}

void bootstrap();
