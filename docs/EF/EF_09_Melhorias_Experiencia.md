# EF_09 — Melhorias de Experiência do Aluno (PerformFit)

> Origem: revisão do código do PerformFit com sugestões de melhoria, em ordem de impacto.
> As regras oficiais ficam em [REGRAS_DE_NEGOCIO.md](../REGRAS_DE_NEGOCIO.md) (códigos `RN-xx`).
> Esta EF descreve **o que muda para o aluno** em cada melhoria, o status e onde estão os testes.
> Processo seguido em cada item: regra no documento → testes (vermelho) → código (verde).

---

## 1. Acesso

| Melhoria | Onde aparece | Componentes |
|---|---|---|
| M1 Gráficos | Aba **Evolução** e aba **Semana** | `Evolucao`, `Graficos`, `Semana`, `AnelProgresso` |
| M2 Treino inteiro | Aba **Treinar** | `TreinoSessao` |
| M3 Celebração | Aba **Treinar** e aba **Perfil** | `TreinoSessao`, `Perfil` |
| M4 Menos atrito | Aba **Treinar**, menu, **Perfil**, app inteiro | `TreinoSessao`, `BottomNav`, `InstalarApp` |
| M5 Pequenos detalhes | Código e documentação | — |

## 2. Atores e Permissões

**Aluno** autenticado, no próprio celular. Público: iniciantes, muitos de mais idade (alvos de toque grandes e textos ≥16px, RN-09).

## 3. Situação das melhorias

| # | Melhoria | Regras | Status |
|---|---|---|---|
| M1.1 | Gráfico de barras de treinos por semana com linha da meta | RN-06.9, RN-06.12 | Implementada |
| M1.2 | Gráfico de séries por semana + comparação com o mês passado | RN-06.10, RN-06.12 | Implementada |
| M1.3 | Anel de progresso da semana | RN-06.11 | Implementada |
| M2.1 | Lista do treino do dia, botão Começar / Continuar | RN-04.12 | Implementada |
| M2.2 | Barra de progresso do treino | RN-04.13 | Implementada |
| M2.3 | Avançar sozinho ao concluir o exercício, com opção de voltar | RN-04.14 | Implementada |
| M2.4 | Fim dos pontinhos de 14px | RN-04.15 | Implementada |
| M3.1 | Vibração e animação ao marcar série | RN-10.2 | Implementada |
| M3.2 | Confete (exercício, treino, semana) | RN-10.3 a RN-10.5 | Implementada |
| M3.3 | Frase motivacional pelo contexto | RN-10.6 | Implementada |
| M3.4 | Conquistas | RN-10.7 | Implementada |
| M3.5 | Faixa "Esta semana" na aba Treinar | RN-10.8 | Implementada |
| M4.1 | Data do treino por botões Hoje / Ontem / Outro dia | RN-11 | Implementada |
| M4.2 | Contraste dos cinzas | RN-09.5 | Implementada |
| M4.3 | Instalar no celular (PWA) | RN-12 | Implementada |
| M4.4 | Lembrete "faz 3 dias desde o último treino" | — | **Pendente** |
| M4.5 | Timer de descanso opcional | — | **Pendente** |
| M5.1 | Indentação irregular dos imports em `Evolucao.tsx` | — | **Pendente** |
| M5.2 | EF_02 ainda descreve o GymWave (Top Set) | — | **Pendente** |

---

## 4. Regras Gerais

### M1 — Gráfico de verdade

- **RG1** – A aba Evolução mostra o **gráfico de barras dos treinos por semana** das **últimas 12 semanas**, terminando na semana atual. Semanas sem treino aparecem com 0 (não somem do gráfico). Uma **linha tracejada laranja** marca a meta (dias por semana do plano, RN-03.1); a legenda escreve `Meta: 3 treinos por semana`. Barras que bateram a meta ficam verdes; as outras, azuis; cada barra mostra o número em cima. (RN-06.9)
- **RG2** – Abaixo, o **gráfico de área das séries por semana** (mesmas 12 semanas) e a frase de comparação com o mês passado. (RN-06.10)
- **RG3** – A comparação é **justa**: mês atual **até hoje** contra o mês passado **até o mesmo dia** (ex.: dia 4 compara 01–04/11 com 01–04/10). Comparar com o mês passado inteiro faria todo início de mês parecer uma queda. Se o mês passado é mais curto (dia 31), vale o mês passado inteiro. Porcentagem arredondada para inteiro. Mês passado sem séries no período → sem frase. (RN-06.10)
- **RG4** – O topo da aba Semana troca a barra segmentada por um **anel de progresso** que enche conforme os treinos da semana (`2/3 treinos`); ao completar, fica cheio, verde e com ícone de check. Nunca passa de cheio. (RN-06.11)
- **RG5** – Todo gráfico tem os mesmos números numa **tabela escondida para leitor de tela**. (RN-06.12)
- **RG6** – A biblioteca de gráficos (recharts, ~100 kB) é **carregada só ao abrir a Evolução**, para não deixar a abertura do app mais lenta.

