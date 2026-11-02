# EF_08 — Importação Admin (Rota /admin)

---

## 1. Acesso

Rota `/admin` — acesso direto via URL, **sem autenticação exigida**.

Esta rota é de uso interno/técnico para importação de dados de configuração.

Componente: `AdminImport`

---

## 2. Atores e Permissões

| Perfil | Acesso |
|---|---|
| Administrador técnico | Acesso direto via URL `/admin` |
| Usuário comum | Não há link visível na interface; acesso apenas via URL direta |

> **Atenção:** Esta rota não possui proteção de autenticação. Deve ser usada apenas em ambiente controlado.

---

## 3. Regras Gerais

- **RG1** – Permite importar planilhas de configuração de plano de treino (`.xlsx` / `.csv`).
- **RG2** – Os dados importados são gravados diretamente no `localStorage` (`planoTreino`, `dadosTreino`).
- **RG3** – Backup automático é gerado antes de qualquer importação.
- **RG4** – As mesmas regras de mapeamento de colunas da tela de Exportar se aplicam aqui (ver EF_06).
- **RG4.1** – Os exercícios importados são ordenados pelo campo `ordem` dentro de cada sessão antes de exibir a pré-visualização e salvar o plano.
- **RG4.2** – Nomes descritivos da planilha (ex.: "Pull-around cabo polia baixa", "Remada peito apoiado halteres (livre)") são normalizados automaticamente para os nomes canônicos do app via `NOME_MAP`.
- **RG5** – O resultado da importação é exibido imediatamente após a confirmação.

---

## 4. Tela

O componente AdminImport utiliza os mesmos estilos (`AdminImport.styles.ts`) reaproveitados também na tela de Exportar.

### 4.1 Área de Upload

- Drop zone com suporte a arrastar e soltar.
- Botão de seleção de arquivo via explorador.
- Formatos aceitos: `.xlsx`, `.csv`.

### 4.2 Pré-visualização

- Tabela com as linhas lidas do arquivo antes da confirmação.
- Exibe: Sessão, Exercício, Músculo, Reps, Peso C1–C4.

### 4.3 Botões

| Botão | Ação |
|---|---|
| **Confirmar importação** | Executa a gravação no localStorage |
| **Desfazer importação** | Restaura o backup anterior |

---

## 5. Diferença em relação à tela Exportar (EF_06)

| Aspecto | Exportar (EF_06) | Admin (EF_08) |
|---|---|---|
| Autenticação | Exige login | Não exige |
| Exportação CSV/JSON | Sim | Não |
| Público-alvo | Usuário final | Administrador técnico |
| Visibilidade | Aba na nav | URL direta |
