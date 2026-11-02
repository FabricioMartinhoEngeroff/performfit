# GymWave-Strength — Estrutura do Projeto

Stack: **React 19 + TypeScript 5.7 + Vite 6.4 + styled-components 6**
Testes: **Vitest 4 + @testing-library/react + jsdom**

---

## Raiz

```
GymWave-Strength/
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── vite.config.ts          # Configuração Vite (HTTPS dev server)
├── vitest.config.ts        # Configuração Vitest (separada do vite para evitar conflito de certificado)
└── src/
```

---

## src/

```
src/
├── main.tsx                # Entrypoint — monta <App /> no DOM
├── App.tsx                 # Shell de 5 abas com BottomNav (tab state)
├── vite-env.d.ts

├── components/
│   ├── cyclesCard/         # Card de ciclo Saizen (C1–C4) com inputs de série
│   │   ├── index.tsx           # Exporta CycleCard (componente principal)
│   │   ├── CycleCard.logic.ts  # Lógica pura: cálculo de series, validação
│   │   ├── CycleCard.styles.ts # Styled-components do card
│   │   ├── CycleHeader.tsx     # Cabeçalho com nome e sigla do ciclo
│   │   ├── CycleInstruction.tsx# Instruções de rep-range
│   │   ├── ExerciseSection.tsx # Seção de exercício com campos de peso/rep
│   │   └── SeriesInputs.tsx    # Inputs de uma série (peso + rep)
│   │
│   ├── exportar/
│   │   └── Exportar.tsx        # Tela de exportação CSV / JSON
│   │
│   ├── graphic/            # Gráficos de intensidade por ciclo
│   │   ├── index.tsx
│   │   ├── GraphicsContainer.tsx  # Container principal com filtros
│   │   ├── ChartCard.tsx          # Card de um gráfico individual
│   │   └── SearchBar.tsx          # Barra de busca de exercício
│   │
│   ├── layout/
│   │   └── BottomNav.tsx       # Bottom navigation bar (5 abas)
│   │
│   ├── PowerliftChart/     # Gráfico estilo powerlifting dashboard
│   │   ├── index.tsx
│   │   └── styles.ts
│   │
│   ├── report/             # Tela de relatórios de treino
│   │   ├── index.tsx           # Exporta ReportPage
│   │   ├── ReportItem.tsx      # Item individual de relatório
│   │   ├── ReportList.tsx      # Lista de itens com paginação
│   │   ├── EditRow.tsx         # Linha em modo de edição
│   │   └── SearchBar.tsx       # Filtro de exercício + período
│   │
│   ├── treinoSessao/       # Tela principal de registro de treino (aba Registrar)
│   │   ├── TreinoSessao.tsx        # Componente principal
│   │   └── TreinoSessao.styles.ts  # Styled-components
│   │
│   ├── adminImport/        # Importação de planilha para seed do logbook
│   │   ├── AdminImport.tsx         # Upload .xlsx/.csv → normaliza → salva no logbook
│   │   └── AdminImport.styles.ts
│   │
│   ├── ui/                 # Componentes de UI reutilizáveis
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Select.tsx
│   │   ├── NativeSelect.tsx
│   │   ├── FormField.tsx
│   │   ├── CheckboxGroup.tsx
│   │   ├── DatePicker.tsx
│   │   └── IconButton.tsx
│   │
│   └── volumeLoad/
│       └── VolumeLoad.tsx      # Tela de Volume Load semanal por grupo muscular

├── contexts/               # Context API de autenticação
│   ├── AuthContext.ts          # Criação do contexto + interface AuthContextType
│   ├── AuthProvider.tsx        # Provider que implementa login/logout
│   ├── AuthProviderContext.tsx # Wiring do provider com contexto
│   └── useAuth.ts              # Hook para consumir AuthContext

├── data/                   # Dados estáticos / configuração
│   ├── cycles.ts               # Rotação de treinos: UA, UB, LA, LB, BR
│   ├── exercise.ts             # Lista master de exercícios (legado)
│   ├── exerciseAliases.ts      # Mesmo exercício com outro nome / exercício parecido (vídeo e GIF)
│   ├── muscleMap.ts            # Mapa exercício → grupo muscular
│   └── sessionExercises.ts     # Plano estático: exercícios por sessão com faixaTopSet,
│                               # faixaBackoff, backoffPct e seriesValidas (2 | 3).
│                               # seriesValidas=3 → exibe bloco "Série Extra" após back-off.
│                               # Fonte de verdade do plano; AdminImport e logbook herdam esse valor.

├── hooks/                  # Hooks customizados
│   ├── useBreakpoint.ts        # Detecta breakpoint responsivo
│   ├── useDadosTreino.ts       # Lê localStorage e transforma em DadosAgrupados p/ gráficos
│   ├── useLoginForm.ts         # Gerencia estado do formulário de login
│   └── useRelatorio.ts         # Carrega, filtra, edita e exclui linhas de relatório

├── pages/
│   └── loginPages/
│       ├── AuthPages.tsx       # Wrapper que alterna entre Login e Register
│       ├── Login.tsx           # Formulário de login (props-only, sem hooks internos)
│       └── Register.tsx        # Formulário de cadastro

├── router/
│   ├── PrivateRoute.tsx        # Rota protegida: verifica token no localStorage
│   └── RouterTEMP.tsx          # Router temporário (em revisão)

├── services/               # Camada de serviços (mock localStorage)
│   ├── authService.ts          # login() e register() com JWT simulado
│   └── userService.ts          # Operações de usuário

├── styles/
│   └── GlobalStyles.tsx        # Estilos globais e componentes de layout (RightPanel, LoginBox…)

├── types/                  # Tipos TypeScript compartilhados
│   ├── Form.ts                 # Tipos de formulário
│   ├── TrainingData.ts         # DadosTreino, RegistroTreino, LinhaRelatorio, SerieInfo…
│   └── User.ts                 # Interface User

└── utils/                  # Funções utilitárias puras
    ├── backupJson.ts           # Backup JSON v3 (lê v2/v1), mesclagem e desfazer
    ├── handleApiError.ts       # Tratamento padronizado de erros de API
    ├── planilhaSessoes.ts      # Sessões da planilha: prefixo de semana, id da sessão, cluster, exercício repetido
    ├── registros.ts            # Formato v3 do histórico: slug do exercício, conversões, CSV
    ├── storage.ts              # Logbook: salvarRegistro(), ultimoRegistro(), exercicioDeveSubirPeso()
    │                           # Legado: salvarDados() / carregarDados() → localStorage["dadosTreino"]
    ├── timeFilter.ts           # getCutoffTs() — corte de timestamp por intervalo (1M, 3M…)
    ├── validateUUID.ts         # Validação de UUID
    ├── validationErrors.ts     # Mensagens de erro centralizadas
    ├── validators.ts           # validateEmail, validateCPF, validatePhone, validatePassword…
    ├── volumeLoadCalc.ts       # calcVolumeLoad() — soma Volume Load por grupo muscular e semana ISO
    └── workoutMetrics.ts       # computeSessionPoint(), buildExerciseHistory() p/ gráficos
```

