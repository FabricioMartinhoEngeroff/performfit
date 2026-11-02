# EF_01 — Login e Autenticação

---

## 1. Acesso

A tela é a rota raiz da aplicação (`/`). Toda vez que o usuário acessa o sistema sem sessão ativa é redirecionado para esta tela. A mesma rota alterna entre três modos: **Login**, **Cadastro** e **Esqueci minha senha**.

---

## 2. Atores e Permissões

| Perfil | Acesso | Observação |
|---|---|---|
| Administrador (`admin`) | Total | Acessa todas as abas e a rota `/admin` |
| Usuário autenticado (`user`) | Abas da aplicação | Não acessa `/admin` |
| Visitante (sem login) | Apenas `/` | Redirecionado para Login |

O perfil é sempre `user` no cadastro. O perfil `admin` só pode ser atribuído fora da aplicação (claim `role` no Firebase) e nunca é aceito a partir do formulário.

---

## 3. Regras Gerais

- **RG1** – Se o usuário já possui sessão ativa ao acessar `/`, é redirecionado automaticamente para `/app`. Enquanto a sessão é verificada, é exibido um indicador de carregamento (a tela de login não "pisca").
- **RG2** – A autenticação é feita por e-mail + senha, por meio de um gateway de autenticação:
  - **Produção:** Firebase Authentication. A sessão dura enquanto a aba/janela estiver aberta (`browserSessionPersistence`).
  - **Desenvolvimento e testes:** gateway local (mock), com senha armazenada apenas como hash PBKDF2-SHA-256 (600.000 iterações; 1.000 nos testes) e sessão de **8 horas** em `sessionStorage`.
  - O mock **nunca** entra no pacote de produção. Em produção sem as variáveis `VITE_FIREBASE_*` o app não inicia (não há fallback para o mock).