### M2 — Ver o treino inteiro e o que falta

- **RG7** – Ao abrir um treino, o aluno vê primeiro a **lista do treino do dia**: todos os exercícios em ordem, cada um com o estado — concluído, parcial (`2/3`), `Pulado` ou não começado. Cada item é um botão de 56px que abre aquele exercício. (RN-04.12)
- **RG8** – Botão grande **Começar** (nada marcado) ou **Continuar** (treino em andamento: volta ao exercício onde parou). (RN-04.12)
- **RG9** – **Barra de progresso** `X de N exercícios` na lista e no exercício. Conta como feito: todas as séries marcadas **ou** pulado. (RN-04.13)
- **RG10** – Ao marcar a **última série que faltava**, o app vai sozinho para o próximo exercício e mostra `Leg press concluído` com o botão **Voltar para Leg press**. No último exercício não avança (o botão Ver Resumo fica em destaque). (RN-04.14)
- **RG11** – Os pontinhos de 14px foram removidos. No lugar, o botão **Ver lista do treino** (48px). (RN-04.15)

### M3 — Celebrar as conquistas

- **RG12** – **Ícones, não emojis:** a celebração usa ícones do app (lucide-react). Nada de ✓, ✅ ou 🔥 como ícone nessas telas. (RN-10.1)
- **RG13** – **Marcar série:** vibração de 30 ms e o check aparece com animação curta. Desmarcar não vibra. (RN-10.2)
- **RG14** – **Concluir exercício:** confete pequeno e vibração dupla (`40-60-40 ms`). (RN-10.3)
- **RG15** – **Salvar treino:** confete. Se o treino **fechou a semana**, confete grande. (RN-10.4)
- **RG16** – Vibração e confete são extras: iPhone (sem vibração no navegador) não quebra, e quem ligou **"reduzir movimento"** no celular não vê confete nem animação. (RN-10.5)
- **RG17** – **Frase motivacional** no salvamento, pela primeira regra que valer: semana fechada com sequência; semana fechada começando sequência; primeiro treino; senão, quanto falta para fechar a semana. (RN-10.6)
- **RG18** – **Conquistas:** Primeiro treino · 10 treinos · 4 semanas seguidas · 100 séries. São contadas sobre as execuções já guardadas. "4 semanas seguidas" usa o **recorde**, então não se perde. Conquista nova aparece no salvamento; a aba Perfil mostra todas, com quanto falta. (RN-10.7)
- **RG19** – **Faixa "Esta semana"** no topo da aba Treinar: Seg a Dom, ícone de check nos dias em que treinou, círculo vazio nos outros, hoje destacado. Como o PerformFit não amarra treino a dia da semana (RN-03.2), a faixa mostra os 7 dias, e não só "Seg, Qua, Sex". (RN-10.8)
- **RG20** – O cartão de "Treino salvo!" **fica na tela** até o aluno escolher outro treino (antes sumia em 5 s, pouco tempo para ler a frase e as conquistas).

### M4 — Menos atrito para pessoas simples