---

## src/__tests__/

Estrutura espelhando `src/` — cada módulo tem seu arquivo `.spec.ts(x)`.

```
src/__tests__/
├── setup/
│   └── vitest.setup.ts         # @testing-library/jest-dom + limpa localStorage antes/após cada teste

├── components/
│   ├── cyclesCard/
│   │   └── CycleCard.spec.tsx      # 5 testes — stub de renderização do card de ciclo
│   ├── exportar/
│   │   └── Exportar.spec.tsx       # 7 testes — renderização, contagem e download
│   ├── graphic/
│   │   └── GraphicsContainer.spec.tsx  # 5 testes — título, filtros, estado vazio
│   ├── layout/
│   │   └── BottomNav.spec.tsx      # 11 testes — abas, active state, callbacks
│   ├── report/
│   │   └── ReportPage.spec.tsx     # 5 testes — título, filtros, dados
│   ├── treinoSessao/
│   │   └── TreinoSessao.spec.tsx   # 22 testes — sessão, ciclo, navegação, auto-fill, conclusão
│   ├── ui/
│   │   └── Input.spec.tsx          # 6 testes — Input (3) e Button (3)
│   └── volumeLoad/
│       └── VolumeLoad.spec.tsx     # 6 testes — renderização e cálculo de volume

├── contexts/
│   └── AuthContext.spec.ts         # 4 testes — criação do contexto e hook useAuth

├── data/
│   ├── cycles.spec.ts              # 10 testes — integridade dos ciclos Saizen
│   ├── muscleMap.spec.ts           # 13 testes — cobertura do mapa exercício→músculo
│   └── sessionExercises.spec.ts    # 10 testes — mapeamento sessão→exercícios

├── hooks/
│   ├── useDadosTreino.spec.ts      # 4 testes — estado vazio, agrupamento, legado, topSet
│   └── useRelatorio.spec.ts        # 9 testes — carregamento, filtros, edição, exclusão

├── pages/
│   └── loginPages/
│       └── Login.spec.tsx          # 8 testes — renderização e interação do formulário

├── router/
│   └── PrivateRoute.spec.tsx       # 4 testes — acesso negado sem token, acesso com token

├── services/
│   └── authService.spec.ts         # 8 testes — register e login com mock localStorage

└── utils/
    ├── storage.spec.ts             # 7 testes — salvarDados / carregarDados
    ├── timeFilter.spec.ts          # 8 testes — getCutoffTs por intervalo
    ├── validators.spec.ts          # 18 testes — email, CPF, telefone, senha, campos vazios
    ├── volumeLoadCalc.spec.ts      # 10 testes — cálculo de volume por semana ISO
    └── workoutMetrics.spec.ts      # 13 testes — computeSessionPoint, buildExerciseHistory
```

