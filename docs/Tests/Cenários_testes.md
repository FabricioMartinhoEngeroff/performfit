# GymWave Strength — Documentacao de Testes

**Total: 481 testes | 37 arquivos de teste**
**Framework: Vitest + React Testing Library**

---

## 1. UTILS

### 1.1 validators (15 testes)

| # | Cenario | Resultado Esperado |
|---|---------|-------------------|
| 1 | Email valido `user@test.com` | Retorna null (sem erro) |
| 2 | Email vazio | Retorna mensagem de erro |
| 3 | Email sem `@` | Retorna mensagem de erro |
| 4 | Email sem dominio | Retorna mensagem de erro |
| 5 | CPF com 11 digitos | Retorna null (sem erro) |
| 6 | CPF com mascara `123.456.789-01` | Retorna null (aceita pontuacao) |
| 7 | CPF vazio | Retorna mensagem de erro |
| 8 | CPF com menos de 11 digitos | Retorna mensagem de erro |
| 9 | Telefone com 11 digitos (celular) | Retorna null (sem erro) |
| 10 | Telefone com 10 digitos (fixo) | Retorna null (sem erro) |
| 11 | Telefone vazio | Retorna mensagem de erro |
| 12 | Senha forte `Senha@123` | Retorna null (sem erro) |
| 13 | Senha com menos de 8 caracteres | Retorna mensagem de erro |
| 14 | Campos todos preenchidos | `validateEmptyFields` retorna null |
| 15 | Campo vazio em objeto | Retorna string com nome do campo faltante |

---

### 1.2 storage (21 testes)

| # | Cenario | Resultado Esperado |
|---|---------|-------------------|
| 1 | localStorage vazio | `carregarDados` retorna objeto vazio |
| 2 | Dados salvos via `setItem` | `carregarDados` retorna dados identicos |
| 3 | Ciclo com todos pesos e reps vazios | `salvarDados` ignora o ciclo |
| 4 | Ciclo com pelo menos um peso preenchido | Preserva o ciclo |
| 5 | Salvar e recuperar registro no logbook | `carregarHistorico` retorna 1 entrada |
| 6 | Dois registros para o mesmo exercicio | `carregarHistorico` retorna 2 entradas |
| 7 | Exercicio sem historico | `carregarHistorico` retorna array vazio |
| 8 | Registro com `seriesValidas=3` | Extra kg e reps persistidos |
| 9 | `ultimoRegistro` — dois registros | Retorna o de maior `dataTs` |
| 10 | `ultimoRegistro` — filtra por `treinoId` | Retorna so o do treino correto |
| 11 | `ultimoRegistro` — sem registros | Retorna null |
| 12 | `exercicioDeveSubirPeso` — sem historico | Retorna false |
| 13 | `exercicioDeveSubirPeso` — bateu teto | Retorna true |
| 14 | `exercicioDeveSubirPeso` — nao bateu teto | Retorna false |
| 15 | BC com 4 blocos — `salvarRegistro` | `clusterSeries` com 4 objetos `{kg, reps}` persistido |
| 16 | RP com 2 blocos — `salvarRegistro` | `clusterSeries` com 2 objetos, `tecnica="RP"` persistido |
| 17 | `ultimoRegistro` com BC — `clusterSeries` | Array de 4 blocos preservado intacto |
| 18 | Registro sem tecnica | `clusterSeries` e `tecnica` ficam `undefined` |
| 19 | Mix normal + BC no mesmo historico | Ambos convivem: 2 entradas, tipos distintos |
| 20 | BC com blocos parciais | Todos os 4 blocos salvos, inclusive os zerados |
| 21 | `seriesValidas` no `ultimoRegistro` | Retorna o valor do registro mais recente |

---

### 1.3 timeFilter (10 testes)

| # | Cenario | Resultado Esperado |
|---|---------|-------------------|
| 1 | Array de opcoes de intervalo | Contem exatamente 7 opcoes |
| 2 | Primeira opcao | Valor e `Tudo` |
| 3 | Todas as opcoes esperadas | `Tudo, 1M, 3M, 6M, 1A, 3A, 5A` |
| 4 | Intervalo `Tudo` | `getCutoffTs` retorna 0 |
| 5 | Intervalo `1M` | Retorna NOW menos 30 dias |
| 6 | Intervalo `3M` | Retorna NOW menos 91 dias |
| 7 | Intervalo `6M` | Retorna NOW menos 182 dias |
| 8 | Intervalo `1A` | Retorna NOW menos 365 dias |
| 9 | Intervalo `3A` | Retorna NOW menos 1095 dias |
| 10 | Cutoff de `1M` vs `3M` | `1M` e mais recente que `3M` |

---

### 1.4 volumeLoadCalc (19 testes)

| # | Cenario | Resultado Esperado |
|---|---------|-------------------|
| 1 | localStorage vazio | Retorna array vazio |
| 2 | Dados de ano passado (fora da semana) | Nenhum musculo retornado |
| 3 | Supino 100x7 + 85x12 esta semana | Volume = 1720 |
| 4 | Dois exercicios do mesmo musculo | Acumula volumes (500+240 = 740) |
| 5 | Volume atual > semana anterior (1000 vs 800) | Delta = +25% |
| 6 | Exercicio sem mapeamento muscular | Ignorado (array vazio) |
| 7 | Conta series validas corretamente | `seriesAtual` = 2 para Top Set + Back-off |
| 8 | Logbook: `seriesValidas=3` com extra | Volume inclui extra; `seriesAtual` = 3 |
| 9 | Logbook: `seriesValidas=2` sem extra | `seriesAtual` = 2 |
| 10 | Logbook: `seriesValidas=2` mesmo com extraKg | Extra ignorado; `seriesAtual` = 2 |
| 11 | `calcTotalVolumeWeek` sem treinos | Retorna 0 |
| 12 | `calcTotalVolumeWeek` Supino + Agachamento | Soma total = 1650 |
| 13 | BC com 4 blocos todos preenchidos | Volume = 80×10+80×8+78×7+78×6 = 2454 |
| 14 | RP com 2 blocos | Volume = 100×8+100×5 = 1300 |
| 15 | BC com 2 blocos preenchidos e 2 zerados | `seriesAtual` = 2 (so os preenchidos) |
| 16 | BC com 3 blocos zerados e 1 preenchido | Volume = apenas o bloco preenchido (800) |
| 17 | BC com `clusterSeries: []` (vazio) | Fallback para topSet/backoff; volume = 1720 |
| 18 | Registro normal sem `clusterSeries` | Caminho normal inalterado; volume = 1720 |
| 19 | BC + registro normal do mesmo musculo mesma semana | Volumes acumulados corretamente (2454+500=2954) |
| 20 | Musculo com 2 series na semana | Badge de classificacao retornado: `"abaixo_estimulo"` (< 4 series) |
| 21 | Musculo com 6 series na semana | Badge retornado: `"adequado"` (4–10 series) |
| 22 | Musculo com 12 series na semana | Badge retornado: `"volume_alto"` (11–16 series) |
| 23 | Musculo com 18 series na semana | Badge retornado: `"risco_overtraining"` (> 16 series) |

