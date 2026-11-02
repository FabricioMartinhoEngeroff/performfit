# Técnicas Avançadas — BC, Rest Pause e Deload

Documentação das técnicas e modos avançados disponíveis na tela Registrar Treino (EF_02). Todas as opções são **mutuamente exclusivas**: ativar uma desativa automaticamente as demais.

---

## BC — Breathing Cluster (4 blocos)

Chip **BC** no topo do card de exercício.

**Ao ativar:**
- Os blocos Top Set, Back-off e Série Extra são ocultados.
- Exibe 4 blocos (R1–R4), cada um com campo peso (kg) e campo reps.
- Exibe **Total kg·reps** calculado em tempo real: `Σ (pesoN × repsN)`.
- Limpa qualquer modo Deload ativo.

**Ao desativar (clicar no chip ativo):**
- Os blocos Top Set e Back-off voltam.
- Se houver histórico anterior (`ultimoRegistro`), os campos de Top Set e Back-off são restaurados com os valores do último treino (indicador visual azul de sugestão).

**Confirmação:** botão "Confirmar Técnica" — exige ao menos 1 bloco com peso e repetições positivos.

**Logbook:** `tecnica: "BC"`, `clusterSeries: [{kg, reps}, ...]`, `topSetKg: 0`, `backoffKg: 0`.

**Volume Load:** soma de `(kg × reps)` por bloco; contagem de séries = número de blocos com peso > 0.

**1RM Estimado (Gráfico Powerlifter):** calculado usando apenas o Bloco 1 (R1), que representa o esforço máximo antes da primeira micro-pausa. Os demais blocos são ignorados para esse cálculo.

---

## Rest Pause (4 blocos)

Chip **Rest Pause** no topo do card de exercício.

**Ao ativar:**
- Os blocos Top Set, Back-off e Série Extra são ocultados.
- Exibe 4 blocos (R1–R4), cada um com campo peso (kg) e campo reps.
- Exibe **Total kg·reps** calculado em tempo real.
- Limpa qualquer modo Deload ativo (`isDeload: false`).

**Ao desativar (clicar no chip ativo):**
- Os blocos Top Set e Back-off voltam.
- Se houver histórico anterior (`ultimoRegistro`), os campos de Top Set e Back-off são restaurados com os valores do último treino (indicador visual azul de sugestão).

**Confirmação:** botão "Confirmar Técnica" — exige ao menos 1 bloco com peso e repetições positivos.

**Logbook:** `tecnica: "RP"`, `clusterSeries: [{kg, reps}, ...]`, `topSetKg: 0`, `backoffKg: 0`.

**Volume Load:** mesmo cálculo do BC.

**1RM Estimado (Gráfico Powerlifter):** calculado usando apenas o Bloco 1 (R1).

---

## Deload — Série Reduzida

Chip **Deload** no topo do card de exercício, posicionado após o chip Rest Pause.

### Conceito

Deload é a redução de volume de uma sessão: em vez de executar Top Set + Back-off (2 séries válidas), o atleta executa **apenas 1 série válida (o Top Set)**, mantendo o **mesmo peso do último treino**. Indicado quando o atleta está travado, exausto ou em recuperação ativa. Pode ser mantido por 1–2 semanas antes de retomar o volume normal.

### Comportamento ao ativar

- O chip **Deload** fica destacado (ativo).
- O bloco Back-off e o bloco Série Extra são ocultados.
- O bloco Top Set permanece visível e utilizável normalmente.
- O campo Top Set é pré-preenchido com o peso do último treino (mesmo peso, sem incremento — diferente do comportamento padrão da RG7).
- Exibe informativo: *"Deload — apenas 1 série válida (Top Set), mesmo peso do último treino"*.
- Limpa qualquer técnica BC ou Rest Pause ativa (`tecnica: null`, `clusterSeries: []`).

### Comportamento ao desativar (clicar no chip ativo)

- O bloco Back-off volta a aparecer.
- Se houver histórico anterior (`ultimoRegistro`), os campos de Back-off são restaurados com os valores do último treino (com indicador visual azul de sugestão).

### Validação e navegação

No modo Deload, **somente o Top Set é obrigatório** para avançar com o botão "Próximo" ou "Ver Resumo". O Back-off não é exigido. Tentar avançar sem confirmar o Top Set ainda exibe o aviso `[aviso_top_set]`.

### Logbook

O registro salvo com Deload ativo inclui:

| Campo | Valor |
|---|---|
| `isDeload` | `true` |
| `topSetKg` | Peso confirmado pelo atleta |
| `topSetReps` | Reps confirmadas pelo atleta |
| `backoffKg` | `0` (Back-off suprimido) |
| `backoffReps` | `0` |
| `tecnica` | `null` |
| `clusterSeries` | `[]` |

### Indicador visual no Gráfico Powerlifter

Sessões com `isDeload: true` aparecem como um **círculo vermelho vazado** no gráfico:
- Preenchimento: `rgba(220,38,38,0.15)` (vermelho translúcido)
- Borda: vermelho sólido (`#dc2626`), espessura 1.5 px
- Raio: 5 px

O tooltip dessas sessões exibe **"⬇ Deload (1 série)"** em vermelho, além dos dados normais de peso × reps e 1RM. A linha de PR e o cálculo de 1RM usam normalmente o `topSetKg`/`topSetReps` da sessão Deload — o fato de o Back-off ser zero não distorce o 1RM exibido.

### Tela de revisão pré-save

Na lista de exercícios da tela de revisão, exercícios registrados em modo Deload exibem a etiqueta **"· Deload"** em vermelho ao lado do status.

---

## Exclusividade mútua

BC, Rest Pause e Deload são mutuamente exclusivos em qualquer combinação:

| Ação | Efeito |
|---|---|
| Ativar **Deload** | Limpa `tecnica` (BC/RP) e `clusterSeries: []` |
| Ativar **BC** | Limpa `isDeload: false` |
| Ativar **Rest Pause** | Limpa `isDeload: false` |

---

## Comparação — campos salvos no logbook

| Campo | Modo normal | BC | Rest Pause | Deload |
|---|---|---|---|---|
| `tecnica` | `null` / ausente | `"BC"` | `"RP"` | `null` |
| `clusterSeries` | ausente | Array de blocos | Array de blocos | `[]` |
| `isDeload` | `false` / ausente | `false` / ausente | `false` / ausente | `true` |
| `topSetKg` | Peso real | `0` | `0` | Peso real |
| `backoffKg` | Peso real | `0` | `0` | `0` |
