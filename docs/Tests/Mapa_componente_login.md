# Estrutura dos testes de login — GymWave-Strength

Pasta: `src/__tests__/components/login/`

Este documento explica o que cada pasta de testes faz e o que cada arquivo protege.

---

## Visão geral

O login é montado em camadas. Cada pasta de teste existe para vigiar uma delas:

```
 ui  →  hooks  →  context  →  gateway  →  crypto
 (tela) (cérebro) (crachá)    (porta)     (cofre de senha)
                      ↘ domain (as regras e o vocabulário) ↙
 security (guardas)   storage (gaveta por usuário)   routes (portões)
 static + legacy (fiscais: o que não pode voltar)
 helpers (ferramentas dos testes, não testam nada)
```

| Pasta | Em uma frase |
|---|---|
| `domain/` | As regras e o vocabulário do login |
| `gateway/` | A porta para quem sabe quem é o usuário |
| `crypto/` | O cofre de senhas |
| `security/` | Os guardas (log, tentativas, limpeza do legado) |
| `context/` | O crachá do app: "quem está logado?" |
| `hooks/` | O cérebro de cada formulário |
| `ui/` | As telas |
| `routes/` | Os portões de entrada |
| `storage/` | A gaveta de treino de cada pessoa |
| `legacy/` | O teste do fantasma: lixo antigo não entra |
| `static/` | Os fiscais de obra: leem os arquivos do projeto |
| `helpers/` | A caixa de ferramentas dos testes |

---

## `helpers/` — caixa de ferramentas

Não contém testes. Contém peças que os specs reaproveitam, para ninguém copiar e colar.

| Arquivo | O que faz |
|---|---|
| `fixtures.ts` | Dados e constantes comuns: a Ana, a senha válida, o relógio falso, os limites dos campos, o `forge` para fabricar entrada inválida. |
| `fakeGateway.ts` | Um gateway de mentira, com `vi.fn()` em cada método, e dois usuários prontos (`ANA` e `ADMIN`). |
| `mockGateway.ts` | Monta o `MockAuthGateway` de verdade com hash barato e relógio falso, e cadastra a Ana (`registerAna`). |
| `authState.ts` | Faz o `useAuth` falso das rotas, com estado que dá para trocar no meio do teste. |
| `deferred.ts` | Uma promessa que o teste resolve quando quiser, para observar o estado "carregando". |
| `files.ts` | Lê arquivos do projeto e lista os rastreados pelo git (usado pelos testes de `static/`). |
| `results.ts` | `unwrap()`: tira o valor de um resultado ok, ou falha dizendo qual era o erro. |
| `mockStorage.ts` | Ler, gravar e adulterar os usuários guardados pelo mock. |
| `formEvents.ts` | Eventos de digitar/enviar e o "dois cliques seguidos". |
| `consoleSpies.ts` | Silencia o console e confere que nenhuma senha foi escrita nele. |
| `domAssertions.ts` | Conferências de tela em comum: erro acessível, botão ocupado, segredo fora do DOM. |
| `uiProps.ts` | Props em comum de Login e Register. |

---

## `domain/` — o dicionário de regras

Código puro: sem tela, rede, storage nem relógio. É a base de todas as outras camadas.

| Arquivo | O que protege |
|---|---|
| `types.spec.ts` | O formato do usuário, os papéis (`user`, `admin`) e os estados do login (`loading`, `anonymous`, `authenticated`). |
| `result.spec.ts` | O jeito de uma operação dizer "deu certo" ou "deu errado" sem lançar exceção. |
| `authErrors.spec.ts` | Todo erro tem um código e uma mensagem em português, sem vazar detalhe interno nem revelar se o e-mail existe. |
| `parseEmail.spec.ts` | O que é um e-mail válido: aparado, minúsculo, até 254 caracteres, sem quebra de linha. |
| `loginSchema.spec.ts` | O login só exige campos preenchidos e não gigantes, sem política de senha. |
| `registerSchema.spec.ts` | O cadastro exige só e-mail, senha forte e confirmação. Descarta nome, `role`, CPF e similares, para não guardar dados pessoais além do e-mail. |

---

## `gateway/` — a porta para o servidor

O app fala com um contrato (`signIn`, `signUp`, `signOut`, `restore`, `sendPasswordReset`, `onAuthChange`). O adaptador por trás é trocável.

| Arquivo | O que protege |
|---|---|
| `MockAuthGateway.signUp.spec.ts` | Cadastro: id UUID, `role` sempre `user`, senha só em hash, e-mail duplicado, entrada inválida, falha de storage. |
| `MockAuthGateway.signIn.spec.ts` | Login: erro genérico, usuário imutável, rehash de contas com hash antigo, `role` inválida tratada como `user`. |
| `MockAuthGateway.session.spec.ts` | Sessão de 8 horas no `sessionStorage`, expiração, sessão corrompida, logout que avisa as outras abas. |
| `MockAuthGateway.passwordReset.spec.ts` | A recuperação de senha responde igual para e-mail existente e inexistente. |
| `MockAuthGateway.dummyHash.spec.ts` | E-mail inexistente também gasta o trabalho de um hash, para o tempo de resposta não denunciar quem tem conta. |
| `createAuthGateway.spec.ts` | A fábrica escolhe o mock em DEV e teste, e o gateway real em produção. Sem configuração, dá erro em vez de cair no mock. |
| `prodBundle.ci.spec.ts` | Depois do build, confere que nada do mock foi parar no `dist/` (só roda com `CHECK_DIST=1`). |
| `FirebaseAuthGateway.spec.ts` | O adaptador antigo do Firebase. **Sai na Rodada 2.** |