---

### 1.5 workoutMetrics (13 testes)

| # | Cenario | Resultado Esperado |
|---|---------|-------------------|
| 1 | Todos pesos zero | `computeSessionPoint` retorna null |
| 2 | Pesos vazios | Retorna null |
| 3 | Data invalida | Retorna null |
| 4 | Pesos `100, 90, 80` | TopSet = 100 (primeiro peso) |
| 5 | Tres series com pesos | Backoff1 e Backoff2 extraidos corretamente |
| 6 | Apenas 1 serie registrada | Backoffs ficam como 0 |
| 7 | Data `01/01/2026` | Parseia DD/MM/YYYY e gera timestamp |
| 8 | Banco vazio | `buildExerciseHistory` retorna objeto vazio |
| 9 | Registros de datas diferentes | Ordena por data crescente |
| 10 | Mesma data com topSets diferentes | Mantem apenas o melhor topSet |
| 11 | Dois exercicios diferentes | Historicos separados por exercicio |
| 12 | Registro com data invalida | Ignorado no historico |
| 13 | Registro com todos pesos vazios | Ignorado no historico |

---

### 1.6 validateUUID (9 testes)

| # | Cenario | Resultado Esperado |
|---|---------|-------------------|
| 1 | UUID valido em lowercase | Retorna true |
| 2 | UUID valido em uppercase | Retorna true |
| 3 | UUID com letras mistas | Retorna true |
| 4 | String vazia | Retorna false |
| 5 | UUID sem hifens | Retorna false |
| 6 | UUID com segmento faltando | Retorna false |
| 7 | UUID com caracteres invalidos (`g`, `z`) | Retorna false |
| 8 | Texto aleatorio | Retorna false |
| 9 | UUID com espacos nas bordas | Retorna false |

---

### 1.7 handleApiError (7 testes)

| # | Cenario | Resultado Esperado |
|---|---------|-------------------|
| 1 | Erro generico com mensagem padrao | Exibe alert e relanca o erro |
| 2 | Error nativo com mensagem customizada | Alert mostra mensagem do Error |
| 3 | AxiosError com `response.data.message` | Alert mostra mensagem da API |
| 4 | AxiosError sem `response.data.message` | Alert mostra mensagem padrao |
| 5 | AxiosError sem `response` (rede caiu) | Alert mostra mensagem padrao |
| 6 | Erro que nao e Error nem AxiosError | Alert mostra mensagem padrao |
| 7 | Qualquer erro | Loga no `console.error` |

---

### 1.8 validationErrors (6 testes)

| # | Cenario | Resultado Esperado |
|---|---------|-------------------|
| 1 | Objeto de mensagens | Contem todas as 12 chaves esperadas |
| 2 | Todas as mensagens | Sao strings nao vazias |
| 3 | Mensagem `required` | Texto e `Este campo e obrigatorio.` |
| 4 | Mensagem `passwordMismatch` | Contem a palavra `senhas` |
| 5 | Mensagem `invalidCPF` | Contem formato `XXX.XXX.XXX-XX` |
| 6 | Mensagem `invalidPhone` | Contem formato `(XX) XXXXX-XXXX` |

---

### 1.9 epleyCalc (8 testes)

| # | Cenario | Resultado Esperado |
|---|---------|-------------------|
| 1 | `calcEpley(100, 5)` | Retorna 116.67 (100 × (1 + 5/30)) |
| 2 | `calcEpley(100, 1)` | Retorna 103.33 |
| 3 | `calcEpley(100, 0)` | Retorna 100 (reps=0 retorna o peso sem acrescimo) |
| 4 | `calcEpley(0, 5)` | Retorna 0 |
| 5 | Registro modo padrao — `extractReferenceBlock` | Retorna `{peso, reps}` do Top Set |
| 6 | Registro modo BC — `extractReferenceBlock` | Retorna `{peso, reps}` do Bloco 1 (R1); demais blocos ignorados |
| 7 | Registro modo RP — `extractReferenceBlock` | Retorna `{peso, reps}` do Bloco 1 (R1); demais blocos ignorados |
| 8 | Registro BC sem Bloco 1 preenchido | `extractReferenceBlock` retorna null |

---

## 2. DATA

### 2.1 cycles (19 testes)

Progressão: C1 Pico (5–6 reps · 2 séries) → C2 Intens. (7–8 · 3) → C3 Acum. (9–12 · 3) → C4 Deload (12–15 · 2)

