# PerformFit — Regras de Negócio

> **Treino e performance encaixados na sua vida.**
> App para alunos **iniciantes** (fase 1). Quem evolui segue para o GymWave Strength
> (fase 2, controle de carga em kg — documentado nos arquivos `EF/`).

Cada regra tem um código (`RN-xx.y`) que é citado nos testes automatizados
(`src/__tests__`). Ao mudar uma regra, mude primeiro este documento, depois o teste
e só então o código.

---

## Conceitos

| Termo | Significado |
|---|---|
| **Professor** | Monta o treino do aluno na planilha padrão e envia o arquivo para ele. |
| **Aluno** | Usa o app no próprio celular: importa a planilha, treina e marca as séries. |
| **Plano** | O treino importado da planilha: lista de treinos (A, B, C…) e seus exercícios. |
| **Treino** | Um dia do plano (ex.: "Treino A"). Cada treino tem seus exercícios em ordem. |
| **Série válida** | Uma série feita de verdade. O aluno marca um checkbox por série; **não anota peso**. |
| **Execução** | O registro de um exercício num treino salvo: séries planejadas, séries feitas e anotação. |
| **Treino feito** | Treino + data com pelo menos 1 série marcada. |

---

## RN-01 — Planilha padrão (montada pelo professor)

- **RN-01.1** A planilha tem **uma aba** com estas colunas (o nome da coluna é o que vale; maiúsculas e acentos não importam):

  | Coluna | Obrigatória | Exemplo | Regra |
  |---|---|---|---|
  | Treino | Sim | `Treino A` | Nome do dia de treino. |
  | Ordem | Não | `1` | Ordem do exercício no treino. Sem ordem, vale a ordem das linhas. |
  | Exercício | Sim | `Leg press` | Nome do exercício. O vídeo é buscado por esse nome (RN-07). |
  | Grupo muscular | Sim | `Quadríceps` | Usado nas telas de séries por grupo (RN-06). |
  | Séries | Sim | `3` | Número inteiro de **1 a 6** = quantidade de checkboxes (séries válidas). |
  | Repetições | Não | `10-12`, `12`, `30 segundos` | Texto livre mostrado ao aluno. Números (`10-12`, `12`) ganham "repetições" no fim. |
  | Como fazer | Não | `Desça até 90°` | Explicação mostrada no card do exercício. |

- **RN-01.2** A linha de cabeçalho é a primeira (entre as 6 primeiras) que tem as colunas **Treino** e **Exercício**. Linhas totalmente vazias são ignoradas.
- **RN-01.3** O plano tem de **1 a 7 treinos** (um por dia da semana, no máximo).
- **RN-01.4** O mesmo exercício não pode aparecer duas vezes no mesmo treino.
- **RN-01.5** Os treinos ficam na **ordem em que aparecem na planilha** (é a sequência sugerida, RN-03).
- **RN-01.6** O app oferece o botão **"Baixar modelo de planilha"**, que gera um `.xlsx` com o cabeçalho e linhas de exemplo.

## RN-02 — Importação (feita pelo aluno)

- **RN-02.1** O aluno importa o arquivo (`.xlsx`, `.xls` ou `.csv`) no próprio celular.
- **RN-02.2** Antes de gravar, o app **confere a planilha inteira**. Se houver erros, **nada é gravado** e cada erro aparece em português claro com o número da linha da planilha. Exemplos:
  - `Linha 5: falta o nome do treino.`
  - `Linha 5: falta o exercício.`
  - `Linha 5: falta o grupo muscular.`
  - `Linha 5: o número de séries deve ser de 1 a 6.`
  - `Linha 9: "Leg press" aparece duas vezes no Treino A.`
  - `A planilha tem 8 treinos; o máximo é 7.`
  - `Não encontrei as colunas Treino e Exercício.`
  - `A planilha não tem nenhum exercício.`
- **RN-02.3** Sem erros, o app mostra um resumo antes de gravar — ex.: **"3 treinos · 18 exercícios · 3 dias por semana"** — e só grava ao tocar em **"Usar este treino"**.
- **RN-02.4** **Trocar de ficha:** importar uma planilha nova substitui o plano. O **histórico** (execuções e anotações) é **mantido** — ele é o histórico do aluno para o professor. Treinos em andamento (rascunhos) do plano antigo são descartados.
- **RN-02.5** Sem plano importado, a aba Treinar mostra só a tela **"Importe seu treino"** (com o botão de importar). Não existe plano fixo de exemplo.

## RN-03 — Dias por semana e sequência

