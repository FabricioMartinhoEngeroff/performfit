# EF_03 — Gráficos

---

## 1. Acesso

Aba **Gráficos** na barra de navegação inferior (ícone de tendência).

Rota também acessível via `/graficos` (link externo, requer autenticação).

Componente: `GraphicsContainer`

---

## 2. Atores e Permissões

Qualquer usuário autenticado com dados registrados possui acesso.

---

## 3. Regras Gerais

- **RG1** – Os gráficos são gerados a partir dos dados armazenados no `localStorage` (`dadosTreino` e `logbook`).
- **RG2** – Caso não haja dados para o filtro aplicado, o sistema exibe mensagem "Sem registros para listar."
- **RG3** – O usuário pode filtrar por treino (Upper A/B, Lower A/B, Braço — múltipla escolha), por exercício e por período (intervalo de tempo).
- **RG4** – Os gráficos são atualizados ao alterar os filtros.
- **RG5** – O campo Exercício é um `<select>` nativo (sem busca em tempo real). *(Divergência conhecida: existe um `SearchBar.tsx` já pronto na pasta `graphic/`, mas ainda não está conectado ao filtro.)*
- **RG6** *(futuro — ainda não implementado, ver 4.5)* – No Gráfico de Repetições, todo ponto em que as repetições do Top Set atingirem ou ultrapassarem o limite superior da faixa cadastrada para o exercício será destacado visualmente (bolinha verde e ícone de seta para cima). Esse destaque indicará a sessão em que houve quebra de recorde e a progressão de carga deveria ter sido aplicada.
- **RG7** – No Gráfico de Volume Load, barras de períodos em que houve ao menos uma sessão com técnica avançada (RP — Rest-Pause) recebem um marcador visual diferenciado (cor âmbar). O tooltip dessas barras indica a técnica utilizada. Isso evita que picos de volume gerados pela acumulação de blocos sejam confundidos com evolução real de carga.
- **RG8** – A tela de Gráficos possui duas visões alternadas por um seletor (segmented control): **Progressão** (padrão) e **Volume Load**. Apenas uma visão é exibida por vez.
- **RG9** – Na visão Volume Load, o usuário escolhe a granularidade de agrupamento: **Semana**, **Mês** ou **Ano**. Os registros do exercício (ou exercícios) filtrados são somados (peso × reps) dentro de cada período e exibidos como uma barra.

---

## 4. Tela

### 4.1 Filtros

Painel recolhível (botão "Ocultar/Mostrar filtros").

| Nº | Campo | Tipo | Obrig. | Opção padrão |
|---|---|---|---|---|
| 01 | Treino | Checkboxes (múltipla escolha) | Não | Todos selecionados |
| 02 | Exercício | Select nativo (sem busca) | Não | Todos os exercícios |
| 03 | Período | Select sem pesquisa | Não | Tudo |

**Opções de período disponíveis** (`src/utils/timeFilter.ts`):

| Valor | Descrição |
|---|---|
| `Tudo` | Todo o histórico |
| `1M` | 1 mês |
| `3M` | 3 meses |
| `6M` | 6 meses |
| `1A` | 1 ano |
| `3A` | 3 anos |
| `5A` | 5 anos |

### 4.2 Seletor de Visão

Segmented control com 2 botões, no topo da tela (abaixo dos filtros):

| Botão | Visão |
|---|---|
| Progressão | Gráfico de Evolução de Carga (padrão) |
| Volume Load | Gráfico de Volume Load |

Ver **RG8**.

### 4.3 Visão "Progressão"

#### Gráfico de Evolução de Carga (Top Set)

- **Tipo:** Linha/Área.
- **Eixo X:** Data do treino.
- **Eixo Y:** Peso (kg) do Top Set.
- **Dado agrupador:** Exercício selecionado.
- **Tooltip:** Exibe data + ciclo + peso de cada série registrada + maior peso (Topset) + média das últimas 4 datas. *(Não exibe repetições — o tipo `RegistroGraficoRaw` que alimenta este gráfico não carrega essa informação.)*

### 4.4 Visão "Volume Load"

Ao selecionar esta visão, um seletor adicional de granularidade aparece:

| Nº | Campo | Tipo | Obrig. | Opção padrão |
|---|---|---|---|---|
| 01 | Agrupar por | Segmented control | Sim | Semana |

**Opções de granularidade:**

| Valor | Descrição |
|---|---|
| `semana` | Agrupa por semana (início na segunda-feira) |
| `mes` | Agrupa por mês calendário |
| `ano` | Agrupa por ano calendário |

#### Gráfico de Volume Load

- **Tipo:** Barra.
- **Eixo X:** Período (semana, mês ou ano, conforme granularidade escolhida).
- **Eixo Y:** Volume total do período (kg × reps), somando todas as sessões do exercício dentro do período.
- **Tooltip:** Exibe o período + volume total calculado + indicação de técnica utilizada (RP), se houver.
- **Destaque de técnica avançada:** Barras de períodos com ao menos uma sessão em RP são exibidas em cor alternativa (âmbar). O tooltip indica "Inclui sessão(ões) com técnica RP". Ver **RG7**.

### 4.5 Gráfico de Repetições (futuro — ainda não implementado)

- **Tipo:** Linha.
- **Eixo X:** Data do treino.
- **Eixo Y:** Repetições do Top Set.
- **Referência visual:** Linhas horizontais indicando os limites da faixa (mín / máx) do exercício selecionado.
- **Destaque de teto atingido:** Pontos em que as reps atingem ou ultrapassam o limite superior da faixa são exibidos em verde com ícone de seta para cima (↑). Ver **RG6**.

---

## 5. Mensagens do Sistema

| Identificador | Tipo | Cor | Texto |
|---|---|---|---|
| `[sem_dados]` | Informação | Cinza | Sem registros para listar. |
