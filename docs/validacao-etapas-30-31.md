# Sala de estudo e visão semanal — 24/10/2026

## Etapa 30 — uma mesa de estudo mais clara

- Material e guia ganham prioridade, com leitura na rolagem da página e largura de texto controlada pelas preferências existentes.
- Modo leitura recolhe o apoio lateral. A Lumi abre por um atalho no cabeçalho, pelo painel ou a partir de uma questão. O atalho também posiciona o foco no painel para continuar pelo teclado.
- A conversa é carregada apenas no primeiro uso. Recolher o painel ou entrar no modo leitura mantém seu componente montado, preservando a pergunta digitada. Falha no download do módulo mostra um aviso localizado e mantém material e anotações disponíveis.
- Anotações seguem nas ferramentas da sessão, com os avisos de salvamento existentes. Trocar de ferramenta preserva o texto no hook; não altera a política de cópia local, confirmação do servidor ou proteção antes da conclusão.
- Autoavaliação fica ao final do conteúdo; os dois botões de conclusão usam o mesmo fluxo existente. Nenhuma conclusão automática ao entrar em modo leitura ou abrir a Lumi.
- Reduzido espaçamento duplicado do guia e corrigida a largura mínima dos fieldsets das questões, que cortava controles com fonte ampliada.

## Etapa 31 — enxergar a semana

- Alternância entre lista detalhada e semana. A escolha fica no navegador, separada por conta; não é sincronizada entre aparelhos.
- Semana de segunda a domingo, com navegação limitada às datas do plano, retorno à semana atual quando aplicável, tempo total e estados escritos das etapas.
- Dias sem sessão são apresentados como “Sem sessão no plano”, sem inferir que o estudante está livre. Mais de uma etapa no mesmo dia é incluída nos totais.
- Datas de calendário não são deslocadas por fuso horário. Datas inválidas ou ausentes não geram uma sessão fictícia no dia atual.
- “Ver etapa” abre os detalhes existentes e posiciona o foco no título. Etapas bloqueadas continuam fechadas e dependem das mesmas regras de liberação.
- Trocar de semana ou de visualização usa os dados carregados, sem chamadas extras à API. Ajustar a rotina continua exigindo confirmação pelo fluxo “Seu dia mudou?”.
- Grade responde tanto à largura da tela quanto ao espaço disponível junto à navegação lateral.

## Verificação

- Suíte completa: 356 testes aprovados, incluindo preservação de rascunhos ao recolher a Lumi, ausência de envio automático, navegação e bloqueios da semana, foco nos detalhes, isolamento da preferência por conta e aritmética de datas (virada de mês/ano e ano bissexto).
- Verificação axe do painel aberto e da semana em JSDOM sem violações nas regras executadas. Contraste não é medido nesse ambiente.
- ESLint sem erros e build de produção concluído.
- Revisão visual no navegador com dados fictícios: largura de 390px e desktop, tema claro e escuro, fonte de 200% por CSS, abertura da Lumi por teclado e inspeção dos limites dos controles. Sem controles cortados nos estados conferidos após a correção.
- As capturas são prévias com dados fictícios, não registros de contas reais. Arquivos temporários da prévia foram removidos antes do build.

Limites: não houve teste manual com leitor de tela, aparelho físico ou zoom nativo; não é uma certificação completa de acessibilidade. Nenhuma migração ou alteração de dados de produção foi necessária. O acompanhamento de desempenho real continua dependente de amostras de uso; estas mudanças não justificam uma promessa numérica de LCP.