- **RN-03.1** **Dias por semana = número de treinos da planilha.** 3 treinos (A, B, C) = 3 dias. O aluno não configura meta; o app se adapta à planilha.
- **RN-03.2** Ao abrir a aba Treinar, o app já deixa **selecionado o treino sugerido**:
  1. o treino que estiver **em andamento** (com rascunho);
  2. senão, o **próximo da sequência** depois do último treino salvo (fez A → sugere B; depois do último, volta ao primeiro). Vale mesmo que o aluno tenha faltado dias: a sequência não depende do dia da semana;
  3. senão (nenhum treino salvo ainda), o **primeiro** treino da planilha.
- **RN-03.3** O treino sugerido aparece marcado como **"Próximo"**. O aluno pode tocar em outro treino se quiser.
- **RN-03.4** Se o último treino salvo não existe mais no plano (ficha trocada), a sugestão volta ao primeiro treino.

## RN-04 — Registro do treino (aba Treinar)

- **RN-04.1** O aluno **não anota peso nem repetições**. Cada exercício mostra **um checkbox por série** (o número vem da coluna Séries).
- **RN-04.2** O card do exercício mostra: nome, grupo muscular, "N séries · repetições", a explicação (Como fazer) e o vídeo.
- **RN-04.3** Tocar no checkbox marca a série; tocar de novo desmarca. O app mostra "X de N séries feitas".
- **RN-04.4** Com todas as séries marcadas, aparece **"Exercício concluído"** e o botão **Próximo** fica verde e em destaque.
- **RN-04.5** O aluno **pode avançar com séries faltando**: o app guarda o que ele fez (ex.: 2 de 3).
- **RN-04.6** **Pular** marca o exercício como pulado e avança. Exercício pulado não gera execução, **exceto se tiver anotação** (RN-05.2): aí é gravado com 0 séries feitas.
- **RN-04.7** No último exercício, **Próximo** vira **Ver Resumo**. A revisão lista cada exercício ("3 de 3 séries", "Pulado", "Nenhuma série marcada") e permite voltar para corrigir.
- **RN-04.8** Salvar o mesmo treino na mesma data pede confirmação e **substitui** o registro daquele dia (não duplica).
- **RN-04.9** É preciso ao menos 1 série marcada **ou** 1 anotação para salvar.
- **RN-04.10** O treino em andamento fica guardado (rascunho) a cada toque e volta ao reabrir o app. O rascunho some ao salvar.
- **RN-04.11** Ao trocar de aba com treino não salvo, o app pede confirmação.
- **RN-04.12** **Lista do treino do dia.** Ao abrir um treino, o app mostra primeiro a lista com **todos os exercícios**, em ordem, e o estado de cada um: **✓** concluído, **"2/3"** parcial, **"Pulado"**. Cada item é um botão grande (≥56px) que abre aquele exercício. Embaixo, o botão grande **Começar** (nada marcado) ou **Continuar** (treino em andamento: volta ao exercício onde o aluno parou).
- **RN-04.13** **Barra de progresso do treino** no topo da lista e do exercício: **"X de N exercícios"**. Conta como feito o exercício com todas as séries marcadas ou pulado.
- **RN-04.14** **Avança sozinho:** ao marcar a última série que faltava de um exercício, o app vai para o próximo e mostra **"✓ Leg press concluído"** com o botão **Voltar para Leg press**. No último exercício não avança (o botão Ver Resumo fica em destaque).
- **RN-04.15** No exercício, os pontinhos de navegação foram trocados pelo botão **Ver lista do treino** (≥48px), que volta para a lista (RN-04.12).

## RN-05 — Anotações do aluno

- **RN-05.1** Cada exercício tem um campo **"Como você estava neste exercício?"** (opcional).
- **RN-05.2** A anotação é **gravada junto com a execução do exercício**, mesmo que nenhuma série tenha sido marcada ou que o exercício tenha sido pulado (ex.: "senti dor no ombro, parei"). Nesse caso a execução tem 0 séries feitas e **não conta** como treino feito.
- **RN-05.3** Ao abrir um exercício, o app mostra **"Sua anotação da última vez: …"** com a anotação mais recente daquele exercício, se houver.
- **RN-05.4** Anotações e séries marcadas servem para o **professor avaliar a disposição do aluno** (ver backlog: escala de disposição).

## RN-06 — Semana, sequência e séries por grupo (abas Semana e Evolução)

