# EF_07 — Gráfico Powerlifter (Moderno)

---

## 1. Acesso

Rota `/grafico-powerlifter` (requer autenticação).

Acessada pelo botão **"Ver Gráfico Moderno"** na aba legada de registro (CycleCard).

Componente: `PowerliftingChart`

---

## 2. Atores e Permissões

Qualquer usuário autenticado com dados registrados possui acesso.

---

## 3. Regras Gerais

- **RG1** – Os dados são lidos do `localStorage` (`logbook`). O `logbook` contém o registro completo por sessão, incluindo técnica utilizada e blocos individuais.
- **RG2** – Exibe a evolução de força dos exercícios principais ao longo do tempo. O eixo Y representa o **1RM Estimado** (carga máxima para 1 repetição), não o peso bruto da barra.
- **RG3** – Caso não haja dados, exibe mensagem de estado vazio `[sem_dados]`.
- **RG4** – **Cálculo do 1RM Estimado (fórmula de Epley):**
  `1RM = Peso × (1 + Repetições / 30)`
  Esse valor é calculado para cada sessão e plotado no gráfico de linha.
- **RG5** – **Extração da carga de referência por técnica:**
  - **Modo padrão (Top Set / Back-off):** o cálculo do 1RM usa exclusivamente os dados do bloco **Top Set**. O Back-off é ignorado.
  - **Modo BC (Breathing Cluster) ou Rest Pause:** o cálculo usa exclusivamente os dados do **Bloco 1 (R1)**, que representa o esforço máximo antes da primeira micro-pausa. Os demais blocos são ignorados para fins desse gráfico.
  - **Modo Deload (`isDeload: true`):** o cálculo usa o `topSetKg` e `topSetReps` normalmente. O `backoffKg: 0` não afeta o 1RM calculado. O ponto é renderizado com estilo visual diferente (RG8).
- **RG6** – **Linha de PR (Recorde Absoluto):** Uma linha horizontal pontilhada dourada é sobreposta ao gráfico, posicionada no valor do maior 1RM estimado já registrado para o exercício selecionado. O objetivo visual é fazer a linha contínua do treino atual subir até cruzar essa linha.
- **RG7** – **Badge de Conquista (PR confirmado):** Todo ponto do gráfico que representa uma sessão em que o 1RM calculado igualou ou superou o PR histórico vigente naquele momento recebe um marcador visual diferenciado (estrela ou cor brilhante). Esses pontos indicam as sessões que efetivamente quebraram o recorde.
- **RG8** – **Indicador visual de Deload:** Sessões com `isDeload: true` são renderizadas como um **círculo vermelho vazado** no gráfico — preenchimento `rgba(220,38,38,0.15)` (vermelho translúcido), borda vermelha sólida (`#dc2626`, espessura 1.5 px), raio 5 px. Esse marcador diferencia visualmente as sessões de volume reduzido dos pontos normais (invisíveis por padrão) e dos pontos de PR (anel dourado/estrela). O tooltip de uma sessão Deload exibe a linha **"⬇ Deload (1 série)"** em vermelho, além dos dados normais.

---

## 4. Tela

### 4.1 Filtros

| Nº | Campo | Tipo mobile | Tipo desktop | Obrig. | Opção padrão |
|---|---|---|---|---|---|
| 01 | Exercício | Select com pesquisa (full-width) | Select com pesquisa (inline) | Sim | Primeiro exercício com dados |
| 02 | Período | Segmented control (chips: 7d / 1m / 3m / 1a / ∞) | Select sem pesquisa | Não | Último ano |

No mobile os dois filtros ficam empilhados abaixo do título. No desktop ficam lado a lado em uma linha acima do card de stats.

---

### 4.2 Card de Estatísticas (acima do gráfico)

Exibido entre os filtros e o gráfico. No mobile: grid 2×2. No desktop: linha horizontal com 4 células.

| Célula | Dado | Formato |
|---|---|---|
| 1RM Atual | Maior 1RM estimado do exercício no período selecionado | `142 kg` (número grande, destaque) |
| Variação | Delta do 1RM atual vs sessão anterior do mesmo exercício | `+4,5 kg` verde / `−2 kg` vermelho / `—` neutro |
| Sessões | Quantidade de sessões com dados no período | `12 sessões` |
| Último PR | Data em que o recorde absoluto foi registrado | `08/06/2026` |

---

### 4.3 Gráfico de 1RM Estimado