---

## `crypto/` — o cofre de senhas

| Arquivo | O que protege |
|---|---|
| `passwordHash.spec.ts` | Transforma a senha em hash com sal aleatório e 600.000 voltas de PBKDF2; confere uma senha contra o hash; compara sem vazar tempo; diz quando um registro antigo precisa ser refeito. |

---

## `security/` — os guardas

| Arquivo | O que protege |
|---|---|
| `logger.spec.ts` | Antes de escrever no console, apaga senha, token e CPF e mascara e-mails. Em produção fica mudo. |
| `loginThrottle.spec.ts` | A 5ª falha trava por 30 segundos; cada nova falha dobra a espera até 5 minutos. É atrito para o usuário, **não** proteção contra atacante (essa é do backend). |
| `legacyPurge.spec.ts` | Apaga do navegador o lixo da versão antiga (token falso, usuários com senha em texto) sem tocar nos treinos. |

---

## `context/` — o crachá do app

| Arquivo | O que protege |
|---|---|
| `AuthProvider.spec.tsx` | Responde "quem está logado?" para todas as telas. Começa em `loading`, consulta o gateway, oferece `signIn`, `signUp`, `signOut` e `sendPasswordReset`, avisa o storage de treino quem é o usuário e desloga quando outra aba desloga. |

---

## `hooks/` — o cérebro de cada tela

| Arquivo | O que protege |
|---|---|
| `useLoginForm.spec.tsx` | Guarda o que foi digitado, mostra erros só depois de sair do campo, normaliza o e-mail, barra clique duplo, consulta o throttle, traduz erros do gateway e navega para `/app` ou para uma origem segura. |
| `useRegisterForm.spec.tsx` | O mesmo para o cadastro, e mantém o checklist de requisitos da senha. |
| `usePasswordReset.spec.tsx` | Pede o e-mail, mostra sempre a mesma mensagem neutra e só deixa reenviar depois de 60 segundos. |

---

## `ui/` — as telas

| Arquivo | O que protege |
|---|---|
| `Login.spec.tsx` | Campos com label, `autocomplete` correto, erros acessíveis, botão ocupado, foco no primeiro campo inválido; a senha nunca aparece fora do `value` do input. |
| `Register.spec.tsx` | O mesmo para o cadastro, mais o checklist de requisitos e a garantia de que não existem campos de CPF, telefone ou endereço. |
| `AuthPage.spec.tsx` | Escolhe qual tela mostrar (login, cadastro, recuperação, carregando), manda quem já está logado para `/app` e troca de tela sem evento global. |

---

## `routes/` — os portões

| Arquivo | O que protege |
|---|---|
| `RequireAuth.spec.tsx` | Quem não está autenticado vai para o login; enquanto o app confere a sessão, mostra o indicador. |
| `RequireRole.spec.tsx` | Só deixa passar o papel exigido (por exemplo, `admin`). Isso é conforto de interface; a proteção real fica no backend. |
| `appRoutes.spec.tsx` | A tabela de rotas: o que é público, o que é protegido e o que é só de admin. |
| `safeRedirect.spec.ts` | Valida o destino pós-login e recusa endereços externos e perigosos (`//evil.com`, `javascript:`), caindo em `/app`. |

---

## `storage/` — a gaveta de cada pessoa

| Arquivo | O que protege |
|---|---|
| `userScopedStorage.spec.ts` | Os dados de treino ficam em chaves `gw:{id}:...`. Um usuário não vê os do outro, sair não apaga nada, os dados antigos globais migram uma vez para o primeiro usuário que logar, e JSON quebrado vira "vazio" sem derrubar o app. |

---

## `legacy/` — o teste do fantasma

| Arquivo | O que protege |
|---|---|
| `legacyAuth.integration.spec.tsx` | Com o navegador sujo da versão antiga (token falso, JWT forjado de admin, usuários com senha em texto), o app novo manda para o login, não libera o `/admin`, limpa o lixo na inicialização e recusa as senhas antigas. |

---

## `static/` — os fiscais de obra

Não executam o app: leem os arquivos do projeto e conferem que nada proibido voltou.

| Arquivo | O que protege |
|---|---|
| `regressions.spec.ts` | Nenhuma credencial fixa, nenhum arquivo legado, nenhum `console.*`, `alert` ou `dangerouslySetInnerHTML` nas telas de auth, nenhum `.env` no git, só variáveis `VITE_*` permitidas, e o throttle sem `Date.now()` nem storage. |
| `config.spec.ts` | A CSP do `vercel.json` sem `unsafe-inline`, os headers de segurança, e o CI com lint, `tsc`, testes com cobertura, `npm audit` e verificação do `dist`. |

---

## Como ler a lista de uma vez

- **domain**: as regras.
- **gateway**: a porta para o servidor.
- **crypto**: o cofre.
- **security**: os guardas.
- **context**: o crachá.
- **hooks**: o cérebro.
- **ui**: a tela.
- **routes**: os portões.
- **storage**: a gaveta de cada pessoa.
- **legacy**: o fantasma que não entra.
- **static**: os fiscais.
- **helpers**: as ferramentas.