- **RN-06.1** Semana = **segunda a domingo**.
- **RN-06.2** **Semana completa** = treinos feitos na semana ≥ dias por semana do plano (RN-03.1). Sem plano, vale 3.
- **RN-06.3** **Sequência** = semanas completas seguidas. A semana atual, ainda em andamento, não quebra a sequência; quando completa, já soma.
- **RN-06.4** **Folga:** a primeira semana incompleta de cada mês (mês da segunda-feira) não quebra a sequência, mas também não soma.
- **RN-06.5** **Recorde** = maior sequência já feita. **Semanas completas** = total histórico; nunca diminui.
- **RN-06.6** **Séries por grupo muscular** = soma das séries marcadas por grupo, na semana, no mês ou no ano. Grupos do plano sem nenhuma série aparecem com 0 (mostram o que ficou de fora).
- **RN-06.7** Aba **Semana**: treinos da semana contra os dias do plano ("2 de 3 treinos", "Falta 1 treino para fechar a semana", "Semana completa!"), a sequência ("🔥 4 semanas seguidas") e as séries por grupo. Navega para semanas anteriores.
- **RN-06.8** Aba **Evolução**: sequência atual, recorde, semanas completas, calendário das últimas 12 semanas (completa, folga, incompleta, em andamento) e séries por grupo por mês e por ano.
- **RN-06.9** **Gráfico de treinos por semana** (aba Evolução): barras com os treinos de cada uma das **últimas 12 semanas** (a atual é a última; semanas sem treino aparecem com 0) e uma **linha tracejada na meta** (dias por semana do plano, RN-03.1).
- **RN-06.10** **Gráfico de séries por semana** (aba Evolução): área com as séries marcadas em cada uma das últimas 12 semanas, e a frase de comparação com o mês passado. A comparação é justa: **mês atual até hoje** contra o **mês passado até o mesmo dia**.
  - mais: `Você fez 18% mais séries que no mesmo período do mês passado.`
  - menos: `Você fez 12% menos séries que no mesmo período do mês passado.`
  - igual: `Você fez o mesmo número de séries que no mesmo período do mês passado.`
  - mês passado sem séries no período: sem frase. A porcentagem é arredondada para inteiro.
- **RN-06.11** **Anel de progresso** no topo da aba Semana: "2 de 3 treinos" num anel que enche conforme os treinos da semana (fica cheio e verde ao completar; não passa de cheio). Substitui a barra segmentada.
- **RN-06.12** Todo gráfico tem os mesmos dados em texto para leitor de tela (tabela escondida), com título e semana a semana.

## RN-07 — Vídeos

- **RN-07.1** O vídeo de cada exercício vem do cadastro de vídeos do app (`src/data/exerciseVideos.ts` e apelidos em `exerciseAliases.ts`), pelo **nome do exercício**. A planilha **não** tem coluna de vídeo.
- **RN-07.2** Ao incluir um exercício novo nas fichas, o professor cadastra o vídeo dele no app.
- **RN-07.3** Exercício sem vídeo cadastrado mostra o botão "Ver demonstração" (GIF, quando disponível).

## RN-08 — Armazenamento, histórico e backup

- **RN-08.1** Tudo fica no **localStorage do celular do aluno**, separado por conta (`gw:{id do usuário}:{chave}`).

  | Chave | Conteúdo |
  |---|---|
  | `plano` | Plano importado (treinos e exercícios). |
  | `execucoes` | Histórico: uma execução por exercício por treino salvo (séries planejadas, séries feitas, anotação, grupo, treino, data). Nunca é apagado ao trocar de ficha. |
  | `rascunho_treino` | Treinos em andamento. |

- **RN-08.2** **Backup** (aba Perfil): exporta um `.json` com o plano e o histórico (`performfit_backup_AAAA-MM-DD.json`). Importar um backup **mescla** o histórico (o mesmo exercício no mesmo treino e data não entra duas vezes) e restaura o plano.
- **RN-08.3** O backup antigo (v1, com meta semanal e sem plano) continua sendo aceito; a meta é ignorada.

## RN-09 — Acessibilidade (público de mais idade)

- **RN-09.1** Botões e alvos de toque com **pelo menos 48px**; botões principais com 56px.
- **RN-09.2** Textos principais com **16px ou mais**.
- **RN-09.3** Vídeo com miniatura na largura do card e botão "Fechar" escrito no modal.
- **RN-09.4** A tela do app é **fixa e centralizada**, na largura do celular: nunca rola nem "escorrega" para os lados. Só o conteúdo de cada aba rola, e só na vertical.
- **RN-09.5** **Contraste para tela ao ar livre:** textos, ícones e bordas de controles em cinza usam **#6b7280 ou mais escuro**. O cinza claro `#9ca3af` não é usado; `#d1d5db` só em bordas e fundos, nunca em texto (nem em botão desativado ou placeholder).

## RN-10 — Celebrar as conquistas

