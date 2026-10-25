# Etapas 50 e 51 — reencontrar registros e enviar feedback

## Busca

- Termos encontrados recebem destaque em título e trecho, incluindo equivalência entre letras com e sem acento. A renderização usa texto e elementos mark, sem interpretar HTML do registro.
- O filtro ativo fica explícito; mudar o tipo mantém a pesquisa confirmada. Materiais encontrados pelo título de um recurso anexado também mostram esse título no trecho, sem devolver URLs privadas.
- Até oito buscas confirmadas ficam neste aparelho, separadas por conta, com expressão e filtro. Texto apenas digitado e consultas que falharam não entram no histórico. Limpar uma conta não apaga as demais. Falha no armazenamento é informada.
- Abrir anotação e Abrir material conferem novamente o acesso antes de navegar para o registro. Redações mantêm a abertura por identificador e foco no registro. Os detalhes das fontes continuam disponíveis. Uma abertura pendente é cancelada se o resultado sair da tela.

## Feedback

- Relatar um problema e Sugerir melhoria ficam no rodapé das páginas autenticadas. O novo fluxo usa a central de atendimento já existente: o estudante acompanha em Meu espaço e o dono responde pela central.
- Página é preenchida com o pathname; parâmetros da busca, tokens e fragmentos não são coletados. Mensagem, informações adicionais opcionais e captura opcional aparecem na revisão antes de qualquer envio.
- O formulário permite voltar e editar ou retirar a captura. A imagem só é enviada ao confirmar; nenhuma captura automática, navegador, histórico ou telemetria adicional é anexada. A identificação da conta é informada na prévia.
- PNG/JPG/WEBP até 700 KB: extensão MIME, base64 e assinatura binária são conferidos no servidor. SVG, formato disfarçado, página externa e parâmetros na página são rejeitados. Mantém-se o limite existente de cinco pedidos por dia.
- Pedido e contexto são gravados na mesma transação. Capturas ficam no banco e não têm URL pública: consulta autenticada limita acesso ao autor do pedido e ao dono responsável pelo atendimento. A listagem devolve somente o indicador de captura; os bytes são carregados sob demanda.
- Migração aditiva feedback_context_v51.sql aplicada no Aiven e no banco da configuração local, com registro do hash. Pedidos existentes e seu enum foram preservados: melhorias usam a categoria legada DUVIDA e o tipo explícito MELHORIA no contexto, apresentado corretamente na central. Novas instalações incluem a migration na ordem de execução.
- Falha no envio mantém mensagem e captura na tela para nova tentativa. O rascunho de feedback não é guardado no armazenamento local; fechar pede confirmação de descarte.

## Verificações

A suíte completa passou com 462 testes. Lint, build de produção e checagens de sintaxe do backend passaram.

- Testes de destaque com acentos e markup literal; histórico limitado e isolado; abertura direta da anotação; prévia sem envio; repetição após erro; captura local removível e acessibilidade do diálogo.
- Testes de servidor cobrem validação dos anexos, limites, transação/rollback, isolamento da consulta da captura e preservação das regras de acesso da busca.
- Chromium com dados fictícios em 390 px e em 320 px/fonte 140%: sem rolagem horizontal nos estados conferidos. A prévia tem rolagem interna e ações acessíveis. Corrigida uma sobreposição do acionador de acessibilidade com os atalhos de feedback no celular.
- Logs locais: backups/stage50-tests-final.log, backups/stage50-build.log e capturas em backups/visual-etapas50-51/. Os pedidos simulados usaram adaptador de teste; não foram enviados relatos fictícios à central de produção.
