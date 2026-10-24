# Proteção externa e refinamentos de acesso — 24/10/2026

## Etapa 21

Ativados os secrets do GitHub e executados manualmente os dois novos workflows em `main`:

- [Cópia diária e restauração: execução 40133749782](https://github.com/EzequielMSys/PlanejAi/actions/runs/40133749782): sucesso. Exportação da produção com certificado verificado, restauração em MySQL 8.4 descartável e conferência de contagens: **63 tabelas, 6.129 registros**. Snapshot às 21h20 UTC. Artefato criptografado com retenção até 07/11/2026, 21h20 UTC.
- O artefato foi baixado novamente; SHA-256 e autenticação AES-GCM conferidos localmente. Nenhum registro ou chave foi incluído neste relatório.
- [Disponibilidade: execução 40133752147](https://github.com/EzequielMSys/PlanejAi/actions/runs/40133752147): sucesso, banco conectado. O monitor não altera estado do serviço Aiven.

Rotina diária às 03h17 de Brasília; monitor a cada 30 minutos. Confira limitações de agendamento, notificações, retenção, chave de recuperação e procedimento de incidente em [Operação e recuperação](operacao-e-recuperacao.md). Não há promessa de impedir suspensão do plano gratuito. Não foi contratado plano pago, nem configurado reinício automático.

## Etapa 23: refinamentos verificáveis agora

- Login mantém email e senha somente no estado da tela após uma falha, apresenta aviso persistente e oferece diagnóstico manual com timeout. O diagnóstico não envia credenciais nem faz login automaticamente.
- No celular, o acesso fica concentrado no formulário; painel de apresentação removido dessa tela em larguras pequenas. Email preparado para teclado apropriado; campos com fonte mínima de 16px para evitar zoom automático nos navegadores móveis usuais.
- Painel do dono passa a oferecer consulta sob demanda ao histórico externo de backup e disponibilidade, com indicação de execução recente, falha e desatualização, além dos links diretos. Não adiciona consultas do GitHub ao carregamento dos estudantes.
- Prévia local em 390 × 844: falha 503 simulada, campos preservados, diagnóstico de recuperação e botão Entrar funcionais. Teste de componente confirma que verificar conexão não reenvia a senha. Não houve teste em aparelho físico.

A coleta da **etapa 22 permanece com o responsável**, conforme solicitado. Estes ajustes não são apresentados como resultado de entrevistas ou testes dos estudantes; novas mudanças baseadas nesses resultados ficam para depois da coleta.

## Validação

Testes do backend e fluxos de interface, lint e build de produção executados. Workflows reais de backup/restauração e monitor verificados no GitHub. API pública voltou a responder com banco conectado. Os backups não incluem arquivos do Blob, usuários MySQL, views, eventos ou rotinas. O exercício automático valida estrutura e contagens; um ensaio funcional de recuperação continua sendo responsabilidade operacional periódica.
