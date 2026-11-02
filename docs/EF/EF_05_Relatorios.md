# EF_05 — Relatórios de Treinos

---

## 1. Acesso

Aba **Relatórios** na barra de navegação inferior (ícone de prancheta).

Rota também acessível via `/relatorio` (link externo, requer autenticação).

Componente: `ReportPage`

---

## 2. Atores e Permissões

Qualquer usuário autenticado com dados registrados possui acesso.

---

## 3. Regras Gerais

- **RG1** – Os dados são lidos do `localStorage` (`dadosTreino` e `logbook`).
- **RG2** – O usuário pode filtrar por exercício e por período de tempo.
- **RG3** – Caso não haja dados para o filtro aplicado, exibe "Sem registros para listar."
- **RG4** – O usuário pode editar registros individuais diretamente na lista.
- **RG5** – O usuário pode excluir registros individuais com confirmação.
- **RG6** – Ao editar ou excluir, os dados são atualizados no `localStorage` imediatamente.

---

## 4. Tela

### 4.1 Cabeçalho

- Título: **Relatórios de Treinos**

### 4.2 Filtros

| Nº | Campo | Tipo | Obrig. | Opção padrão |
|---|---|---|---|---|
| 01 | Exercício | Select nativo | Não | Todos os exercícios |
| 02 | Período | Select nativo | Não | Últimos 30 dias |

**Opções de período disponíveis** (definidas em `utils/timeFilter.ts`):

| Valor | Descrição |
|---|---|
| `7d` | Últimos 7 dias |
| `30d` | Últimos 30 dias |
| `90d` | Últimos 90 dias |
| `180d` | Últimos 6 meses |
| `365d` | Último ano |
| `all` | Todo o histórico |

### 4.3 Lista de Registros (ReportList)

Exibe uma linha por sessão registrada, ordenada por data decrescente.

Dados exibidos por linha:

| Coluna | Descrição |
|---|---|
| Data | Data do treino no formato `DD/MM/AAAA` |
| Exercício | Nome do exercício |
| Ciclo/Sessão | Identificador da sessão (ex.: UA, UB…) |
| Séries | Top Set, Back-off e Extra (peso × reps) |
| Observação | Texto livre registrado |

### 4.4 Edição de Registro (EditRow)

Ao clicar em "Editar" em uma linha:
- Linha expande para modo de edição inline.
- Campos editáveis: peso e repetições de cada série, observação.
- Botão **"Salvar"**: persiste as alterações no `localStorage`.
- Botão **"Cancelar"**: fecha a edição sem salvar.

### 4.5 Exclusão de Registro

- Botão "Excluir" em cada linha.
- Exibe modal de confirmação antes de excluir.
- Após confirmação, remove o registro do `localStorage` e atualiza a lista.

---

## 5. Mensagens do Sistema

| Identificador | Tipo | Cor | Texto |
|---|---|---|---|
| `[sem_registros]` | Informação | Cinza | Sem registros para listar. |
| `[confirmar_exclusao]` | Confirmação | — | Deseja realmente excluir este registro? |
| `[edicao_salva]` | Sucesso | Verde | Registro atualizado com sucesso. |
| `[registro_excluido]` | Informação | Azul | Registro excluído com sucesso. |
