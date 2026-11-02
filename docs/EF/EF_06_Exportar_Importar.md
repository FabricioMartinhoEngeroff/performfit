# EF_06 — Exportar / Importar Dados

---

## 1. Acesso

Aba **Exportar** na barra de navegação inferior (ícone de download).

Componente: `Exportar`

---

## 2. Atores e Permissões

Qualquer usuário autenticado possui acesso.

---

## 3. Regras Gerais

- **RG1** – A exportação lê os dados do usuário no `localStorage`: o histórico em `registros` (ver EF_02 RG19), além de `dadosTreino`, `planoTreino` e `sessoes_config`.
- **RG2** – A importação aceita arquivos nos formatos `.xlsx` e `.csv`.
- **RG3** – Antes de importar, o sistema salva um backup automático dos dados atuais (`dadosTreino_backup`, `planoTreino_backup`), permitindo desfazer a operação.
- **RG4** – A importação preserva registros já existentes no ciclo correspondente (não sobrescreve dados já registrados).
- **RG5** – A importação atualiza o plano de treino (`planoTreino`) com as sessões e exercícios da planilha, sobrescrevendo o plano anterior (o plano é um template, não histórico). O `planoTreino` é consumido pela tela Registrar Treino (EF_02) para reordenar exercícios e sobrescrever `seriesValidas`.
- **RG5.1** – Os exercícios importados são ordenados pelo campo `ordem` da planilha dentro de cada sessão, tanto na pré-visualização quanto no plano salvo.
- **RG5.2** – Nomes de exercícios da planilha são normalizados para os nomes canônicos do app via mapeamento interno (`NOME_MAP`), garantindo correspondência com `SESSOES` e `logbook`.
- **RG5.3** – O `series_validas` importado prevalece sobre o histórico de treinos anteriores desse exercício (ver EF_02 RG1.2). Reimportar a planilha com um `series_validas` diferente (ex.: subir um exercício de 2 para 3 séries válidas) atualiza o comportamento da tela Registrar Treino imediatamente, mesmo que o exercício já tenha registros salvos com o valor antigo.
- **RG6** – O sistema exibe uma pré-visualização dos dados antes de confirmar a importação.
- **RG7** – Após importação bem-sucedida, o botão "Desfazer importação" fica disponível enquanto o usuário permanecer na tela.
- **RG8** – Ao desfazer, o sistema restaura os dados do backup e remove o resultado exibido.
- **RG9** – **Planilha com várias abas (protocolo por semana):** a importação lê **todas as abas** do `.xlsx`. Abas sem cabeçalho de exercícios (ex.: "Guia", instruções) são ignoradas.
  - Se houver **mais de uma aba de treino**, cada sessão recebe o prefixo da semana e o dia: aba "Semana 1" + ID `SEG` + Treino "Pull" → sessão **`S1 Seg · Pull`**; "Semanas 3-4" → `S3-4`.
  - Com uma aba só (a planilha de 4 dias Upper/Lower A/B), o nome da sessão continua sendo o próprio Treino, sem prefixo. Nada muda para quem já usava.
  - *Motivo:* protocolos que variam por semana precisam de sessões separadas por semana, sem misturar o histórico de semanas diferentes.
- **RG10** – **Cabeçalho da planilha:** a linha de cabeçalho é a que tem uma célula **exatamente** igual a `Sessão` ou `Exercício`. Notas acima do cabeçalho que só citam a palavra (ex.: *"⚡ Antes do 1º exercício de cada músculo…"*) não são tomadas como cabeçalho.
- **RG11** – **Exercício repetido no mesmo dia:** quando a mesma sessão lista o mesmo exercício mais de uma vez (ex.: *"Remada curvada — perto da falha"* e, depois, *"Remada curvada — até a falha total"*), ele vira **um exercício só**, na posição do primeiro.
  - As séries válidas são somadas (máx. 4).
  - O cue junta as instruções de cada vez: *"1ª: Perto da falha | 2ª: Até a falha total"*.
- **RG12** – **Cue e cluster:** a coluna `Cue / foco` é importada e exibida no card do exercício. Se o cue descreve um cluster com tamanho de bloco (ex.: *"Cluster set: 24 reps em blocos de 4"*), o plano guarda `clusterBlocos` (6) para a tela de treino (EF_02 RG16.1).
- **RG13** – **Exercícios com outro nome ou ainda fora do catálogo** (`src/data/exerciseAliases.ts`):
  - **Mesmo exercício com outro nome** (`MESMO_EXERCICIO`) vira o nome do catálogo e herda vídeo, grupo muscular e histórico. Ex.: "Extensão de pernas" → "Cadeira extensora", "Agachamento búlgaro" → "Afundo búlgaro livre", "Pec deck" → "Voador".
  - **Exercício parecido** (`PARECIDO_COM`) mantém o próprio nome, mas usa o vídeo/GIF do semelhante.
  - **Exercício novo** entra no catálogo com grupo muscular. Fica sem vídeo até alguém cadastrar um em `src/data/exerciseVideos.ts`; IDs de vídeo não são inventados.
  - *Motivo:* aproveitar vídeos, grupos musculares e histórico já existentes sem duplicar exercícios.

---

## 4. Tela

### 4.1 Barra Superior (TopBar)

- Título: **Exportar dados**
- Subtítulo: *Faça backup do seu histórico*

### 4.2 Card de Informações

| Informação | Descrição |
|---|---|
| Total de registros | Contagem total de sessões salvas no `dadosTreino` |
| Período | Primeira e última data registrada (formato `mês/ano → mês/ano`) |

