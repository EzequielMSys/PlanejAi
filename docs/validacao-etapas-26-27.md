# Falhas dos fluxos e recuperação de textos — 24/10/2026

## Etapa 26

Painel exclusivo do dono com contagens das últimas 24 horas para cadastro, login, planejamento, Lumi e textos. Separa respostas confirmadas, falhas do servidor, limites e outras recusas; não apresenta senha incorreta como erro interno. Inclui dez ocorrências recentes com referência para correlação nos logs.

A auditoria existente agora inclui falhas 5xx de leitura, além das escritas. Reutiliza as tabelas e o endpoint protegido: nenhuma migração, biblioteca ou serviço de rastreamento novo. Os novos eventos técnicos não incluem redações, anotações, conversas, senhas ou query strings; as rotas não carregam IDs dinâmicos. A auditoria existente continua vinculada à conta por ID e registra o hash do IP, com consulta restrita ao dono. Normaliza rotas pelo padrão registrado no Express e valida a referência de requisição. Logs de autenticação e do tratador geral deixam de imprimir o objeto de erro completo. Isso não é uma revisão de todos os logs históricos ou de todos os módulos legados.

Consultas de agregação validadas no banco online em modo somente leitura. O monitor externo continua cobrindo disponibilidade. Se uma requisição não chegar ao servidor, não aparecerá na auditoria; se o próprio banco falhar, use os logs do Vercel e o histórico externo. Não há taxa de conversão de visitantes, rastreamento individual novo ou envio próprio de notificações.

## Etapa 27

- **Anotações:** preserva cópia local confirmada depois do salvamento. Uma reabertura sem acesso à conta pode recuperar essa cópia, com aviso de conexão não confirmada. Rascunhos pendentes continuam tendo prioridade e exigem reenvio explícito na recuperação.
- **Consulta indisponível sem cópia:** o editor aguarda a recuperação em vez de mostrar uma nota aparentemente vazia e permitir sobrescrever o texto existente. Oferece nova consulta; concluir a sessão também aguarda o carregamento.
- **Planejamento inicial:** rascunho das matérias, horários e etapa, separado por conta. Na reabertura, oferece recuperar sem substituir automaticamente a configuração do servidor. O rascunho é removido após confirmação final na conta. Não armazena senhas ou formulários de credenciais.
- **Armazenamento indisponível:** anotações e redações oferecem baixar uma cópia de texto. Rascunhos sem cópia recuperável ativam aviso ao tentar fechar a página. O aviso depende do navegador; não garante impedir encerramento do aplicativo ou perda do aparelho.
- Redações mantêm a recuperação, fila e proteção contra confirmações atrasadas já existentes. Salvamento local permanece identificado como local, sem prometer disponibilidade em outro aparelho.

## Verificações

Testes de privacidade de eventos e normalização de rotas; recuperação de anotação confirmada sem servidor; bloqueio de editor sem consulta; rascunho de planejamento após remontar, isolamento entre contas, limpeza após confirmação e aviso quando o armazenamento falha. Regressões de redações e anotações, lint e build de produção também verificados.

Prévia com dados fictícios em desktop e largura de celular de 390px: painel do dono, falha de carregamento das anotações, editor desabilitado e recuperação após nova consulta. Sem rolagem horizontal nas telas verificadas. Não houve teste em aparelho físico nem uso de textos reais de estudantes.

A coleta de opiniões da etapa 22 permanece com o responsável. Não foram alteradas a navegação principal ou as regras pedagógicas para realizar estes ajustes.