| # | Cenario | Resultado Esperado |
|---|---------|-------------------|
| 1 | Array de ciclos | Contem exatamente 4 ciclos |
| 2 | IDs dos ciclos | C1, C2, C3, C4 nessa ordem |
| 3 | IDs unicos | Nenhum ID duplicado |
| 4 | Campos obrigatorios | Titulo, sigla e objetivo preenchidos |
| 5 | Faixa de reps | repMin < repMax em todos |
| 6 | Reps positivas | repMin e repMax > 0 |
| 7 | C1 Pico — faixa de reps | repMin=5, repMax=6 |
| 8 | C2 Intensificacao — faixa de reps | repMin=7, repMax=8 |
| 9 | C3 Acumulacao — faixa de reps | repMin=9, repMax=12 |
| 10 | C4 Deload — faixa de reps | repMin=12, repMax=15 |
| 11 | Series validas | Valor e 2 ou 3 em todos |
| 12 | C1 Pico | 2 series validas (alta intensidade, poucos sets) |
| 13 | C2 Intensificacao | 3 series validas |
| 14 | C3 Acumulacao | 3 series validas (maximo volume) |
| 15 | C4 Deload | 2 series validas (recuperacao) |
| 16 | C1 vs demais | C1 Pico tem a menor faixa de reps |
| 17 | C4 vs demais | C4 Deload tem a maior faixa de reps |
| 18 | Progressao C1 a C3 | reps crescem de C1 para C3 |
| 19 | C3 vs C2 | Acumulacao tem reps mais altas que Intensificacao |

---

### 2.2 muscleMap (22 testes)

| # | Cenario | Resultado Esperado |
|---|---------|-------------------|
| 1 | Exercicios de Upper A | Todos tem mapeamento muscular |
| 2 | Exercicios de Lower A | Todos tem mapeamento muscular |
| 3 | Exercicios de Upper B | Todos tem mapeamento muscular |
| 4 | Exercicios de Lower B | Todos tem mapeamento muscular |
| 5 | Exercicios de Braco | Todos tem mapeamento muscular |
| 6 | Todas as sessoes | Nenhum exercicio sem mapeamento |
| 7 | Grupo Peitoral | Presente no mapa |
| 8 | Grupo Costas | Presente no mapa |
| 9 | Grupo Ombro | Presente no mapa |
| 10 | Grupo Quadriceps | Presente no mapa |
| 11 | Grupo Posterior/Gluteo | Presente no mapa |
| 12 | Grupo Panturrilha | Presente no mapa |
| 13 | Grupo Braco | Presente no mapa |
| 14 | Grupo Core | Presente no mapa |
| 15 | Todos os valores do mapa | Pertencem a um dos 8 grupos |
| 16 | Supino Reto | Mapeado para Peitoral |
| 17 | Barra fixa | Mapeado para Costas |
| 18 | Desenvolvimento Lateral cabo | Mapeado para Ombro |
| 19 | Agachamento | Mapeado para Quadriceps |
| 20 | Stiff | Mapeado para Posterior/Gluteo |
| 21 | Panturrilha sentado | Mapeado para Panturrilha |
| 22 | Abdomen no cabo | Mapeado para Core |

---

### 2.3 sessionExercises (11 testes)

| # | Cenario | Resultado Esperado |
|---|---------|-------------------|
| 1 | Estrutura geral | Exatamente 5 sessoes |
| 2 | SESSOES_LABELS | Lista todas as 5 sessoes |
| 3 | Nomes das sessoes | Upper A, Lower A, Upper B, Lower B, Braco |
| 4 | Upper A | Pelo menos 6 exercicios |
| 5 | Lower A | Pelo menos 6 exercicios |
| 6 | Upper B | Pelo menos 6 exercicios |
| 7 | Lower B | Pelo menos 6 exercicios |
| 8 | Braco | Pelo menos 2 exercicios |
| 9 | Todos exercicios | Nome e musculo preenchidos |
| 10 | Nomes vs catalogo | Todos existem no array EXERCICIOS |
| 11 | Upper A | Contem exercicio de peito |

---

### 2.4 exercise (8 testes)

| # | Cenario | Resultado Esperado |
|---|---------|-------------------|
| 1 | Exportacao | Array nao vazio |
| 2 | Tipo dos itens | Todas strings nao vazias |
| 3 | Duplicatas | Nenhum nome duplicado |
| 4 | Compostos principais | Contem Agachamento, Levantamento Terra, Supino |
| 5 | Isolamento | Contem Cadeira Extensora, Triceps Polia |
| 6 | Costas | Contem Barra fixa, Puxada na Frente, Remada |
| 7 | Core | Contem Abdomen no cabo |
| 8 | Panturrilha | Pelo menos 2 exercicios de panturrilha |

---

## 3. SERVICES

### 3.1 authService (8 testes)

| # | Cenario | Resultado Esperado |
|---|---------|-------------------|
| 1 | Registrar novo usuario | Salva token no localStorage |
| 2 | Registro bem-sucedido | Retorna objeto com `token` |
| 3 | Registrar email duplicado | Lanca erro |
| 4 | Registro | Salva email no localStorage |
| 5 | Login com credenciais corretas | Retorna token |
| 6 | Login com credenciais validas | Token salvo no localStorage |
| 7 | Login com senha incorreta | Lanca erro |
| 8 | Login com email inexistente | Lanca erro |

---

### 3.2 userService (5 testes)

| # | Cenario | Resultado Esperado |
|---|---------|-------------------|
| 1 | Sem token no localStorage | Retorna null e redireciona |
| 2 | Token presente mas sem email | Retorna null |
| 3 | Token e email validos com usuario cadastrado | Retorna dados do usuario |
| 4 | Token JWT expirado | Lanca erro `Token expirado` |
| 5 | Email nao encontrado na base local | Lanca erro `Usuario nao encontrado` |

---

## 4. CONTEXTS

### 4.1 AuthContext (4 testes)

| # | Cenario | Resultado Esperado |
|---|---------|-------------------|
| 1 | Importar AuthContext | Exporta contexto React valido |
| 2 | Valor padrao do contexto | E `undefined` |
| 3 | `useAuth` fora do AuthProvider | Lanca erro com mensagem especifica |
| 4 | `useAuth` dentro do AuthProvider | Retorna user, login e logout |

---

## 5. HOOKS

### 5.1 useDadosTreino (5 testes)

| # | Cenario | Resultado Esperado |
|---|---------|-------------------|
| 1 | localStorage vazio | Retorna objeto vazio |
| 2 | Dados com Supino C1 | Agrupa registros por exercicio |
| 3 | Ciclo legado `Ciclo 1` | Normaliza para `C1` |
| 4 | Tres pesos `120, 100, 90` | TopSet calculado como 120 |
| 5 | Pesos todos invalidos/vazios | Registro ignorado |

