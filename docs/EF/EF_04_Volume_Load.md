# EF_04 — Volume Load por Músculo

---

## 1. Acesso

Aba **Volume** na barra de navegação inferior (ícone de raio).

Componente: `VolumeLoad`

---

## 2. Atores e Permissões

Qualquer usuário autenticado com dados registrados possui acesso.

---

## 3. Regras Gerais

- **RG1** – O cálculo é feito automaticamente com base no histórico do usuário: os `registros` (lidos como logbook, ver EF_02 RG19) e o histórico antigo em `dadosTreino`.
- **RG1.1** – **Cada treino conta uma vez só.** "Salvar treino" grava o mesmo treino em `registros` e no resumo `dadosTreino`. Uma entrada do `dadosTreino` só entra no volume quando **não existe** registro do mesmo exercício, sessão e data. Assim, o histórico antigo, que só existe em `dadosTreino`, continua contando.
  - *Motivo:* antes os dois eram somados, e a semana do treino mais recente saía em dobro. Exemplo: 1 repetição a mais no ombro (400 → 410 kg·reps, +3%) aparecia como 400 → 820 (+105%), o que distorcia a comparação entre semanas.
- **RG1.2** – **Semana = segunda a domingo.** Todos os treinos salvos na semana (ex.: os 4 treinos Upper/Lower) somam no volume e nas séries do grupo muscular de cada exercício. A semana fecha no domingo às 23:59; o treino de segunda já cai na semana seguinte. A semana é sempre inteira, mesmo quando cruza a virada do mês (ex.: 26/10 a 01/11).
- **RG1.2.1** – **Mês = dia 1 ao último dia.** O mês fecha no último dia às 23:59, mesmo que a semana ainda não tenha acabado; o treino do dia 1 já é do mês seguinte. Semana e mês seguem cada um a sua regra: um treino de 31/10 conta na semana de 26/10–01/11 e no mês de outubro. O período é definido pela data do treino. Testes: `src/__tests__/utils/volumePeriodos.spec.ts`.
- **RG1.3** – **Grupo muscular tolerante à escrita:** o grupo é buscado no mapa muscular (`src/data/muscleMap.ts`, função `grupoMuscular`) ignorando maiúsculas, acentos, espaços e hífens ("Pull down" = "Pull-down", "Tríceps francês" = "Tríceps Francês"). Vale para o volume e para os badges `[estagnado]` e `[↓ carga]`. Exercício que não está no mapa não entra no volume; para incluí-lo, basta cadastrá-lo no mapa.
- **RG2** – A tela compara o período atual com o período anterior por grupo muscular. O período é definido pelo toggle de granularidade (semana ou mês).
- **RG3** – Volume Load = soma de (peso × repetições) de todas as séries do músculo no período selecionado.
- **RG4** – O sistema classifica o número de séries semanais por músculo em quatro categorias, calibradas para o método Saizen/Heavy Duty:
  - **Abaixo do estímulo:** < 4 séries semanais.
  - **Adequado (ok):** 4–10 séries semanais.
  - **Volume alto:** 11–16 séries (risco de junk volume para este método).
  - **Risco de overtraining:** > 16 séries semanais.
- **RG5** – Se não houver dados no período atual nem no anterior, exibe a mensagem `[sem_dados_periodo]`.
- **RG6** – Apenas grupos musculares com ao menos um registro são exibidos.
- **RG7** – O seletor de granularidade oferece **7 opções**: chips de **1 sem** a **6 sem** e **Mês**.
  - **1 sem** — compara semana ISO atual vs semana anterior (2 barras por músculo).
  - **2–6 sem** — modo **comparativo semana a semana**: exibe N barras horizontais por músculo, uma para cada semana individual (da mais antiga à mais recente), permitindo comparar a evolução semana a semana.
  - **Mês** — compara mês calendário atual vs mês anterior (2 barras por músculo).
- **RG8** – O banner de semanas consecutivas (`[banner_deload]`) é exibido quando o usuário possui ≥ 10 semanas de treino contínuo no logbook sem pausa de ≥ 7 dias. Semanas consecutivas são contadas a partir das datas reais dos registros.
- **RG9** – O badge `[estagnado]` é exibido no card do grupo muscular quando ≥ 2 exercícios daquele grupo acumulam ≥ 4 sessões consecutivas sem progressão (`progrediu === false` e `topSetBateuTeto === false`).
- **RG10** – O badge `[↓ carga]` é exibido no card do grupo muscular quando o tonnage (peso × reps) caiu entre o período anterior e o atual em ≥ 2 exercícios daquele grupo.

---

## 4. Tela

### 4.1 Barra Superior (TopBar)

- Título: **Volume load por músculo**
- Subtítulo dinâmico conforme granularidade:
  - 1 semana: *Semana atual vs semana anterior*
  - N semanas (2–6): *Comparativo semanal — últimas N semanas*
  - Mês: *Mês atual vs mês anterior*

### 4.2 Toggle de Granularidade

Chips clicáveis e scrolláveis abaixo da TopBar:

| Opção | Modo de exibição |
|---|---|
| **1 sem** (padrão) | 2 barras: semana ISO atual vs semana anterior |
| **2 sem** | 2 barras individuais: cada semana com seu volume |
| **3 sem** | 3 barras individuais: cada semana com seu volume |
| **4 sem** | 4 barras individuais: cada semana com seu volume |
| **5 sem** | 5 barras individuais: cada semana com seu volume |
| **6 sem** | 6 barras individuais: cada semana com seu volume |
| **Mês** | 2 barras: mês calendário atual vs mês anterior |