- **RG3** – Rotas protegidas (`/app`, `/graficos`, `/relatorio`, `/grafico-powerlifter`) exigem sessão, verificada por `RequireAuth`. Usuário não autenticado é redirecionado para `/` e, após o login, volta à rota que tentou acessar.
- **RG4** – A rota `/admin` exige sessão **e** perfil `admin` (`RequireRole`). Usuário comum é redirecionado para `/app`.
- **RG5** – O redirecionamento pós-login só aceita caminhos internos (iniciados por uma única `/`). URLs externas, `//host`, `javascript:` e caminhos com `\` são descartados e o destino passa a ser `/app`.
- **RG6** – O idioma da interface é Português – Brasil.
- **RG7** – Mensagens de falha de login são genéricas: o sistema nunca revela se o e-mail existe, se a senha está errada ou se a conta está bloqueada por outro motivo.
- **RG8** – Não há dados de usuário ou senha fixos no código-fonte, e nenhuma credencial, token ou e-mail é gravado em `localStorage`.
  - *Motivo:* o código do site é público (qualquer um lê pelo navegador). Uma conta "fixa" para alguém — por exemplo, um colega com treino próprio — exporia a senha dele e não resolveria nada: cada pessoa cria o próprio login, e o treino dela (plano importado e histórico) já fica separado por usuário (RG9).
- **RG9** – Ao sair (logout) ou quando a sessão expira, o usuário volta para `/`, os dados em memória são limpos e as demais abas abertas também são deslogadas. Os dados de treino permanecem gravados por usuário (`gw:{id}:{chave}`) e não são misturados entre contas.
- **RG10** – Ao iniciar, o sistema remove resquícios do login antigo (token, e-mail, flag `newUser` e lista de usuários do mock) do `localStorage` e do `sessionStorage`.
- **RG11** – Erros técnicos são registrados apenas em desenvolvimento e sem dados sensíveis (senha, token, e-mail completo). Nunca são exibidos ao usuário.
- **RG13** – **Dados pessoais mínimos:** o cadastro pede só **e-mail e senha** (mais a confirmação da senha, que não é guardada). Não se pede nome, CPF, telefone, endereço nem qualquer outro dado. Um nome (ou outro campo) enviado por fora da tela é descartado pelo schema e pelos gateways — nada além de e-mail e senha chega ao Firebase.
  - *Motivo:* quanto menos dado pessoal o sistema guarda, menor a responsabilidade do dono do app (LGPD) e o estrago em caso de vazamento. O app não precisa saber o nome de ninguém para registrar treino.
  - Contas criadas antes desta regra continuam funcionando; se tiverem nome salvo no Firebase, o cabeçalho ainda o mostra. Contas novas não têm nome e o cabeçalho exibe **"Olá, Usuário"**.
- **RG14** – **Como senha e e-mail ficam guardados (produção / Firebase):**
  - **Senha:** nunca é guardada em texto. O Firebase grava apenas um hash irreversível (scrypt, com sal por usuário e chave do projeto). Ninguém consegue ver a senha — nem o dono do app no console, nem numa exportação de usuários. O app envia a senha só para o Firebase (HTTPS) e não a grava no aparelho.
  - **E-mail:** fica guardado legível no Firebase Authentication, criptografado em disco pelo Google e acessível **apenas** ao dono do projeto (console do Firebase). Outros usuários e o código do app não conseguem listar e-mails.
  - *Motivo da escolha:* manter o e-mail legível preserva o **"Esqueci minha senha"** (o Firebase precisa do endereço para enviar o link) e dá ao dono um controle leve de quem usa o app. A alternativa avaliada — guardar só um código (hash) do e-mail — tiraria até do dono o acesso ao e-mail, mas quem esquecesse a senha perderia a conta. Ela foi descartada.
  - *Cuidado operacional:* o ponto fraco real é a conta Google do dono do projeto (quem entra nela vê os e-mails). Manter a **verificação em duas etapas** ativa nessa conta.
  - O aviso `[email_em_uso]` do cadastro permite descobrir se um e-mail específico já usa o app (não expõe nenhum outro dado). Risco aceito por enquanto.

---

## 4. Tela de Login

### 4.1 Campos

| Nº | Campo | Tipo | Obrig. | Estado inicial | Regras |
|---|---|---|---|---|---|
| 01 | E-mail | Input e-mail | Sim | Em branco | Sofre *trim* e conversão para minúsculas. Formato válido, máx. 254 caracteres. |
| 02 | Senha | Input senha | Sim | Em branco | Apenas obrigatória e máx. 128 caracteres. **Não** sofre *trim* nem alteração de caixa. Não valida complexidade (isso é do cadastro). |

- O campo de senha possui botão para mostrar/ocultar o valor.
- Atributos de acessibilidade: erros ligados aos campos (`aria-invalid`/`aria-describedby`), mensagens com `role="alert"` e foco no primeiro campo inválido ao enviar.

### 4.2 Botões

| Botão | Ação | Regras |
|---|---|---|
| **Entrar** | Autenticar o usuário | 1. Valida os campos; se inválidos, exibe o erro no campo (`[campo_obrigatorio]`, `[email_invalido]`, `[valor_longo]`) e não consulta o servidor. 2. Verifica o bloqueio por tentativas (RG12). 3. Se credenciais inválidas, emite `[credenciais_invalidas]`. 4. Se corretas, redireciona para a rota de origem (RG5) ou `/app`. Durante o envio o botão fica desabilitado ("Entrando…"), evitando duplo envio. |
| **Criar conta** | Alterna para o modo de cadastro | Os campos digitados não são levados para o outro modo. |
| **Esqueci minha senha** | Alterna para o modo de recuperação | — |

### 4.3 Proteção contra tentativas repetidas

- **RG12** – A cada falha de login o sistema conta as tentativas por e-mail. As **4 primeiras** falhas não têm espera. A partir da **5ª falha seguida** o botão fica bloqueado por **30 s**, dobrando a cada nova falha (30 → 60 → 120 → 240) até o máximo de **300 s**, e emite `[muitas_tentativas]` informando o tempo restante.
- O contador é zerado após um login bem-sucedido.
- O contador fica só em memória (reinicia ao recarregar a página). É uma proteção de usabilidade; o limite efetivo contra ataques é o do servidor (Firebase: `auth/too-many-requests`, também mapeado para `[muitas_tentativas]`).
- O mock executa a verificação de hash mesmo quando o e-mail não existe, para que o tempo de resposta não revele quais e-mails estão cadastrados.

---

## 5. Tela de Cadastro (Registro)

### 5.1 Campos

| Nº | Campo | Tipo | Obrig. | Estado inicial | Regras |
|---|---|---|---|---|---|
| 01 | E-mail | Input e-mail | Sim | Em branco | Mesmas regras do login (*trim*, minúsculas, formato, máx. 254). |
| 02 | Senha | Input senha | Sim | Em branco | Mín. 8 e máx. 128 caracteres, com ao menos: 1 maiúscula, 1 minúscula, 1 número e 1 caractere especial. Não sofre *trim*. |
| 03 | Confirmar senha | Input senha | Sim | Em branco | Deve ser igual à senha. Só confere a digitação; não é enviada nem guardada. |

- São só esses três campos: não existe campo de nome (RG13).
- Abaixo da senha é exibida uma lista de requisitos que é marcada (✓) em tempo real conforme cada regra é atendida.
- Os campos validam ao sair do campo (*blur*) e novamente ao enviar.
- O perfil (`role`) não é um campo: é sempre `user`. Qualquer valor de `role` enviado em chamadas diretas é ignorado.

### 5.2 Botões

| Botão | Ação | Regras |
|---|---|---|
| **Criar conta** | Criar conta no gateway de autenticação | 1. Valida todos os campos; senhas diferentes emitem `[senhas_diferentes]` no campo de confirmação. 2. Se o e-mail já existe, emite `[email_em_uso]`. 3. Em caso de sucesso a conta já nasce logada e redireciona para `/app`. Botão desabilitado durante o envio ("Cadastrando…"). |
| **Já tenho conta** | Alterna para o modo de Login | — |

---

## 6. Tela Esqueci Minha Senha

### 6.1 Campos

| Nº | Campo | Tipo | Obrig. | Estado inicial |
|---|---|---|---|---|
| 01 | E-mail | Input e-mail | Sim | Em branco |

### 6.2 Botões

| Botão | Ação | Regras |
|---|---|---|
| **Enviar link** | Solicitar e-mail de redefinição (Firebase) | 1. Valida o e-mail. 2. Sempre exibe a mesma mensagem neutra `[email_redefinicao]`, exista ou não a conta (RG7). 3. Após o envio, o botão fica bloqueado por **60 s** (cooldown), exibindo o tempo restante. |
| **Voltar ao login** | Alterna para o modo de Login | — |

---

## 7. Mensagens do Sistema

### 7.1 Mensagens do formulário

| Identificador | Tipo | Cor | Texto |
|---|---|---|---|
| `[campo_obrigatorio]` | Aviso | Vermelho (no campo) | Campo obrigatório. |
| `[email_invalido]` | Aviso | Vermelho (no campo) | Informe um e-mail válido. |
| `[valor_longo]` | Aviso | Vermelho (no campo) | Valor longo demais. |
| `[senha_curta]` | Aviso | Vermelho (no campo) | A senha deve ter pelo menos 8 caracteres. |
| `[senha_sem_maiuscula]` | Aviso | Vermelho (no campo) | A senha deve ter uma letra maiúscula. |
| `[senha_sem_minuscula]` | Aviso | Vermelho (no campo) | A senha deve ter uma letra minúscula. |
| `[senha_sem_numero]` | Aviso | Vermelho (no campo) | A senha deve ter um número. |
| `[senha_sem_especial]` | Aviso | Vermelho (no campo) | A senha deve ter um caractere especial. |
| `[senhas_diferentes]` | Aviso | Vermelho (no campo) | As senhas não conferem. |

### 7.2 Mensagens de autenticação

| Identificador | Tipo | Cor | Texto |
|---|---|---|---|
| `[credenciais_invalidas]` | Erro | Vermelho | E-mail ou senha inválidos. |
| `[muitas_tentativas]` | Erro | Vermelho | Muitas tentativas. Tente novamente em *N* segundos. (sem o tempo: "Muitas tentativas. Aguarde um pouco e tente novamente.") |
| `[email_em_uso]` | Erro | Vermelho | Este e-mail já está em uso. |
| `[senha_fraca]` | Erro | Vermelho | A senha escolhida é fraca. Use letras, números e símbolos. |
| `[dados_invalidos]` | Erro | Vermelho | Dados inválidos. Revise os campos e tente novamente. |
| `[sem_conexao]` | Erro | Vermelho | Não foi possível conectar. Verifique sua conexão e tente novamente. |
| `[erro_desconhecido]` | Erro | Vermelho | Algo deu errado. Tente novamente em instantes. |
| `[email_redefinicao]` | Informação | Neutra | Se o e-mail estiver cadastrado, enviaremos um link. |

---

## 8. Requisitos Não Funcionais de Segurança

- **Cabeçalhos HTTP** (`vercel.json`): Content-Security-Policy restritiva (somente origens do Firebase/Google necessárias para autenticação), `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy` e `Permissions-Policy`.
- **Código-fonte:** sem `console.*`/`alert` (regra de lint), sem `dangerouslySetInnerHTML`, sem `eval`; TypeScript com `strict` e `noUncheckedIndexedAccess`.
- **Configuração:** variáveis `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID` e `VITE_FIREBASE_APP_ID` (modelo em `.env.example`). Arquivos `.env` não são versionados.
- **Validação:** schemas `zod` compartilhados entre formulário e gateway; os códigos de erro são traduzidos para mensagens na interface.
- **Testes:** especificações em `src/__tests__/components/login/` (domínio, criptografia, gateways, segurança, contexto, rotas, hooks, UI, armazenamento por usuário e regressões estáticas), com cobertura mínima de 90% de linhas e *branches* na pasta `src/components/login`. Uma verificação de CI (`CHECK_DIST=1`) confirma que o mock e o PBKDF2 não estão no pacote de produção.