- **RN-10.1** **Ícones, não emojis.** As telas de celebração usam ícones do app (lucide-react), com cor e tamanho do padrão do celular. Nada de emoji ou caractere especial como ícone (✓, ✅, 🔥).
- **RN-10.2** **Marcar série:** vibração curta (**30 ms**) e o check aparece com uma animação rápida (ícone de check). Desmarcar não vibra.
- **RN-10.3** **Concluir exercício** (todas as séries marcadas): confete pequeno e vibração dupla (`[40, 60, 40]`).
- **RN-10.4** **Salvar treino:** confete. Se esse treino **fechou a semana** (antes faltava, agora atingiu os dias do plano), confete grande.
- **RN-10.5** Vibração e confete são extras: aparelho sem vibração (iPhone) não quebra nada, e quem pediu **menos movimento** no celular (`prefers-reduced-motion`) não vê confete.
- **RN-10.6** **Frase motivacional** ao salvar, abaixo de "Treino salvo!", escolhida pelo contexto (a primeira que valer):
  1. fechou a semana, sequência > 1: `Mais uma semana fechada! 4 semanas seguidas.`
  2. fechou a semana, sequência = 1: `Semana fechada! Sua sequência começou.`
  3. primeiro treino: `Primeiro treino feito! O começo é o passo mais importante.`
  4. senão: `Falta 1 treino para fechar a semana.` / `Faltam 2 treinos para fechar a semana.`
- **RN-10.7** **Conquistas**, contadas sobre as execuções guardadas (treino = sessão + data com série marcada):

  | Conquista | Regra |
  |---|---|
  | Primeiro treino | 1 treino |
  | 10 treinos | 10 treinos |
  | 4 semanas seguidas | recorde de sequência ≥ 4 (RN-06.5) — uma vez ganha, não se perde |
  | 100 séries | 100 séries marcadas no total |

  Ao salvar, cada conquista **nova** aparece como `Nova conquista: 10 treinos`. A aba **Perfil** mostra todas: as ganhas em destaque e as que faltam apagadas, com quanto falta (`7 de 10 treinos`).
- **RN-10.8** **Faixa "Esta semana"** no topo da aba Treinar: os 7 dias (Seg a Dom), com ícone de check nos dias em que treinou e círculo vazio nos outros; hoje fica destacado. Leitor de tela: `Segunda: treinou` / `Quarta: não treinou`.

## RN-11 — Data do treino

- **RN-11.1** A data é escolhida por botões grandes (≥48px): **Hoje** (padrão), **Ontem** e **Outro dia**. O aluno não digita a data.
- **RN-11.2** **Outro dia** abre o seletor de data do próprio celular (`input type="date"`), que não deixa escolher depois de hoje.
- **RN-11.3** A data escolhida aparece por extenso acima dos botões: `Quarta-feira, 04/11/2026`.
- **RN-11.4** Data vazia, inválida (ex.: 31/02) ou no futuro **não é trocada por hoje em silêncio**: o app avisa (`Escolha o dia do treino.` / `A data do treino não pode ser no futuro.`) e **não salva** até o aluno corrigir.

## RN-12 — Instalar no celular (PWA)

- **RN-12.1** O app tem **manifesto** (nome "PerformFit", abre em tela cheia `standalone`, retrato, cor do tema `#2563eb`, ícones 192 e 512 px, um deles *maskable* para Android) e **service worker** que guarda o app no celular: depois da primeira visita ele abre mais rápido e funciona **sem internet** (os dados já ficam no aparelho, RN-08.1). Vídeos e GIFs continuam precisando de internet.
- **RN-12.2** O service worker se **atualiza sozinho** quando sai uma versão nova (não fica preso numa versão velha).
- **RN-12.3** Na aba **Perfil**, cartão **Instalar no celular**:
  - Android/Chrome: botão **Instalar o app**, que abre o pedido de instalação do celular. Aceitou → `App instalado! Procure o PerformFit na tela inicial.`
  - iPhone (Safari não tem botão): instrução `Toque em Compartilhar e depois em "Adicionar à Tela de Início".`
  - Já aberto como app instalado: o cartão não aparece.
  - Outros navegadores sem suporte: o cartão não aparece.
- **RN-12.4** A instalação só funciona em **HTTPS de verdade** (produção) ou `localhost`. O certificado de teste da rede local não basta para o service worker.

---

## Backlog (combinado, ainda não implementado)

- **Escala de disposição 0–10** ao final do treino ("Como você estava hoje?"), gravada junto com o treino, para o professor avaliar.
- **Nuvem / painel do professor** para acompanhar os alunos sem precisar do backup do celular.
- Remover do projeto as telas antigas do GymWave que ficaram sem uso (Exportar/Importar em kg e `/admin`).