### 4.3 Botões de Exportação

| Botão | Ação | Formato gerado |
|---|---|---|
| **Exportar como CSV** | Gera arquivo com todo o histórico de `registros` | `.csv` com **uma linha por série**: `data,sessao,exercicio,serie,tipo,kg,reps,obs`. Textos que começam com `=`, `+`, `-` ou `@` são neutralizados, para o Excel não executar fórmulas. |
| **Exportar como JSON** | Gera backup completo (versão 3) | `.json` com `{ app: "gymwave", versao: 3, exportadoEm, registros, dadosTreino, planoTreino, sessoes_config }`. A importação de JSON aceita também os backups antigos v2 (histórico no objeto `logbook`) e v1 (só `dadosTreino`). Ao importar, registros já existentes (mesmo exercício + sessão + data) não são duplicados. |

**Nome dos arquivos:**
- CSV: `gymwave_AAAA-MM-DD.csv`
- JSON: `gymwave_backup_AAAA-MM-DD.json`

### 4.4 Importação de Planilha

Exibida ao clicar em **"Importar planilha"**.

#### Área de Upload

- Componente do tipo "arraste e solte" (drop zone).
- Texto: *"Arraste e solte o arquivo aqui ou clique para selecionar"*
- Subtexto: `.xlsx ou .csv`
- Ao clicar: abre explorador de arquivos.
- Formatos aceitos: `.xlsx`, `.csv`.
- Acessível via teclado (Enter ativa o explorador).

#### Mapeamento de Colunas

O sistema reconhece automaticamente as colunas da planilha pelos seguintes padrões (case-insensitive):

| Coluna esperada | Padrão reconhecido |
|---|---|
| Sessão | `sessão`, `sessao`, `treino` (v4 logbook) |
| ID da sessão | `id` (ex.: `UA`, `SEG`, `SEX` — usado para o dia no protocolo por semana, RG9) |
| Cue / foco | `cue`, `foco` |
| Ordem | `ord.`, `ordem` |
| Exercício | `exercício`, `exercicio` |
| Grupo/Músculo | `grupo`, `músculo`, `musculo` |
| Rep. Mínimo | `rep min`, `rep mín` |
| Rep. Máximo | `rep max`, `rep máx` |
| Séries | `séries`, `series` |
| Séries C1–C4 | `séries c1`, `c1 séries` (e variações para C2, C3, C4) |
| Peso C1–C4 (kg) | `peso c1`, `peso c2`, `peso c3`, `peso c4` |
| Top Set Kg (v4) | `top set kg` (mapeado para peso C1) |
| Back-off Kg (v4) | `back-off kg`, `backoff kg` (mapeado para peso C2) |

Cabeçalhos de células com quebra de linha no Excel (texto "wrap") chegam com `\r\n` (CR+LF), não só `\n` — o sistema normaliza os dois antes de aplicar os padrões acima, para que colunas como `Top\r\nMín`, `TOP SET\r\nKg` e `BACK-OFF\r\nKg` sejam reconhecidas corretamente.

#### Pré-visualização

- Após leitura do arquivo, exibe tabela com colunas: Sessão, Exercício, Músculo, Reps (min–max), C1 kg, C2 kg, C3 kg, C4 kg.
- Exibe contagem: `X linhas (Y com peso preenchido)`.
- Pesos preenchidos aparecem em badge colorido; campos vazios aparecem como `—`.

#### Botões de Importação

| Botão | Ação | Regras |
|---|---|---|
| **Confirmar importação** | Executa a importação | Desabilitado se não houver linhas carregadas. Exibe resultado após execução. |
| **Desfazer importação** | Restaura dados do backup | Disponível apenas após importação bem-sucedida. Exige confirmação. |
| **Fechar importação** | Oculta a seção de importação | Reseta o estado (arquivo, pré-visualização, resultado). |

#### Resultado da Importação

Após confirmação bem-sucedida, exibe card com:
- Total de registros adicionados.
- Total de registros preservados (já existiam).
- Detalhamento por sessão: `NomeSessao: X registros`.

---

## 5. Estrutura da Planilha de Importação

| Coluna | Descrição | Obrig. |
|---|---|---|
| Sessão / Treino | Nome da sessão (Upper A, Lower B, Pull, Upper Cluster…) | Sim |
| ID | Sigla da sessão (UA, LB) ou do dia (SEG, TER, … SÁB) no protocolo por semana | Não |
| Ordem | Posição do exercício na sessão | Não |
| Exercício | Nome do exercício. Nomes diferentes do catálogo são associados pelos aliases (RG13) | Sim |
| Grupo / Músculo | Grupo muscular primário | Não |
| Rep mín / Rep máx | Faixa de repetições | Não |
| Séries | Número de séries válidas (1–4) | Não (padrão: 3) |
| Cue / foco | Instrução do exercício; pode descrever o cluster (RG12) | Não |
| Séries C1–C4 | Séries válidas por ciclo específico | Não |
| Peso C1–C4 (kg) | Peso inicial sugerido por ciclo | Não |

---

## 6. Mensagens do Sistema

| Identificador | Tipo | Cor | Texto |
|---|---|---|---|
| `[importacao_concluida]` | Informação | Azul | Migração concluída — X adicionados · Y preservados |
| `[confirmar_desfazer]` | Confirmação | — | Desfazer a importação e restaurar os dados anteriores? |
| `[sem_linhas]` | — | — | Botão "Confirmar importação" permanece desabilitado |