---

### 5.2 useRelatorio (9 testes)

| # | Cenario | Resultado Esperado |
|---|---------|-------------------|
| 1 | localStorage vazio | Retorna linhas vazias |
| 2 | Dados presentes | Carrega registros ao montar |
| 3 | Multiplas datas | Ordena por data decrescente |
| 4 | Lista de exercicios | Exercicios unicos e ordenados |
| 5 | Filtrar por exercicio `Agachamento` | So exibe linhas de Agachamento |
| 6 | Filtro de exercicio vazio | Retorna todas as linhas |
| 7 | Filtro de periodo `1M` | Exclui registros fora de 30 dias |
| 8 | Editar observacao do registro 0 | Atualiza a linha correta |
| 9 | Excluir registro 0 | Remove a linha do estado |

---

### 5.3 useBreakpoint (7 testes)

| # | Cenario | Resultado Esperado |
|---|---------|-------------------|
| 1 | Tela 1024x900 (desktop) | Retorna `false` (nao e mobile) |
| 2 | Tela 500x800 (mobile) | Retorna `true` (e mobile) |
| 3 | Breakpoint customizado 400 em tela 500 | Retorna `false` |
| 4 | innerHeight 600 menor que breakpoint | Retorna `true` |
| 5 | Resize de 1024 para 500 | Atualiza de `false` para `true` |
| 6 | Desmontar componente | Remove event listeners |
| 7 | Evento orientationchange | Listener registrado e removido |

---

## 6. PAGES

### 6.1 Login (9 testes)

| # | Cenario | Resultado Esperado |
|---|---------|-------------------|
| 1 | Renderizacao | Exibe titulo `Digite sua senha` |
| 2 | Campo de email | Placeholder `E-mail` presente |
| 3 | Campo de senha | Placeholder `Senha` presente |
| 4 | Botao de entrar | Botao `Entrar` visivel |
| 5 | Link de cadastro | Texto `Cadastre-se aqui` visivel |
| 6 | Digitar no email | Chama `handleChange` uma vez |
| 7 | Submeter formulario | Chama `handleSubmit` uma vez |
| 8 | passwordVisible=false | Campo senha tipo `password` |
| 9 | passwordVisible=true | Campo senha tipo `text` |

---

## 7. ROUTER

### 7.1 PrivateRoute (4 testes)

| # | Cenario | Resultado Esperado |
|---|---------|-------------------|
| 1 | Sem token no localStorage | Conteudo protegido nao e exibido |
| 2 | Sem token | Redireciona para `/` |
| 3 | Com token valido | Renderiza children normalmente |
| 4 | Com token e multiplos children | Renderiza todos os children |

---

## 8. COMPONENTES UI

### 8.1 Input + Button (6 testes)

| # | Cenario | Resultado Esperado |
|---|---------|-------------------|
| 1 | Input com placeholder `Teste` | Input renderizado no DOM |
| 2 | Digitar no input | `onChange` chamado 1 vez |
| 3 | Input com value `42` | Valor exibido no campo |
| 4 | Button com texto `Salvar` | Botao renderizado |
| 5 | Clicar no button | `onClick` chamado 1 vez |
| 6 | Button variante `outline` | Renderiza sem erro |

---

### 8.2 FormField (8 testes)

| # | Cenario | Resultado Esperado |
|---|---------|-------------------|
| 1 | FormField com placeholder | Input renderizado no DOM |
| 2 | FormField com label | Label visivel |
| 3 | FormField sem label | Nenhum label no DOM |
| 4 | Erro `Campo obrigatorio` | Mensagem de erro exibida |
| 5 | Erro null | Nenhuma mensagem de erro |
| 6 | Digitar no campo | `onChange` chamado 1 vez |
| 7 | Value `Maria` | Valor exibido no input |
| 8 | Campo de senha `isPasswordField` | Tipo do input e `password` |

---

### 8.3 CheckboxGroup (8 testes)

| # | Cenario | Resultado Esperado |
|---|---------|-------------------|
| 1 | 3 opcoes fornecidas | Todas as opcoes renderizadas |
| 2 | Linhas de baixo | Textos secundarios visiveis |
| 3 | Selected `C2` | Apenas checkbox C2 marcado |
| 4 | Modo single: clicar em C1 | `onChange` chamado com `["C1"]` |
| 5 | Modo single: clicar em outro | Substitui selecao anterior |
| 6 | Modo single: clicar no ja selecionado | Deseleciona (array vazio) |
| 7 | Modo multiple: adicionar C2 | `onChange` com `["C1", "C2"]` |
| 8 | Modo multiple: remover C1 | `onChange` com `["C2"]` |

---

### 8.4 NativeSelect (6 testes)

| # | Cenario | Resultado Esperado |
|---|---------|-------------------|
| 1 | 3 opcoes | Todas renderizadas |
| 2 | Label `Periodo` | Label visivel |
| 3 | Sem label | Nenhum label no DOM |
| 4 | Selecionar opcao B | `onChange` chamado com `"b"` |
| 5 | Value `b` | Select exibe opcao B selecionada |
| 6 | Disabled=true | Select desabilitado |

---

### 8.5 IconButton (4 testes)

| # | Cenario | Resultado Esperado |
|---|---------|-------------------|
| 1 | Icone passado como prop | Icone renderizado |
| 2 | Clicar no botao | `onClick` chamado 1 vez |
| 3 | Title `Excluir` | Atributo title presente |
| 4 | Elemento renderizado | E um `<button>` |

---

## 9. COMPONENTES DE FEATURE

### 9.1 TreinoSessao (73 testes)

**Renderização inicial (3)**

| # | Cenario | Resultado Esperado |
|---|---------|-------------------|
| 1 | Titulo | `GymWave Strength` visivel |
| 2 | Seletores de sessao | Upper A, Upper B, Lower A, Lower B, Braço visiveis |
| 3 | Sem sessao selecionada | Mensagem `selecione um treino` exibida |

**Seleção de sessão (6)**