- **Tipo:** Área com linha — a linha contínua exibe a curva de 1RM; o preenchimento abaixo é o mesmo tom da linha com opacidade de 15–20 % (gradiente de cima para baixo, desvanece até transparente na base). Não adiciona novas cores — usa o tom primário do app.
- **Curva:** Interpolação suavizada (bezier / `monotone`), sem ângulos abruptos entre pontos.
- **Eixo X:** Datas do treino. No mobile exibe no máximo 4–5 labels; no desktop 6–8. Rótulos curtos: `Jun 8`, `Jun 15`.
- **Eixo Y:** 1RM Estimado (kg). Grade horizontal com linhas finas de baixa opacidade (10–15 %); sem grade vertical. Nenhuma borda em volta do gráfico.
- **Pontos:** Invisíveis por padrão nos pontos normais. Aparecem ao tocar/hover. Pontos de PR (RG7) são sempre visíveis com marcador diferenciado (círculo maior + anel de brilho ou ícone de estrela).
- **Linha de PR:** Linha horizontal pontilhada dourada sobrepassando o gráfico no valor do recorde absoluto (RG6). Label flutuante à direita: `PR: 142 kg`.
- **Animação de entrada:** A linha se desenha da esquerda para a direita ao montar o componente (300–400 ms, ease-out). O preenchimento de área segue a linha.
- **Tooltip mobile (toque):** Toque em qualquer ponto da área do gráfico localiza o ponto mais próximo e exibe um card flutuante acima dele com: data, 1RM, peso × reps do bloco de referência, tag de técnica (se BC ou Rest Pause) e linha **"⬇ Deload (1 série)"** em vermelho (se Deload). Dispensado ao tocar fora.
- **Tooltip desktop (hover):** Card flutuante no cursor com os mesmos dados do mobile.

---

### 4.4 Layout Responsivo

#### Mobile (< 768 px)

```
┌─────────────────────────────┐
│  ← Gráfico Powerlifter       │  ← TopBar com botão voltar
├─────────────────────────────┤
│  [Select exercício ▾]        │  ← filtro 1
│  [7d][1m][3m][1a][∞]        │  ← filtro 2 (chips)
├──────────┬──────────────────┤
│ 1RM Atual│ Variação         │  ← card stats linha 1
│ 142 kg   │ +4,5 kg ↑        │
├──────────┼──────────────────┤
│ Sessões  │ Último PR        │  ← card stats linha 2
│ 12       │ 08/06/2026       │
├─────────────────────────────┤
│                             │
│   [  Gráfico área linha  ]  │  ← altura ~240 px, full-width
│                             │
├─────────────────────────────┤
│  ● Linha 1RM  ⋯ Linha PR  ○ Deload  │  ← legenda compacta
└─────────────────────────────┘
```

#### Desktop (≥ 768 px)

```
┌────────────────────────────────────────────────────┐
│  Gráfico Powerlifter                               │  ← TopBar
├────────────────────────────────────────────────────┤
│  [Select exercício ▾]  [Período ▾]                 │  ← filtros inline
├────────┬────────┬──────────┬────────────────────── ┤
│1RM     │Var.    │ Sessões  │ Último PR              │  ← stats linha única
│142 kg  │+4,5 kg │ 12       │ 08/06/2026            │
├────────────────────────────────────────────────────┤
│                                                    │
│        [  Gráfico área linha — altura ~320 px  ]   │
│                                                    │
├────────────────────────────────────────────────────┤
│  ● Linha 1RM Estimado  ⋯ Linha PR (recorde)  ★ PR  ○ Deload  │
└────────────────────────────────────────────────────┘
```

---

### 4.5 Legenda

| Elemento | Descrição |
|---|---|
| Linha contínua + área | Evolução do 1RM estimado por sessão |
| Linha pontilhada dourada | Recorde absoluto do exercício (PR histórico) |
| Ponto com anel / estrela | Sessão em que o PR foi quebrado |
| Círculo vermelho vazado | Sessão registrada em modo Deload (`isDeload: true`) — volume reduzido (1 série válida) |
| Tag de técnica no tooltip | Indica BC ou Rest Pause quando o Bloco 1 foi usado como referência; indica Deload quando `isDeload: true` |

---

## 5. Mensagens do Sistema

| Identificador | Tipo | Texto |
|---|---|---|
| `[sem_dados]` | Informação | Sem registros para listar. |
| `[sem_dados_exercicio]` | Informação | Nenhum registro encontrado para o exercício selecionado no período. |