- **1 sem / Mês**: período atual vs período anterior (2 barras por músculo).
- **2–6 sem**: modo comparativo — cada barra representa uma semana individual (da mais antiga para a mais recente), com label DD/MM da segunda-feira correspondente.

### 4.3 Banner de Deload (`[banner_deload]`)

Exibido acima dos cards de resumo quando RG8 for satisfeita.

| Elemento | Detalhe |
|---|---|
| Cor de fundo | Amarelo suave (`#fefce8`) |
| Ícone | 🟡 |
| Texto principal | `X semanas de treino contínuo` |
| Texto secundário | `Você pode estar acima do teto recuperável. Considere 1–2 semanas com volume reduzido.` |

O banner some automaticamente quando o usuário fizer uma pausa ≥ 7 dias (detectada pelo logbook).

### 4.4 Cards de Resumo

| Card | Dado exibido |
|---|---|
| Volume load total | Soma do volume load de todos os músculos no período atual — no modo comparativo (2–6 sem), usa a semana mais recente (formato "Xk kg") |
| Variação vs período anterior | Percentual de variação (verde se positivo, vermelho se negativo, "—" se igual). No modo comparativo, compara a semana mais recente com a penúltima semana. Label: "vs sem. anterior" |

### 4.5 Cards por Grupo Muscular

Para cada grupo muscular com dados, exibe:

| Informação | Descrição |
|---|---|
| Nome do músculo | Ex.: Peito, Costas, Quadríceps |
| Número de séries | Qtd de séries no período atual |
| Badge de volume | `abaixo do estímulo` (amarelo) / `adequado` (verde) / `volume alto` (laranja) / `risco overtraining` (vermelho) — conforme RG4 |
| Badge de estagnação | `estagnado` (laranja) — conforme RG9; exibido ao lado do badge de volume |
| Badge de queda | `↓ carga` (vermelho) — conforme RG10; exibido ao lado dos outros badges |
| Variação percentual | Variação vs período anterior (verde / vermelho / "—"). No modo comparativo (2–6 sem), delta entre a semana mais recente e a penúltima |
| Barras de volume | Varia conforme o modo — ver 4.5.1 e 4.5.2 abaixo |
| Valores numéricos | Volume em kg ao lado de cada barra |

#### 4.5.1 Modo padrão (1 sem / Mês) — 2 barras

| Barra | Cor | Label |
|---|---|---|
| Período anterior | Cinza (`#d1d5db`) | "Sem. ant." (1 sem) / "Mês ant." (mês) |
| Período atual | Verde se crescimento, vermelho se queda, azul se igual | "Esta sem." (1 sem) / "Este mês" (mês) |

A barra anterior só aparece se `volumeAnterior > 0`.

#### 4.5.2 Modo comparativo (2–6 sem) — N barras

Exibe **N barras horizontais** (uma por semana), da mais antiga (topo) à mais recente (base).

| Elemento | Detalhe |
|---|---|
| Label | DD/MM da segunda-feira ISO de cada semana (ex.: "25/05", "01/06", "08/06") |
| Cores | Gradiente de azul — paleta sequencial de 6 tons de `#dbeafe` (mais claro, semana mais antiga) a `#2563eb` (mais escuro, semana mais recente). Para N < 6, as cores são distribuídas uniformemente pela paleta |
| Barras vazias | Semanas sem registros aparecem com barra em 0% e "0 kg" |
| Escala | Todas as barras de todos os músculos compartilham o mesmo `maxVol` para comparação proporcional |

Regra de exibição dos badges de diagnóstico:
- Os badges `[estagnado]` e `[↓ carga]` são independentes do badge de volume — podem aparecer juntos ou separados.
- Um músculo pode ter `risco overtraining` + `estagnado` ao mesmo tempo (volume alto mas sem progressão de carga).

---

## 5. Lógica de Diagnóstico de Fadiga

### 5.1 Semanas Consecutivas (RG8)

```
semanas_com_treino = conjunto de semanas ISO com ao menos 1 registro no logbook
streak = 0
para cada semana em ordem decrescente:
  se semana tem registro:
    streak++
  senão:
    break   // primeira semana sem treino encerra a contagem
exibir [banner_deload] se streak >= 10
```

### 5.2 Estagnação por Exercício (RG9)

```
para cada exercício do grupo muscular:
  pegar últimas N sessões do logbook (mesmo treinoId)
  contar quantas consecutivas têm progrediu === false E topSetBateuTeto === false
  se >= 4 → exercício estagnado

se >= 2 exercícios do grupo estagnados → badge [estagnado] no card do grupo
```

### 5.3 Queda de Rendimento (RG10)

```
para cada exercício do grupo muscular:
  tonnage_atual   = topSetKg × topSetReps (última sessão no período atual)
  tonnage_anterior = topSetKg × topSetReps (última sessão no período anterior)
  se tonnage_atual < tonnage_anterior → exercício com queda

se >= 2 exercícios do grupo com queda → badge [↓ carga] no card do grupo
```

---

## 6. Mensagens do Sistema

| Identificador | Tipo | Cor | Texto |
|---|---|---|---|
| `[sem_dados_periodo]` | Informação | Cinza | Nenhum treino registrado neste período ou no anterior. |
| `[banner_deload]` | Alerta | Amarelo | `X semanas de treino contínuo — considere 1–2 semanas com volume reduzido.` |