- **RG21** – **Data do treino:** o campo de texto `DD/MM/AAAA` foi removido. Botões grandes **Hoje** (padrão), **Ontem** e **Outro dia**; "Outro dia" abre o calendário do próprio celular, que não deixa escolher datas futuras. A data aparece por extenso: `Quarta-feira, 04/11/2026`. (RN-11.1 a RN-11.3)
- **RG22** – **Data nunca vira "hoje" em silêncio.** Antes, `parseDateBRToTs` trocava uma data mal digitada pela data de hoje sem avisar. Agora data vazia, impossível (31/02) ou futura mostra a mensagem e **bloqueia o salvamento**. (RN-11.4)
- **RG23** – **Contraste:** cinza de texto, ícone e borda de controle é `#6b7280` ou mais escuro. `#9ca3af` não é usado; `#d1d5db` só em bordas e fundos (nunca em texto, botão desativado ou placeholder). Um teste estático impede a volta dessas cores. (RN-09.5)
- **RG24** – **PWA:** manifesto (nome, tela cheia, retrato, cor `#2563eb`, ícones 192/512 e *maskable*), ícone para iPhone e service worker que guarda o app no celular: abre mais rápido e funciona sem internet (vídeos e GIFs continuam precisando de internet). Atualiza sozinho quando sai versão nova. (RN-12.1, RN-12.2)
- **RG25** – Cartão **Instalar no celular** no Perfil: Android → botão **Instalar o app**; iPhone → instrução do Safari; já instalado ou navegador sem suporte → cartão não aparece. (RN-12.3)
- **RG26** – A instalação só funciona em **HTTPS real** (produção) ou `localhost`; o certificado de teste da rede local não serve para o service worker. (RN-12.4)
- **RG27** – **Pendente — Lembrete:** aviso amigável na abertura, ex.: `Faz 3 dias desde o seu último treino. Bora?`. Reaproveitar `daysSince`, que hoje só mostra `N dias desde o último Treino A` no topo. A definir: a partir de quantos dias avisar e se conta qualquer treino ou o treino sugerido.
- **RG28** – **Pendente — Timer de descanso:** opcional, num botão grande que aparece depois de marcar a série (ex.: `Descansar 1:00`). A definir: tempo padrão, se vem da planilha do professor, e vibração ao terminar (RN-10.5 vale também aqui).

### M5 — Pequenos detalhes

- **RG29** – **Pendente:** corrigir a indentação dos imports de `src/components/evolucao/Evolucao.tsx` (rodar lint/format).
- **RG30** – **Pendente:** reescrever a EF_02 para o PerformFit (um checkbox por série, sem peso, lista do treino, celebração), ou marcá-la claramente como GymWave/fase 2. Hoje ela descreve Top Set / Back-off e confunde quem lê.

---

## 5. Tela

### 5.1 Aba Treinar

```
┌───────────────────────────────────┐
│ PerformFit                        │
├───────────────────────────────────┤
│ Seg Ter Qua Qui Sex Sáb Dom       │  ← faixa "Esta semana" (RG19)
│  ●   ○   ◉   ○   ○   ○   ○        │
├───────────────────────────────────┤
│ [cartão "Treino salvo!" (RG17)]   │  ← só depois de salvar
├───────────────────────────────────┤
│ TREINO  [Treino A][Treino B][...] │
│ Próximo da sequência: Treino A    │
│ DIA DO TREINO                     │
│ Quarta-feira, 04/11/2026          │  ← RG21
│ [ Hoje ][ Ontem ][ Outro dia ]    │
├───────────────────────────────────┤
│ SEU TREINO DE HOJE                │  ← lista (RG7)
│ 2 de 4 exercícios ▓▓▓▓░░░░        │  ← barra (RG9)
│ Leg press                    ✔    │
│ Cadeira flexora            2/3    │
│ Supino máquina          Pulado    │
│ Prancha                           │
│ [        Continuar        ]       │  ← RG8
└───────────────────────────────────┘
```

| Componente | Tipo | Regra |
|---|---|---|
| Faixa "Esta semana" | Lista de 7 dias com ícone | RG19 |
| Dia do treino | 3 botões (48px) + calendário nativo | RG21, RG22 |
| Lista do treino | Botões de 56px | RG7 |
| Começar / Continuar | Botão primário 56px | RG8 |
| Barra de progresso | `progressbar` | RG9 |
| Aviso de avanço | Faixa verde + botão **Voltar para…** | RG10 |
| Ver lista do treino | Botão 48px | RG11 |
| Checkbox de série | Botão 64px com ícone de check animado | RG13 |

### 5.2 Aba Semana

| Componente | Tipo | Regra |
|---|---|---|
| Anel de progresso | `progressbar` circular (132px) | RG4 |

### 5.3 Aba Evolução

