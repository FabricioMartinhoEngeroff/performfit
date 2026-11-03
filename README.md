# 💪 PerformFit

**Treino e performance encaixados na sua vida.**

O professor monta a ficha numa planilha; o aluno importa no celular, marca as séries com um toque e acompanha as semanas completas. Pensado para **alunos iniciantes**, inclusive de mais idade: botões grandes, nada de anotar carga.

> Quem evoluir segue para o **GymWave Strength** (fase 2), focado em controle de carga e periodização. O PerformFit nasceu dele.

---

## 📖 Como funciona

1. **O professor monta a ficha** na planilha padrão (o app gera o modelo em *Baixar modelo de planilha*).
2. **O aluno importa a planilha** no próprio celular. O app confere tudo, mostra o resumo ("3 treinos · 18 exercícios · 3 dias por semana") e monta os treinos A, B, C…
3. **No treino, o aluno marca um quadrado por série feita.** Não precisa anotar peso nem repetições. Cada exercício mostra a explicação de como fazer e o vídeo.
4. **O app sugere o próximo treino da sequência** (fez A → hoje é B), mesmo que o aluno tenha faltado dias.
5. **Cada treino salvo vira motivação:** semanas completas, sequência 🔥 e séries por grupo muscular.

### Modelo de planilha

| Treino | Ordem | Exercício | Grupo muscular | Séries | Repetições | Como fazer |
|---|---|---|---|---|---|---|
| Treino A | 1 | Leg press | Quadríceps | 3 | 10-12 | Pés na largura do quadril, desça até 90° |
| Treino A | 2 | Cadeira flexora | Posterior | 3 | 10-12 | Suba controlando, sem tirar o quadril |
| Treino B | 1 | Supino máquina | Peitoral | 3 | 10-12 | Cotovelos um pouco abaixo do ombro |

- **Obrigatórias:** Treino, Exercício, Grupo muscular e Séries (1 a 6).
- **Dias por semana** = quantidade de treinos diferentes na planilha (de 1 a 7).
- **Formatos aceitos:** `.xlsx`, `.xls` ou `.csv`. Erros aparecem por linha ("Linha 5: falta o grupo muscular.") e nada é gravado até a planilha estar certa.

---

## ✨ O que o app faz

| Aba | O que mostra |
|---|---|
| **Treinar** | Treino sugerido do dia, exercícios na ordem da ficha, um checkbox por série, vídeo, explicação e o campo *"Como você estava neste exercício?"* (com a anotação da última vez) |
| **Semana** | "2 de 3 treinos", quanto falta para fechar a semana, sequência de semanas e séries por grupo muscular |
| **Evolução** | Sequência atual, recorde, total de semanas completas, calendário das últimas 12 semanas e séries por grupo no mês e no ano |
| **Perfil** | Ficha atual, trocar de ficha (o histórico continua) e backup em `.json` |

### Regras principais

- **Semana completa:** o aluno fez a quantidade de treinos da ficha entre segunda e domingo.
- **Folga:** 1 semana incompleta por mês não quebra a sequência.
- **Progresso parcial:** dá para avançar com séries faltando, e o app guarda o que foi feito.
- **Treino em andamento:** fica salvo a cada toque e volta se o app fechar.

As regras completas estão em **[docs/REGRAS_DE_NEGOCIO.md](./docs/REGRAS_DE_NEGOCIO.md)**. Cada regra tem um código (`RN-xx`) citado nos testes.

---

## 🚀 Rodando o projeto

**Requisitos:** Node.js 20+ e npm.

```bash
git clone https://github.com/FabricioMartinhoEngeroff/performfit.git
cd performfit
npm install
cp .env.example .env.local   # preencha as variáveis
npm run dev
```

Em seguida, abra o endereço que o Vite mostrar no terminal. Em desenvolvimento, o login usa um gateway falso, e o admin de teste vem de `DEV_ADMIN_EMAIL` e `DEV_ADMIN_PASSWORD`.

### Variáveis de ambiente (`.env.local`)

| Variável | Para quê |
|---|---|
| `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_APP_ID` | Login (Firebase Auth). Obrigatórias em produção |
| `VITE_RAPIDAPI_KEY` | GIF de demonstração dos exercícios sem vídeo (ExerciseDB) |
| `DEV_ADMIN_EMAIL`, `DEV_ADMIN_PASSWORD` | Admin só para `npm run dev`. Nunca vai para o build |

### Scripts

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Checagem de tipos + build de produção |
| `npm run test` | Testes em modo watch |
| `npm run test:run` | Roda todos os testes uma vez |
| `npm run test:coverage` | Testes com cobertura |
| `npm run lint` | ESLint |

---

## 🎥 Vídeos dos exercícios

Os vídeos são buscados pelo **nome do exercício**. A planilha não tem coluna de vídeo. Ao incluir um exercício novo nas fichas, cadastre o vídeo (ID do YouTube) em `src/data/exerciseVideos.ts`. Nomes alternativos do mesmo exercício vão em `src/data/exerciseAliases.ts`.

---

## 🗄️ Dados

- **Onde ficam:** tudo fica no **localStorage do celular do aluno**, separado por conta (`gw:{id do usuário}:{chave}`). Não existe servidor de dados.

  | Chave | Conteúdo |
  |---|---|
  | `plano` | Ficha importada (treinos e exercícios) |
  | `execucoes` | Histórico: séries feitas e anotações por exercício e treino. Nunca é apagado ao trocar de ficha |
  | `rascunho_treino` | Treinos em andamento |

- **O que apaga os dados:** limpar os dados do navegador apaga o histórico.
- **Backup:** o aluno exporta e importa um `.json` pela aba Perfil (`performfit_backup_AAAA-MM-DD.json`).

---

## 🛠️ Tecnologias

React 19 · TypeScript 5.7 · Vite 6 · React Router 7 · styled-components 6 · SheetJS (xlsx) · Firebase Auth · Vitest + Testing Library

O desenvolvimento segue **TDD**: a regra é escrita em `docs/REGRAS_DE_NEGOCIO.md`, depois vira teste e só então código. O CI (`.github/workflows/workflow-ci.yml`) roda lint, checagem de tipos, testes com cobertura, `npm audit` e o build de produção a cada pull request.

## 📁 Estrutura

```
src/
├── components/
│   ├── treinoSessao/   # Aba Treinar (checkboxes, vídeo, anotações)
│   ├── semana/         # Aba Semana
│   ├── evolucao/       # Aba Evolução
│   ├── perfil/         # Aba Perfil (ficha atual e backup)
│   ├── plano/          # Importação da planilha do professor
│   ├── progresso/      # Peças visuais compartilhadas (barras, navegação de período)
│   ├── layout/         # Barra de navegação inferior
│   └── login/          # Autenticação (Firebase / mock em dev)
├── utils/
│   ├── planoPerformfit.ts   # Leitura e validação da planilha, sequência sugerida
│   ├── execucoes.ts         # Histórico de séries e anotações
│   ├── semanas.ts           # Semana completa, sequência, folga, séries por grupo
│   └── backupPerformfit.ts  # Backup .json
├── data/               # Vídeos e apelidos dos exercícios
└── __tests__/          # Testes espelhando src/
docs/
└── REGRAS_DE_NEGOCIO.md     # Fonte de verdade das regras do sistema
```

---

## 🗺️ Próximos passos

- Escala de disposição de 0 a 10 no fim do treino ("Como você estava hoje?")
- Nuvem / painel do professor para acompanhar os alunos sem precisar do backup
- Remover as telas antigas herdadas do GymWave que ficaram sem uso