| # | Cenario | Resultado Esperado |
|---|---------|-------------------|
| 4 | Selecionar Upper A | `Supino reto barra` carregado como primeiro exercicio |
| 5 | Selecionar Lower A | `Terra sumô` carregado como primeiro exercicio |
| 6 | Selecionar Upper B | `Barra fixa pronada` carregado como primeiro exercicio |
| 7 | Selecionar Lower B | `Agachamento livre` carregado como primeiro exercicio |
| 8 | Selecionar Braço | `Tríceps testa` carregado como primeiro exercicio |
| 9 | Sessao com 8 exercicios | Contador `1 / 8` exibido |

**Top Set + Back-off (6)**

| # | Cenario | Resultado Esperado |
|---|---------|-------------------|
| 10 | Bloco Top Set | Campos kg e reps presentes com labels corretos |
| 11 | Confirmar Top Set sem dados | Botao desabilitado (`disabled`) |
| 12 | Confirmar Top Set com dados validos | Bloco Back-off aparece |
| 13 | Back-off apos confirmar Top Set 100kg | Peso sugerido automaticamente = 85 (85%) |
| 14 | Top Set com reps no teto (9 reps, faixa 5–9) | Badge verde `Teto atingido` exibido |
| 15 | Top Set abaixo da faixa (3 reps, faixa 5–9) | Badge vermelho `Abaixo da faixa` exibido |

**Série Extra (seriesValidas) (6)**

`seriesValidas` vem sempre do plano (`planoTreino` ou padrão `SESSOES`) — nunca do histórico/`logbook`. Ver EF_02 RG1.2 e MIGRACAO.md.

| # | Cenario | Resultado Esperado |
|---|---------|-------------------|
| 16 | `planoTreino` com `series_validas=3` | Badge `3 válidas` exibido |
| 17 | Sem historico (padrao) | Badge `2 válidas` exibido |
| 18 | `planoTreino` com `series_validas=3` + Top Set + Back-off confirmados | Bloco `Série Extra` aparece |
| 19 | `seriesValidas=2` (padrao) | Bloco `Série Extra` nao aparece |
| 20 | Salvar com `seriesValidas=2` | `seriesValidas=2` persistido no logbook |
| 20b | `planoTreino` com `series_validas=3` + logbook com `seriesValidas=2` (treino anterior) | Badge `3 válidas` exibido — plano prevalece sobre historico |

**Banners de progressão (1)**

| # | Cenario | Resultado Esperado |
|---|---------|-------------------|
| 21 | Primeiro registro do exercicio | Banner azul `Primeiro registro — defina o peso` |

**Navegação entre exercícios (2)**

| # | Cenario | Resultado Esperado |
|---|---------|-------------------|
| 22 | Clicar `Pular` | Contador avanca para `2 / 8` |
| 23 | Setas de navegacao anterior / proximo | Contador atualiza corretamente nos dois sentidos |

**Salvamento (2)**

| # | Cenario | Resultado Esperado |
|---|---------|-------------------|
| 24 | Confirmar + Salvar | Registro persistido em `logbook` e `dadosTreino` no localStorage |
| 25 | Apos salvar | Toast `treino salvo` visivel e bloco de resumo exibido |

**Edição de exercícios já confirmados (5)**

| # | Cenario | Resultado Esperado |
|---|---------|-------------------|
| 26 | Campos Top Set apos confirmacao | Inputs continuam editaveis (nao desabilitados) |
| 27 | Voltar para exercicio confirmado | Valor de kg preservado e editavel |
| 28 | Editar kg apos confirmacao e navegar | Novo valor permanece ao voltar |
| 29 | Clicar `Editar Top Set` | Botao `Confirmar Top Set` reaparece |
| 30 | Top Set + Back-off confirmados | Indicador `✓` verde no nome do exercicio |

**Rascunho por sessão (3)**

| # | Cenario | Resultado Esperado |
|---|---------|-------------------|
| 31 | Digitar em Upper A, trocar para Upper B e voltar | Valor digitado em Upper A restaurado |
| 32 | Confirmar Top Set em Upper A, trocar e voltar | Estado de confirmacao (`topSetConfirmed`) preservado |
| 33 | Upper B comeca limpo mesmo com dados em Upper A | Inputs de Upper B vazios |

**Diferenciação visual — sugestão do histórico (4)**

| # | Cenario | Resultado Esperado |
|---|---------|-------------------|
| 34 | Peso vem do historico | Input tem `data-suggestion="true"` |
| 35 | Usuario edita o campo sugerido | `data-suggestion` removido |
| 36 | Sem historico | Input nao tem `data-suggestion` |
| 37 | Apos confirmar Top Set com sugestao | `data-suggestion` removido |

**Tela de revisão pré-save (8)**

| # | Cenario | Resultado Esperado |
|---|---------|-------------------|
| 38 | Ultimo exercicio | Botao `Ver Resumo` visivel em vez de `Salvar treino` |
| 39 | Clicar `Ver Resumo` | Tela de revisao com `Revisar antes de salvar` aparece |
| 40 | Tela de revisao | Todos os exercicios da sessao listados |
| 41 | Exercicio com Top Set + Back-off confirmados | `Top: 100kg × 7reps` exibido no resumo |
| 42 | Exercicio com `Pular` | `Pulado` exibido no resumo |
| 43 | Clicar `Editar` no primeiro exercicio da revisao | Volta para exercicio 1 (`1 / 8`) |
| 44 | Clicar `Voltar ao exercicio` | Revisao fecha; exercicio atual reexibido |
| 45 | Clicar `Confirmar e Salvar Treino` | Dados persistidos; toast e resumo pos-save exibidos |

**Alterações não salvas (4)**

| # | Cenario | Resultado Esperado |
|---|---------|-------------------|
| 46 | Digitar kg no Top Set | `onUnsavedChanges` chamado com `true` |
| 47 | Apos salvar treino | `onUnsavedChanges` chamado com `false` |
| 48 | Sem sessao selecionada | `onUnsavedChanges` chamado com `false` |
| 49 | Com alteracoes nao salvas | Listener `beforeunload` registrado no `window` |

**Banner de PR em tempo real (4)**

