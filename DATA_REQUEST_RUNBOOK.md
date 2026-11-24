# Pedidos de acesso e exclusão de dados

## Acesso

O estudante autenticado baixa um JSON em **Ajuda e seus dados**. A exportação inclui registros da conta, perfil, planejamento, produção, conversas, suporte e capturas de suporte em Base64 quando existirem. O download contém informações privadas; não deve ser enviado por email ou anexado ao atendimento.

Antes de declarar a exportação completa, conferir as tabelas adicionadas por novas migrações e os arquivos guardados fora do banco. Fotos, banners e materiais são referenciados por URL nos registros; o JSON não embute todos esses arquivos.

## Exclusão

O formulário cria um pedido confirmado, mas não apaga a conta automaticamente. A equipe deve:

1. Conferir o pedido autenticado e registrar seu recebimento. Oferecer a exportação antes de executar a exclusão.
2. Inventariar registros no banco, arquivos no armazenamento e integrações externas associados à conta. Verificar dependências com turmas, atividades e trabalhos compartilhados antes de apagar.
3. Executar a exclusão por procedimento testado em ambiente isolado; verificar a ausência dos dados na aplicação e no armazenamento. Não marcar o atendimento como resolvido só porque a conta foi desativada.
4. Registrar o horário, responsável, escopo apagado e eventuais retenções obrigatórias ou cópias de segurança ainda existentes. Os artefatos do workflow de backup têm retenção configurada de 14 dias; confirmar também qualquer backup do provedor ou destino adicional.
5. Informar o resultado e os limites ao solicitante por um canal que permaneça acessível após a remoção da conta.

**Atualização em 24/11/2026:** contas de estudante podem usar a exclusão autenticada, com senha, CSRF e frase de confirmação. O teste em esquema MariaDB isolado removeu registros e foto e verificou rollback quando o armazenamento falhou. Contas de gestão permanecem no fluxo assistido por causa de turmas e materiais compartilhados. Ainda é necessário testar o fluxo pela Vercel com uma conta descartável e confirmar cópias adicionais dos provedores de banco e arquivo antes de declarar a etapa concluída.
