# Redesign para estudantes e Lumi — 22/10/2026

## Entrega

A identidade compartilhada cobre as páginas públicas, a rotina do estudante e as áreas de docente, administração e proprietário. A navegação foi agrupada por intenção: rotina, aprendizagem, turma e gestão, respeitando as permissões de cada perfil. A barra superior identifica a página e oferece busca com Ctrl+K e acionamento no celular.

A página inicial pública foi refeita. As páginas internas receberam cabeçalhos, superfícies, formulários, tabelas e hierarquia de leitura consistentes. Cores fixas de marca foram substituídas por tokens que acompanham a personalização. Estados vazios e mensagens de erro continuam conectados aos serviços existentes.

Em **Meu espaço** (`/preferencias`), o usuário escolhe modo claro/escuro, paletas ou uma cor HEX livre, tamanho e espaçamento do texto, fonte, largura de leitura, tom de papel, contraste e redução de movimentos. Existe uma amostra de leitura e opção de restaurar os padrões. As escolhas são guardadas neste navegador; não há sincronização entre dispositivos. Documentos externos em iframe/PDF mantêm as características do visualizador externo.

A **Lumi** tem uma área própria (`/lumi`), orientação de estudo, sugestões que preenchem a pergunta sem enviá-la automaticamente, histórico, escolha de disciplina e apresentação legível das respostas. O atalho `/chat` redireciona para ela. Erros do provedor aparecem na interface e preservam a pergunta para nova tentativa. O conteúdo recebido é renderizado como texto seguro, sem executar HTML.

Também foi corrigido o painel do proprietário, que interpretava uma resposta paginada como lista. Os indicadores agora usam os totais agregados do banco.

## Carregamento

As folhas de estilo globais sobrepostas deixaram de carregar na entrada. Estilos específicos ficam com a área autenticada; páginas e ferramentas secundárias usam carregamento sob demanda.

O build final referencia três arquivos iniciais JS/CSS, somando **379.066 bytes brutos / 114.949 bytes gzip**. A medição anterior ao conjunto de melhorias era 176.697 bytes gzip (redução aproximada de 35%). Essa comparação mede transferência potencial dos arquivos iniciais, não tempo de carregamento nem nota Lighthouse. O servidor de produção precisa habilitar compressão para obter esse tamanho transferido.

## Verificação

- `node --test test/*.test.js`: 191 testes aprovados.
- ESLint do frontend: aprovado sem avisos.
- Vite build: aprovado.
- Frontend local e `/api/health`: HTTP 200.
- Testes de interface montam os componentes reais com React/JSDOM e serviços simulados. Percorrem páginas públicas e protegidas dos quatro perfis, personalização, navegação, restrições de acesso, envio à Lumi, formatação segura e recuperação de falha do provedor.

Os testes não enviam perguntas a um provedor real nem alteram contas ou dados reais. O funcionamento de respostas reais da Lumi depende de uma chave válida configurada somente no backend. Uma chave exposta na conversa não deve ser reutilizada.

A inspeção visual foi concluída em navegador com uma prévia local isolada, usando os componentes reais e serviços simulados, sem alterar contas e dados reais. Não foi feita publicação, migração de banco ou commit.

## Fechamento das correções pendentes

Foi incluída uma saída sempre acessível do modo foco, inclusive no celular. O menu móvel agora mantém o foco do teclado dentro da navegação, bloqueia a interação e rolagem do conteúdo ao fundo, fecha com Escape e devolve o foco ao botão de abertura. Ao ampliar a janela, o menu móvel é encerrado. A busca tem um botão que direciona o foco ao campo. Três testes de interface cobrem esses comportamentos.

A captura enviada pelo usuário confirmou inicialmente a página pública. Em seguida, uma nova aba permitiu concluir a revisão das páginas internas na prévia isolada.


## Conferência visual concluída

Foram realizadas 64 verificações de renderização nas páginas públicas, de estudante, docente, administração e proprietário, principalmente em 1440×900 e 390×844. As rotas cobertas estão em `test/studentFlows.test.js`; os aliases são cobertos pelos testes de navegação. Também foram inspecionados o menu móvel, tema claro/escuro, cor HEX livre (#52796F), tablet em 768×1024, sessão de estudo ativa com material fictício e resposta simulada da Lumi. Os serviços dessa prévia foram interceptados antes da montagem da aplicação; nenhuma pergunta foi enviada à Groq.

A conferência adicional em 320×740 e fonte a 140% encontrou um extravasamento no planejamento inteligente. Após corrigir a largura mínima do campo e a coluna de grade, a página voltou a caber sem rolagem horizontal. As demais telas avaliadas nessa condição não apresentaram extravasamento global. Tabelas e áreas de conversa podem manter sua própria rolagem.

Correções da revisão:

- Cabeçalhos antigos de cronograma não sobrescrevem a nova identidade.
- Botões principais e filtros ativos têm contraste adequado com seu fundo.
- Cabeçalhos com título diretamente no contêiner mantêm a ordem vertical.
- A tela vazia de atividades tem espaçamento e hierarquia próprios.
- O componente de revisão colaborativa recebeu estilos completos, incluindo formulário e leiaute móvel.
- A conversa vazia da Lumi começa pelo topo da apresentação.
- A paleta publica aliases CSS em camelCase e kebab-case, incluindo RGB. Isso corrige fundos, bordas e textos que antes permaneciam na cor padrão.
- Barra superior, menu e ferramentas flutuantes acomodam texto ampliado em telas estreitas.

As capturas de evidência ficam na pasta de visualizações desta conversa (`planejai-lumi-desktop.png`, `planejai-lumi-mobile.png`, `planejai-preferencias-desktop.png`). O servidor e os arquivos temporários da prévia isolada foram removidos; o ambiente principal permanece em execução.

A revisão cobre os estados visitados com dados fictícios e não implica teste visual de cada combinação possível de conteúdo ou de todos os dispositivos físicos. Respostas reais da IA continuam dependendo da configuração válida do provedor no backend.