| # | Cenario | Resultado Esperado |
|---|---------|-------------------|
| 50 | Top Set 100kg / 7reps, PR historico 1RM=100 → 1RM atual=123.33 | Banner `[banner_pr]` exibido (verde/dourado pulsante) |
| 51 | Top Set 80kg / 5reps, PR historico 1RM=130 → 1RM atual=93.33 | Banner permanece no estado normal (abaixo do PR) |
| 52 | Faixa 6–8reps, digitar reps=8 (teto) independente do peso historico | Banner `[banner_pr]` ativo ao atingir o teto da faixa |
| 53 | Apagar campo de peso apos banner_pr estar ativo | Banner retorna ao estado normal imediatamente |

**Tecnica Deload — 1 serie valida (20)**

| # | Cenario | Resultado Esperado |
|---|---------|-------------------|
| 54 | Chip `Deload` renderizado | Botao `Deload` visivel no card |
| 55 | Ativar Deload com historico (100kg) | Aviso de deload visivel; Top Set pré-preenchido com 100kg |
| 56 | Ativar Deload | Bloco Back-off oculto |
| 57 | Ativar Deload | Top Set preservado conforme historico |
| 58 | Desativar Deload com historico (backoff 85kg) | Bloco Back-off restaurado com valor do historico (85kg) |
| 59 | Desativar Deload sem historico | Bloco Back-off restaurado limpo |
| 60 | Deload mutua exclusividade — ativar RP após Deload | Chip RP ativo; chip Deload inativo |
| 61 | Deload mutua exclusividade — ativar Deload após RP | Chip Deload ativo; chip RP inativo |
| 62 | Exercicio feito em Deload — `isExerciseDone` | Ponto verde/titulo com `✓` apos confirmar Top Set |
| 63 | Botao `Proximo` em Deload sem Top Set confirmado | Aviso exibido; nao avanca |
| 64 | Botao `Proximo` em Deload com Top Set confirmado | Avanca normalmente |
| 65 | Salvar treino com Deload | `isDeload: true` no registro do logbook |
| 66 | Salvar treino com Deload | `backoffKg: 0` no registro |
| 67 | Salvar treino com Deload | `topSetKg` correto no registro |
| 68 | Revisao pre-save com exercicio Deload | Etiqueta `· Deload` em vermelho visivel |
| 69 | Ativar Deload e confirmar Top Set | Titulo do exercicio exibe `✓` |
| 70 | Deload com `Proximo` validacao | Back-off NAO e exigido |
| 71 | Ativar Deload restaura pesos do historico no Top Set | Campo Top Set kg = peso do ultimo registro |
| 72 | Desativar Deload restaura Back-off com sugestao azul | `data-suggestion="true"` nos campos de Back-off restaurados |
| 73 | Salvar com Deload — `seriesValidas=1` | Apenas Top Set no registro; backoff zerado |

---

### 9.2 CycleCard (5 testes)

| # | Cenario | Resultado Esperado |
|---|---------|-------------------|
| 1 | Renderizacao | Titulo `Registre seu treino` visivel |
| 2 | Seletor de exercicio | Texto `Escolha seu exercicio` visivel |
| 3 | Ciclos disponiveis | Ciclo 1 e Ciclo 4 visiveis |
| 4 | Campos de serie | Campo `1a serie` visivel |
| 5 | Botao salvar | Texto `Salvar` presente |

---

### 9.3 CycleCard.logic (9 testes)

| # | Cenario | Resultado Esperado |
|---|---------|-------------------|
| 1 | `parseData("15/06/2026")` | Date com dia 15, mes 5, ano 2026 |
| 2 | `parseData("01/01/2025")` | Date com dia 1, mes 0, ano 2025 |
| 3 | `parseData("")` | Retorna null |
| 4 | `parseData("15/06")` (incompleto) | Retorna null |
| 5 | `parseData("15062026")` (sem barra) | Retorna null |
| 6 | `formatarData(15/jun/2026)` | Retorna `15/06/2026` |
| 7 | `formatarData(5/jan/2026)` | Retorna `05/01/2026` (zero a esquerda) |
| 8 | `formatarData(31/dez/2025)` | Retorna `31/12/2025` |
| 9 | Parse + format ida e volta | Preserva a data original |

---

### 9.4 GraphicsContainer (8 testes)

| # | Cenario | Resultado Esperado |
|---|---------|-------------------|
| 1 | Renderizacao | Titulo `Graficos de intensidade` visivel |
| 2 | Seletor de exercicio | Label `Exercicio` presente |
| 3 | Seletor de periodo | Label `Periodo` presente |
| 4 | Seletor de ciclos | Texto `Ciclos para comparar` visivel |
| 5 | Sem exercicios | Mensagem `Nenhum exercicio encontrado` |
| 6 | Historico com Top Set igual ao repMax do exercicio | Ponto do Grafico de Repeticoes destacado em verde com icone seta para cima (↑) |
| 7 | Historico com Top Set acima do repMax do exercicio | Ponto destacado em verde com icone seta para cima (↑) |
| 8 | Historico com sessao usando tecnica BC ou RP | Barra do Grafico de Volume Load exibida em cor alternativa e tooltip contem nome da tecnica |

---

### 9.5 VolumeLoad (9 testes)

| # | Cenario | Resultado Esperado |
|---|---------|-------------------|
| 1 | Renderizacao | Titulo `Volume load por musculo` visivel |
| 2 | Subtitulo | `Semana atual vs semana anterior` visivel |
| 3 | Sem treinos | Mensagem `Nenhum treino registrado` |
| 4 | Supino esta semana | Card `Peitoral` exibido |
| 5 | Remada esta semana | Card `Costas` exibido |
| 6 | Musculo com 2 series na semana | Badge `abaixo do estimulo` (amarelo) renderizado no card |
| 7 | Musculo com 6 series na semana | Badge `adequado` (verde) renderizado no card |
| 8 | Musculo com 12 series na semana | Badge `volume alto` (laranja) renderizado no card |
| 9 | Musculo com 18 series na semana | Badge `risco overtraining` (vermelho) renderizado no card |

---

### 9.6 ReportPage (5 testes)