| Componente | Tipo | Regra |
|---|---|---|
| Treinos por semana | Gráfico de barras + linha da meta + tabela escondida | RG1, RG5 |
| Séries por semana | Gráfico de área + frase + tabela escondida | RG2, RG3, RG5 |

### 5.4 Aba Perfil

| Componente | Tipo | Regra |
|---|---|---|
| Instalar no celular | Cartão com botão (Android) ou instrução (iPhone) | RG25 |
| Suas conquistas | Grade 2×2: troféu (ganha) ou cadeado + progresso | RG18 |

---

## 6. Mensagens do Sistema

| Identificador | Tipo | Cor | Texto |
|---|---|---|---|
| `[avancou]` | Aviso inline | Verde | `Leg press concluído` + botão `Voltar para Leg press` |
| `[comparacao_mais]` | Informativo | — | `Você fez 18% mais séries que no mesmo período do mês passado.` |
| `[comparacao_menos]` | Informativo | — | `Você fez 12% menos séries que no mesmo período do mês passado.` |
| `[comparacao_igual]` | Informativo | — | `Você fez o mesmo número de séries que no mesmo período do mês passado.` |
| `[meta_grafico]` | Legenda | Laranja | `Meta: 3 treinos por semana` |
| `[treino_salvo]` | Sucesso (fica na tela) | Verde | `Treino salvo!` + frase + `N séries em N exercícios` |
| `[frase_semana_seq]` | Motivacional | — | `Mais uma semana fechada! 4 semanas seguidas.` |
| `[frase_semana_1]` | Motivacional | — | `Semana fechada! Sua sequência começou.` |
| `[frase_primeiro]` | Motivacional | — | `Primeiro treino feito! O começo é o passo mais importante.` |
| `[frase_falta]` | Motivacional | — | `Falta 1 treino para fechar a semana.` / `Faltam 2 treinos para fechar a semana.` |
| `[nova_conquista]` | Destaque | Amarelo | `Nova conquista: 10 treinos` |
| `[data_vazia]` | Erro | Vermelho | `Escolha o dia do treino.` |
| `[data_futura]` | Erro | Vermelho | `A data do treino não pode ser no futuro.` |
| `[instalar_iphone]` | Instrução | — | `Toque em Compartilhar e depois em "Adicionar à Tela de Início".` |
| `[app_instalado]` | Sucesso | Verde | `App instalado! Procure o PerformFit na tela inicial.` |

---

## 7. Testes automatizados

| Melhoria | Arquivos de teste |
|---|---|
| M1 | `src/__tests__/utils/semanas.spec.ts`, `components/evolucao/Evolucao.spec.tsx`, `components/semana/Semana.spec.tsx` |
| M2 | `components/treinoSessao/ListaDoTreino.spec.tsx` (e ajustes em `TreinoSessao.spec.tsx`, `RascunhoLocalStorage.spec.tsx`) |
| M3 | `utils/conquistas.spec.ts`, `utils/celebrar.spec.ts`, `components/treinoSessao/Celebracao.spec.tsx`, `components/perfil/Perfil.spec.tsx` |
| M4.1 | `utils/datas.spec.ts`, `components/treinoSessao/DataDoTreino.spec.tsx` |
| M4.2 | `static/contraste.spec.ts` |
| M4.3 | `pwa/pwa.spec.ts`, `components/perfil/InstalarApp.spec.tsx` |

Caminhos relativos a `src/__tests__/`, exceto a primeira linha.

---

## 8. Ordem sugerida (e seguida)

1. Lista do treino do dia, com barra de progresso (M2).
2. Gráfico de barras semanal com a meta (M1).
3. Vibração, confete e conquistas (M3).
4. Seletor de data e contraste (M4.1, M4.2).
5. PWA (M4.3).

Próximos: lembrete (M4.4), timer de descanso (M4.5) e pequenos detalhes (M5).

---

## 9. Ajustes depois do teste com aluno (21/11/2026)

O retorno veio de um aluno testando no celular. Os três pontos foram corrigidos em TDD.