**Total: 22 arquivos de teste | 211 testes passando**

---

## Modelo de dados (`localStorage`)

### `logbook` — histórico novo (fonte principal)
```
logbook: {
  [exercicio: string]: RegistroExercicio[]
}

RegistroExercicio {
  exercicio: string
  treinoId: string          // "UA" | "UB" | "LA" | "LB" | "BR"
  data: string              // "DD/MM/YYYY"
  dataTs: number            // timestamp para ordenação
  topSetKg: number
  topSetReps: number
  topSetFaixaMin/Max: number
  topSetBateuTeto: boolean  // reps >= faixaMax → sobe peso na próxima sessão
  backoffKg: number         // topSetKg × backoffPct (sugerido automaticamente)
  backoffReps: number
  backoffFaixaMin/Max: number
  seriesValidas: 2 | 3      // 3 → tem Série Extra (volume)
  extraKg?: number          // só presente quando seriesValidas === 3
  extraReps?: number
  progrediu: boolean
  obs?: string
}
```

### `dadosTreino` — legado (mantido para gráficos e relatórios)
```
dadosTreino: {
  [exercicio: string]: {
    [treinoId: string]: {
      data: string
      pesos: string[]
      reps: string[]
      obs?: string
      exercicio: string
    }
  }
}
```

## Método Saizen / Heavy Duty

Cada exercício tem **Top Set** (PR work) + **Back-off** (85% do Top Set) e opcionalmente **Série Extra** (volume, mesmo peso do back-off).

| Campo              | Descrição                                                   |
|--------------------|-------------------------------------------------------------|
| `seriesValidas: 2` | Top Set + Back-off (padrão para compostos e máquinas)       |
| `seriesValidas: 3` | Top Set + Back-off + Série Extra (isoladores de alto volume)|
| `topSetBateuTeto`  | reps ≥ faixaTopSet[1] → obrigatório subir peso (+1 ou +2kg) |

### Exercícios com `seriesValidas = 3` (definidos em `sessionExercises.ts`)

| Sessão   | Exercícios                                                              |
|----------|-------------------------------------------------------------------------|
| Upper A  | Elevação lateral livre, Elevação lateral cabo, Pull-around cabo, Crossover braço estendido |
| Upper B  | Elevação lateral livre, Elevação lateral cabo                          |
| Lower A  | Cadeira flexora sentada, Adutor máquina, Panturrilha em pé, Panturrilha sentado |
| Lower B  | Cadeira flexora deitado, Adutor máquina, Panturrilha leg press         |

## Sessões / Rotação

| ID  | Sessão   | Dia      | Foco principal                      |
|-----|----------|----------|-------------------------------------|
| UA  | Upper A  | Terça    | Peito, ombro, costas (cabos)        |
| UB  | Upper B  | Sexta    | Costas, ombro, peito                |
| LA  | Lower A  | Segunda  | Posterior, glúteo, panturrilha      |
| LB  | Lower B  | Quinta   | Quadríceps, posterior, panturrilha  |
| BR  | Braço    | Domingo  | Bíceps, tríceps isolados            |