| # | Cenario | Resultado Esperado |
|---|---------|-------------------|
| 1 | Renderizacao | Titulo `Relatorios de treinos` visivel |
| 2 | Filtro de exercicio | Label `Exercicio` presente |
| 3 | Filtro de periodo | Label `Periodo` presente |
| 4 | Sem registros | Renderiza sem erro |
| 5 | Com dados no localStorage | Exibe `Supino Reto` na lista |

---

### 9.7 ReportItem (7 testes)

| # | Cenario | Resultado Esperado |
|---|---------|-------------------|
| 1 | Card com dados | Data, exercicio e ciclo visiveis |
| 2 | Duas series | `Serie 1` e `Serie 2` renderizadas |
| 3 | Detalhes das series | `5 reps x 100 kg` exibido |
| 4 | Observacao vazia | Secao de observacoes nao renderizada |
| 5 | Observacao preenchida | Texto da observacao visivel |
| 6 | Clicar Editar | `onEdit` chamado 1 vez |
| 7 | Clicar Excluir | `onDelete` chamado 1 vez |

---

### 9.8 Exportar (36 testes)

**Renderização (6)**

| # | Cenario | Resultado Esperado |
|---|---------|-------------------|
| 1 | Renderizacao | Titulo `Exportar dados` visivel |
| 2 | Subtitulo | Texto `backup` presente |
| 3 | Botao CSV | `Exportar como CSV` visivel |
| 4 | Botao JSON | `Exportar como JSON` visivel |
| 5 | Botao de import | `Importar planilha` visivel |
| 6 | Drop zone inicial | Nao visivel antes de abrir o import |

**Contagem de registros (2)**

| # | Cenario | Resultado Esperado |
|---|---------|-------------------|
| 7 | Sem dados | Exibe `0 treinos` |
| 8 | 3 registros no localStorage | Exibe `3 treinos` |

**Download (2)**

| # | Cenario | Resultado Esperado |
|---|---------|-------------------|
| 9 | Clicar CSV | Download dispara sem erro |
| 10 | Clicar JSON | Download dispara sem erro |

**Toggle de importação (5)**

| # | Cenario | Resultado Esperado |
|---|---------|-------------------|
| 11 | Clicar `Importar planilha` | Drop zone aparece |
| 12 | Clicar `Fechar importação` | Seção de import some |
| 13 | Apos abrir | Botao muda para `Fechar importação` |
| 14 | Botao Confirmar | Comeca desabilitado |
| 15 | Input de arquivo | Aceita apenas `.xlsx` e `.csv` |

**Upload CSV (4)**

| # | Cenario | Resultado Esperado |
|---|---------|-------------------|
| 17 | Carregar CSV | Preview com contagem de linhas exibido |
| 18 | Preview do CSV | Exercicios visiveis na tabela |
| 19 | Apos carregar | Botao Confirmar habilitado |
| 20 | Cabecalhos de ciclo | `C1 kg, C2 kg, C3 kg, C4 kg` exibidos |

**Upload XLSX (2)**

| # | Cenario | Resultado Esperado |
|---|---------|-------------------|
| 21 | Carregar XLSX | Preview com contagem de linhas exibido |
| 21b | Cabeçalhos com quebra `\r\n` real do Excel (logbook v4 — `Top\r\nMín`, `TOP SET\r\nKg`, etc.) | Reps min/max e pesos C1/C2 mapeados corretamente na pré-visualização |

**Confirmação de importação (8)**

| # | Cenario | Resultado Esperado |
|---|---------|-------------------|
| 22 | Confirmar importacao | Dados salvos no localStorage |
| 23 | Multiplos ciclos | C1, C2, C3 do mesmo exercicio salvos separados |
| 24 | Peso vazio em ciclo | Ciclo nao e salvo |
| 25 | Resultado | Exibe `Migração concluída` com adicionados e preservados |
| 26 | Feedback por sessao | Exibe `Upper A` e `Lower A` |
| 27 | Apos confirmar | Preview resetado |
| 28 | Reps salvas | Reps salvas vazias (usuario preenche no treino) |
| 29 | Pesos duplicados | Repetidos para cada serie valida |

**Plano de treino — planoTreino (3)**

| # | Cenario | Resultado Esperado |
|---|---------|-------------------|
| 35 | Confirmar importacao | `planoTreino` salvo no localStorage |
| 36 | `planoTreino` salvo | Contém `ordem` correto por exercicio/sessao |
| 37 | `planoTreino` salvo | Contém `series_validas` correto por exercicio/sessao |

**Migração inteligente (5)**

| # | Cenario | Resultado Esperado |
|---|---------|-------------------|
| 30 | Exercicio novo (nao existe no banco) | Ciclos com peso adicionados normalmente |
| 31 | Exercicio existente com ciclo existente | Entrada existente preservada, nao sobrescrita |
| 32 | Exercicio existente com ciclo novo | Novo ciclo adicionado, ciclos existentes intactos |
| 33 | Resultado com dados novos (banco vazio) | Exibe `4 adicionado(s) · 0 preservado(s)` |
| 34 | Resultado com exercicio ja existente | Exibe adicionados < total e preservados > 0 |

---

### 9.9 AdminImport (26 testes)