| # | O que estava ruim | Como ficou | Regra | Testes |
|---|---|---|---|---|
| A1 | Dois "Próximo" na tela (setas do topo e botão grande), mais o texto "Próximo da sequência" | Sem barra de setas no topo e sem botão Pular. Embaixo ficam só **Voltar** e **Próximo**. A posição aparece como "Exercício 2 de 6". Próximo sem série marcada conta como pulado. O texto virou "Treino sugerido: Lower B" | RN-04.16, RN-04.6, RN-03.3 | `treinoSessao/UmSoProximo.spec.tsx` |
| A2 | Semana "16/11 – 22/11" quebrada em 3 linhas e difícil de entender | Título "Esta semana" / "Semana passada" / "Há 3 semanas" e as datas por extenso numa linha só ("16 a 22 de novembro"). As setas têm 48px fixos: o `button { width: 100% }` global do `index.css` esticava as setas | RN-06.13 | `semana/Semana.spec.tsx`, `utils/semanas.spec.ts` |
| A3 | Dia do treino confuso (3 botões e calendário de uma vez, com data em números) | Mostra só "Hoje, sábado, 21 de novembro" e o botão "Treinei em outro dia". Hoje, Ontem e Outro dia só aparecem depois de tocar nele | RN-11.1 a RN-11.3 | `treinoSessao/DataDoTreino.spec.tsx`, `utils/datas.spec.ts` |

---

## 10. Mensagens de confirmação ao sair do treino (RN-13)

O módulo fica em `src/mensagens/` e vale para o sistema todo (`ConfirmacaoProvider` em `main.tsx`).

| Arquivo | Para que serve |
|---|---|
| `catalogo.ts` | Todas as mensagens de confirmação: título, texto, botão de confirmar e botão de ficar |
| `Confirmacao.tsx` | A caixa do app (`alertdialog`, botões de 56px, botão seguro primeiro e com foco, Esc ou toque fora = ficar) e o hook `useConfirmacao()` |
| `useSaidaProtegida.ts` | Segura o botão voltar do celular e o fechar/recarregar enquanto o treino não foi salvo |

Uso em qualquer tela:

```tsx
const confirmar = useConfirmacao();
if (await confirmar(CONFIRMACOES.sairDoTreino)) { /* sai */ }
```

| Situação | Mensagem | Regra |
|---|---|---|
| Trocar de aba com treino em andamento | Sair do treino? | RN-13.3 |
| Botão Sair da conta com treino em andamento | Sair da sua conta? | RN-13.4 |
| Botão voltar do celular | Sair do treino? | RN-13.5 |
| Fechar ou recarregar a página | Aviso do próprio navegador | RN-13.6 |

**Testes:** `mensagens/catalogo.spec.ts`, `mensagens/Confirmacao.spec.tsx`, `mensagens/useSaidaProtegida.spec.tsx`, `App.saida.spec.tsx`, `static/mensagens.spec.ts`.

**Pendente:** as telas de administração (`AdminImport`, `Exportar`, `ImportarBackupJson`) ainda usam `window.confirm`. Elas podem passar a usar o catálogo também.

---

## 11. Tela de erro amigável (RN-14)

Se algo quebrar, o aluno nunca vê tela branca:

```
        [ícone de alerta]
        Algo deu errado
  Seus dados estão salvos neste celular.
  Toque em Recarregar para voltar ao app.

  [        Recarregar        ]   ← principal, com foco
  [      Baixar backup       ]
```

| Onde o erro acontece | Quem pega |
|---|---|
| Dentro de uma rota (login, aluno, admin) | `errorElement: <ErroDeRota />` em todas as rotas (`router/appRoutes.tsx`). Sem isso, o React Router mostra a tela padrão dele, em inglês |
| Fora das rotas (AuthProvider, provedores) | `<ErroBoundary>` em volta de tudo, em `main.tsx` |
| Na inicialização (ex.: Firebase sem configuração) | `bootstrap().catch(...)` mostra a `TelaDeErro` |

- **Baixar backup** usa o mesmo `baixarBackup()` do Perfil (`utils/backupPerformfit.ts`). Se os dados estiverem com defeito e o backup não montar, baixa `performfit_dados_AAAA-MM-DD.json` com a cópia crua das chaves `gw:`.
- O erro técnico vai só para o console.
- Os textos ficam em `TELA_DE_ERRO`, no catálogo de mensagens.

**Testes:** `mensagens/TelaDeErro.spec.tsx`, `utils/baixarBackup.spec.ts`, `components/login/routes/rotasTelaDeErro.spec.tsx`, `static/mensagens.spec.ts`, `mensagens/catalogo.spec.ts`.
