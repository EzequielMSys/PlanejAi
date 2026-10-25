# Busca unificada — 25/10/2026

## Entrega

Nova rota autenticada `/busca`, acessível pela barra superior ou Ctrl+K. A barra mantém os atalhos de páginas e passa a oferecer pesquisa no acervo. A tela reúne matérias, materiais, anotações de estudo e redações, com filtros, trechos de contexto, paginação, estado vazio, validação e recuperação de erros.

- A pesquisa acontece ao enviar o formulário ou trocar o filtro/página, sem requisição a cada tecla.
- Cada tipo retorna até 12 itens por página. A consulta busca um item extra para indicar continuação, sem contar ou enviar o acervo inteiro. Na visão geral, o usuário pode filtrar um tipo para continuar a navegação.
- Consultas aceitam de 2 a 100 caracteres. Termos são vinculados como parâmetros SQL; `%`, `_` e o caractere de escape são tratados literalmente. Filtros e páginas são validados, com limite de 100 páginas por tipo.
- Resultados anteriores saem da tela ao consultar outro termo; requisições pendentes são canceladas. Respostas de uma conta anterior são ignoradas.
- Nenhum histórico de pesquisa é criado no banco. A URL permite navegação voltar/avançar. Respostas usam `private, no-store` e o cliente desativa seu cache offline para esta API.

## Acesso e destinos

- O usuário é obtido exclusivamente pelo middleware de autenticação. IDs enviados na consulta não definem o proprietário da busca.
- Estudantes pesquisam matérias e conteúdos vinculados aos seus cronogramas. Gestão pedagógica pesquisa o catálogo que já pode administrar.
- Anotações e redações são sempre do próprio usuário, inclusive para gestão. A busca pessoal não substitui a tela de gestão de redações de estudantes.
- Abrir um material consulta novamente a autorização no servidor. URLs de arquivos continuam passando pela assinatura e pelas regras de acesso existentes.
- Uma anotação antiga pode ser aberta pelo dono mesmo sem cronograma associado, mas esse caminho retorna somente os metadados do tema. A existência da anotação não libera links nem arquivos do catálogo.
- A anotação abre diretamente no editor existente da sala de estudo, mantendo seu fluxo de salvamento. A redação encontrada abre seu registro expandido no histórico, com foco no título; se tiver sido removida, a tela informa a ausência.
- A busca cobre conteúdo confirmado no banco. Rascunhos e anotações que existem apenas no aparelho não são indexados, conforme explicado na tela.

## Verificação

- **369 testes aprovados** na suíte completa. Incluem validação e escape de termos, limites e paginação, escopos SQL de estudante/gestão, propriedade de notas e redações, autorização ao abrir, autenticação HTTP, cache desativado, erros sem detalhes internos, abertura do editor e da redação, resposta lenta obsoleta, recuperação e busca curta/vazia.
- Teste axe da tela com resultados sem violações nas regras executadas em JSDOM. Esse ambiente não mede contraste.
- Consultas reais de leitura no MySQL online executadas com um identificador sem conta: todos os grupos pessoais vazios e acesso a conteúdo negado. Consulta do catálogo pedagógico também executada, exibindo somente confirmação de funcionamento, sem dados pessoais. Nenhum registro criado ou alterado.
- Revisão visual em desktop e largura de 390px, claro/escuro e fonte de 200% por CSS. Inspeção dos limites dos controles sem corte horizontal nos estados conferidos; abertura de recursos por teclado.
- Prévia e captura usam dados fictícios. Arquivos temporários da prévia foram removidos antes do build.

Não houve migração, dependência adicional, teste de carga ou ensaio manual com leitor de tela/aparelho físico. A consulta usa os vínculos e tabelas existentes; evolução para um índice textual depende de volume e medição, sem promessa numérica de desempenho nesta entrega.
