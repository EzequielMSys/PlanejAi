# Identidade e composição das telas — 25/10/2026

## Etapa 33

Nova direção “uma ideia abre outra”, com símbolo vetorial próprio baseado no P aberto e em um ponto separado. Nome, símbolo, favicon, ícone de instalação, metadados e assinatura das áreas passam a compartilhar a mesma construção. Menu lateral, autenticação e página inicial usam a composição de nome comum.

O guia em `docs/identidade/GUIA.md` registra uso, cores, tipografia e composição, com três estudos vetoriais comparáveis e a direção aplicada. Sem imagem rasterizada para a logo, fonte remota, biblioteca nova ou serviço de terceiros. A Lumi mantém o retrato original transparente.

O manifesto usa início e escopo relativos para funcionar tanto na raiz do Vercel quanto no subdiretório do GitHub Pages. Ícones comuns e maskable têm arquivos separados; a versão do cache do service worker foi incrementada para atualizar os arquivos de identidade que mantêm o mesmo endereço.

## Etapa 34

Composições específicas para página inicial, Hoje, sala de estudo, Aprendizagem, Redações e Lumi. Cores continuam seguindo as preferências da conta/navegador. Cabeçalhos, margens, superfícies e hierarquia visual diferenciam as áreas; a navegação compartilhada leva a marca às demais telas.

- Hoje apresenta a ação principal antes do lembrete complementar, mantendo os mesmos handlers e dados.
- Material, editor de anotações, autoavaliação, histórico de redações e conversas continuam nos componentes existentes.
- Nenhuma alteração de regra de estudo, permissão, gravação, IA, banco ou API.
- Foram corrigidos cortes com fonte a 200%: links da página inicial, grade da capa, navegação pública, meta semanal, abas de aprendizagem, sugestões e controles da Lumi. A assinatura de área fica compacta em celulares.
- O seletor de cores recebe um nome acessível explícito também quando o texto visual está oculto no celular.

## Verificação

Revisão no navegador integrado do Codex usando fixtures locais, sem escrita em contas reais: desktop e largura de 390px, claro/escuro, fonte de 200% por CSS, leitura das árvores de acessibilidade, abertura de menu por teclado/Escape e seleção de paleta alternativa. Inspeção de limites confirmou ausência de cortes nos controles corrigidos. As capturas são prévias com dados fictícios.

**369 testes aprovados** na suíte completa. A regressão cobre autenticação, navegação, preferências, contraste dos tokens, menu móvel, editor, retomada, notas, redações, cronograma e busca. Inclui axe das principais rotas; JSDOM não mede contraste. Lint sem erros e build de produção concluído antes do envio. Arquivos temporários da prévia foram removidos.

Não houve ensaio manual com leitor de tela, aparelho físico, zoom nativo, teste no Brave ou benchmark de desempenho real. O inventário de automação desta sessão disponibilizou o navegador integrado. Não se trata de certificação integral de acessibilidade. As mecânicas de explicar, acompanhar dúvidas e conectar assuntos continuam nas próximas etapas; não foram simuladas como funções prontas nesta entrega.