| # | Cenario | Resultado Esperado |
|---|---------|-------------------|
| 1 | Renderizacao | Titulo `Importar dados` visivel |
| 2 | Drop zone | Texto `Arraste e solte` visivel |
| 3 | Botao Confirmar | Comeca desabilitado |
| 4 | Botao Limpar tudo | Sempre habilitado |
| 5 | Input de arquivo | Aceita apenas `.xlsx` e `.csv` |
| 6 | Carregar CSV | Exibe preview com contagem de linhas |
| 7 | Preview do CSV | Exercicios visiveis na tabela |
| 8 | Apos carregar | Botao Confirmar habilitado |
| 9 | Cabecalhos de ciclo | `C1 kg, C2 kg, C3 kg, C4 kg` exibidos |
| 10 | Carregar XLSX | Preview com contagem de linhas |
| 11 | Confirmar importacao | Dados salvos no localStorage |
| 12 | Multiplos ciclos do mesmo exercicio | C1, C2, C3 salvos separados |
| 13 | Peso vazio em ciclo | Ciclo nao e salvo |
| 14 | Resultado da importacao | Exibe total de registros salvos |
| 15 | Feedback por sessao | Exibe `Upper A` e `Lower A` |
| 16 | Apos confirmar | Preview resetado |
| 17 | Reps salvas | Reps salvas vazias (usuario preenche no treino) |
| 18 | Pesos duplicados | Repetidos para cada serie valida |
| 19 | Clicar Limpar tudo | Abre `confirm` do navegador |
| 20 | Cancelar confirm | Dados nao sao limpos |
| 21 | Aceitar confirm | localStorage limpo |
| 22 | Series validas = 3 | Array de pesos tem 3 elementos |
| 23 | Supino C1 com peso 60 | `pesos[0]` = `"60"` |
| 24 | Desfazer — backup salvo antes de importar | `dadosTreino_backup` no localStorage com dados anteriores |
| 25 | Desfazer — botao visivel apos confirmar | Botao `Desfazer importacao` aparece no resultado |
| 26 | Desfazer — confirm=true restaura backup | localStorage volta ao estado anterior, sem dados novos |
| 27 | Desfazer — confirm=false nao restaura | Dados importados permanecem no localStorage |
| 28 | Desfazer — esconde resultado apos desfazer | `Importacao concluida` sumido da tela |

---

### 9.10 BottomNav (14 testes)

| # | Cenario | Resultado Esperado |
|---|---------|-------------------|
| 1 | Renderizacao | 5 itens: Registrar, Graficos, Volume, Relatorios, Exportar |
| 2 | Aria-label | `navegacao principal` presente |
| 3 | Tab `registrar` ativa | Renderiza sem erro |
| 4 | Tab `graficos` ativa | Renderiza sem erro |
| 5 | Tab `volume` ativa | Renderiza sem erro |
| 6 | Tab `relatorio` ativa | Renderiza sem erro |
| 7 | Tab `exportar` ativa | Renderiza sem erro |
| 8 | Clicar em Graficos | `onChange` com `"graficos"` |
| 9 | Clicar em Volume | `onChange` com `"volume"` |
| 10 | Clicar em Relatorios | `onChange` com `"relatorio"` |
| 11 | Clicar em Exportar | `onChange` com `"exportar"` |
| 12 | Clicar em Registrar | `onChange` com `"registrar"` |
| 13 | Um clique | `onChange` chamado exatamente 1 vez |
| 14 | Troca de tab | Callback recebe ID correto |

---

### 9.11 PowerliftingChart (22 testes)

**Dados e cálculo (4)**

| # | Cenario | Resultado Esperado |
|---|---------|-------------------|
| 1 | Sem dados no localStorage | Mensagem `[sem_dados]` exibida |
| 2 | Registro modo padrao (100kg × 7reps) | 1RM plotado = 123.33 (Epley com Top Set) |
| 3 | Registro modo BC — Bloco 1 com 100kg × 8reps, blocos 2-4 menores | 1RM calculado = 126.67 usando apenas Bloco 1 |
| 4 | Registro modo RP — Bloco 1 com 120kg × 5reps | 1RM calculado = 140 usando apenas Bloco 1 |

**Linha de PR e badges (2)**

| # | Cenario | Resultado Esperado |
|---|---------|-------------------|
| 5 | Historico com varios registros | Linha PR (dourada pontilhada) posicionada no maior 1RM historico |
| 6 | Sessao que superou o PR historico vigente | Ponto do grafico exibe marcador de conquista (estrela ou anel brilhante) |

**Card de estatísticas (4)**

| # | Cenario | Resultado Esperado |
|---|---------|-------------------|
| 7 | Exercicio com historico no periodo | Card de stats exibe 1RM atual, variacao, sessoes e data do ultimo PR |
| 8 | 1RM atual maior que sessao anterior | Celula `Variacao` exibe valor positivo em verde |
| 9 | 1RM atual menor que sessao anterior | Celula `Variacao` exibe valor negativo em vermelho |
| 10 | Apenas uma sessao no periodo | Celula `Variacao` exibe `—` (sem comparacao) |

**Layout responsivo (4)**

| # | Cenario | Resultado Esperado |
|---|---------|-------------------|
| 11 | Viewport mobile (< 768px) | Card de stats exibido em grid 2×2; filtro de periodo como chips |
| 12 | Viewport desktop (>= 768px) | Card de stats em linha horizontal; filtros inline lado a lado |
| 13 | Filtro de periodo — selecionar chip `1m` | Grafico e card de stats atualizam para os ultimos 30 dias |
| 14 | Tooltip mobile — tocar na area do grafico | Card flutuante exibe data + 1RM + peso × reps + tecnica do ponto mais proximo |

**Deload — destaque no grafico (8)**

| # | Cenario | Resultado Esperado |
|---|---------|-------------------|
| 15 | Registro com `isDeload=true` (100kg × 7reps, backoff=0) | 1RM = 123.33 (backoff 0 nao zera o 1RM) |
| 16 | Registro Deload no historico | Contabilizado em `Sessoes` do card de stats |
| 17 | Registro Deload com mesmo peso que sessao anterior | Sem badge de PR (nao superou o recorde) |
| 18 | Registro Deload com peso menor que sessao anterior | `Variacao` exibe valor negativo |
| 19 | PR absoluto existente — sessao Deload nao o supera | Linha de PR mantida no valor anterior |
| 20 | Apenas registros com `isDeload=true` | 1RM correto exibido no card de stats |
| 21 | Mix normal + RP + Deload | Tres sessoes contabilizadas no card |
| 22 | Registro sem campo `isDeload` (undefined) | Tratado como nao-deload; sem marcador vermelho |

---

## Resumo por Area

| Area | Arquivos | Testes |
|------|----------|--------|
| Utils | 9 | 126 |
| Data | 4 | 66 |
| Services | 2 | 13 |
| Contexts | 1 | 4 |
| Hooks | 3 | 20 |
| Pages | 1 | 9 |
| Router | 1 | 4 |
| Componentes UI | 5 | 32 |
| Componentes Feature | 11 | 207 |
| **Total** | **37** | **481** |
