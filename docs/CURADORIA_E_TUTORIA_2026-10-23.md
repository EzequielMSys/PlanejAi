# Etapas 8 e 9 — materiais e tutoria

## Entrega

- `/fontes-estudo`: 21 fontes, filtros por finalidade, busca e acesso aberto/gratuito. Acesso pela central de aprendizagem, pelos guias e pela busca de páginas; mantém o menu principal enxuto.
- As fontes são links para seus autores. Não há scraping, importação de questões de terceiros, novas bibliotecas, rastreadores ou chamadas externas ao carregar o catálogo.
- Provas oficiais do Inep e FGV identificadas; cursos pagos, acesso básico, cadastros e recursos internacionais têm rótulos próprios. Os planos podem mudar.
- Guias autorais específicos adicionados para equações do primeiro grau e leis de Newton. Corrigidas a direção das setas em cadeias alimentares e a ambiguidade entre distância e deslocamento na pergunta de cinemática.
- Temas sem aula própria mostram explicitamente que o guia e o teste são de método de estudo. O teste rápido é formativo; não comprova domínio do assunto nem gera nota oficial.
- Sites de leitura abrem em outra aba; somente vídeos de provedores reconhecidos são incorporados. Evita telas vazias quando o site original bloqueia iframe.
- A alternativa escolhida pode ser levada à Lumi sem envio automático nem gabarito oculto. O estudante pede pista ou feedback, pode editar a tentativa e solicita a resolução em uma ação separada. Falhas preservam o texto e não liberam a resolução.
- Backend normaliza modo, questão, tentativa e nível de pista. Somente instruções definidas no servidor controlam o modo; os textos recebidos são dados não confiáveis. O comportamento do modelo é probabilístico e o feedback continua identificado como IA.

## Conferência das referências

Consulta pública em 23/10/2026. Conferir uma página não garante todo o serviço ou conteúdo atrás do login.

Incluídos: Brasil Escola, Curso Enem Gratuito, Estuda.com, Aprova Total, Descomplica, Stoodi, ProEnem, Guia do Estudante, Corrige Aqui, RevisãoOnline, coRedação, Wikilivros, Unesp, SimpleStudy, Khan Academy, College Board, ACT, Princeton Review e Kaplan. Foram adicionados links diretos às provas oficiais do Inep e da FGV.

O SimpleStudy consultado apresenta currículos internacionais, sem cobertura do Enem confirmada; por isso foi classificado como internacional, não como “SimpleStudy Brasil”.

Referências que ficaram fora do catálogo principal:

| Referência enviada | Resultado da consulta |
| --- | --- |
| Vestibulandia | Tempo de resposta esgotado; disponibilidade não confirmada. |
| Glau | Página não acessível pela ferramenta de consulta; não classificada como inativa. |
| Folha de Redação | A URL enviada abre o portal de notícias. Não foi confirmada uma ferramenta gratuita de correção nesse endereço. |
| MEC Enem e Sala do Futuro | Aplicações sem conteúdo público legível na consulta; elegibilidade, login e recursos não foram testados. |
| Enem Paraná | O endereço enviado redireciona para a raiz, sem conteúdo público legível na consulta. |
| YouTube Edu | O endereço consultado não apresentou um catálogo educacional verificável. Vídeos individuais continuam aceitos nos materiais. |

Fontes de conteúdo consultadas:

- https://brasilescola.uol.com.br/biologia/cadeia-alimentar.htm
- https://brasilescola.uol.com.br/fisica/leis-newton.htm
- https://vestibular.fgv.br/provas-gabaritos
- https://www.gov.br/inep/pt-br/areas-de-atuacao/avaliacao-e-exames-educacionais/enem/provas-e-gabaritos
- https://satsuite.collegeboard.org/help-center/can-students-still-practice-using-khan-academy

## Limite da revisão

O banco atual tem 270 questões autorais. A verificação automática cobre estrutura, alternativas únicas, índice de resposta, explicação presente e distribuição. Isso não substitui uma revisão pedagógica humana de cada item. Não foi importado nem alterado o banco online; as mudanças de guias, catálogo e tutoria funcionam na mesma versão local e publicada.

## Validação

Testes de interface cobrem filtros, caminho a partir da aprendizagem, transferência da alternativa, pedido explícito de resolução e recuperação de falha. Testes do servidor cobrem normalização e instruções de pista/feedback. Verificação visual usa conta e respostas simuladas, sem dados de estudantes reais.

Um teste adicional com o provedor de IA configurado recebeu uma equação e uma tentativa com erro de subtração: o modo pista não entregou o valor final; o feedback localizou o erro e pediu outra tentativa. Isso é uma amostra de comportamento, não uma garantia de todas as respostas futuras.
