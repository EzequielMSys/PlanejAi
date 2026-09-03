# Roadmap PlanejAI

Este roteiro organiza a evolução do produto sem interromper os fluxos que já funcionam. Cada fase possui uma entrega utilizável e critérios claros de conclusão.

## Fase 0 — Estabilidade e identidade (em andamento)

Objetivo: deixar uma única base confiável para as próximas telas.

- Consolidar cores, tipografia, espaçamento, superfícies e temas claro/escuro.
- Substituir estilos globais concorrentes por componentes reutilizáveis.
- Padronizar cabeçalhos, cartões, botões, campos, vazios e carregamentos.
- Manter largura útil confortável em notebook, monitor amplo e celular.
- Tratar inicialização duplicada do backend sem `EADDRINUSE` não controlado.

Critérios de conclusão:

- Nenhuma página depende de correções de contraste específicas para funcionar.
- Todos os fluxos principais passam em claro e escuro.
- Lint, testes e build executam sem erro.

## Fase 1 — Modo Prova Real

Objetivo: transformar simulados em uma área própria do produto.

- Rota `/provas` com catálogo por instituição, ano e dificuldade.
- Provas autorais separadas de provas oficiais, com origem identificada.
- Configuração de quantidade, nível, disciplinas e tempo.
- Salvamento automático e retomada de tentativa.
- Cronômetro, marcação para revisão e navegação por questão.
- Resultado por disciplina, habilidade e dificuldade.
- Histórico comparável entre tentativas.

Dados/API:

- Versionar prova, questões sorteadas e ordem das alternativas.
- Registrar respostas progressivamente, tempo gasto e conclusão.
- Preservar o conteúdo da tentativa mesmo quando o catálogo for atualizado.

## Fase 2 — Atividades 2.0

Objetivo: oferecer ao docente um editor comparável a formulários educacionais.

- Banco reutilizável de questões e duplicação de atividades.
- Múltipla escolha, checklist, discursiva, associação, ordenação e arquivo.
- Rubricas, pesos e correção híbrida: automática com revisão humana.
- Rascunho, publicação agendada, prazo por turma e reabertura individual.
- Autosave das respostas e histórico de versões.

## Fase 3 — Evidências de aprendizagem

Objetivo: orientar decisões com dados reais, não apenas presença no site.

- Mapa de domínio por disciplina e habilidade.
- Sessões reais de foco, tentativas, revisões e evolução por período.
- Alertas pedagógicos explicáveis para docentes.
- Plano de recuperação e recomendações vinculadas às evidências.
- Exportação de relatórios em PDF e CSV.

## Fase 4 — Comunicação escolar

Objetivo: centralizar a comunicação sem virar uma rede social aberta.

- Avisos por turma, cargo ou usuário, com confirmação de leitura.
- Comentários contextuais em atividades e entregas.
- Caixa de entrada e notificações configuráveis.
- Moderação, anexos protegidos e histórico de edição.

## Fase 5 — Segurança, operação e escala

Objetivo: preparar uso por várias escolas e computadores.

- Permissões granulares e isolamento por organização/turma.
- Auditoria de criação, alteração, correção e acesso a arquivos.
- Uploads privados, validação de conteúdo e links temporários.
- Filas para tarefas de IA, repetição segura e fallback de provedor.
- Backups restauráveis, métricas, alertas e política de retenção.

## Ordem de execução

1. Finalizar Fase 0 e migrar as telas gradualmente para o kit visual.
2. Entregar `/provas` como produto independente e evoluir a persistência.
3. Reaproveitar o mesmo motor de questões nas Atividades 2.0.
4. Alimentar os painéis com eventos produzidos por provas e atividades.
5. Adicionar comunicação e recursos de escala sobre permissões já consolidadas.

