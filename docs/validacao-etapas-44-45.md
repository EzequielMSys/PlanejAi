# Etapas 44 e 45 — Validação real da Lumi e auditoria preventiva no celular

Conferência realizada em 25/10/2026. O responsável informou que ainda não recebeu relatos de estudantes. Portanto, as mudanças desta rodada vieram de testes preventivos; não são apresentadas como resultados de entrevistas ou feedback recebido.

## 44 — Respostas reais, trechos fictícios

As consultas foram feitas no endpoint de produção do Vercel, com a configuração real do provedor da Lumi. Foram criadas contas temporárias exclusivamente para a validação, autenticadas pelo fluxo normal e removidas ao terminar cada rodada. Nenhum usuário existente, redação ou dado pessoal de estudante foi alterado. Credenciais e tokens não integram os relatórios.

Critérios da leitura manual: aderência à intenção, intervenção localizada, motivo compreensível, pergunta que preserve a autoria, ausência de evidência fabricada e respeito ao contexto escolhido. Foram feitas três rodadas dos mesmos quatro casos: três intenções e um controle de coesão com apenas um parágrafo. Houve onze consultas reais ao provedor; o último controle foi recusado pela validação antes de gastar a consulta.

### O que os testes encontraram e mudou

- A primeira resposta de argumento sugeriu um percentual sem fonte. As orientações contra fabricação de dados agora valem para todas as intenções. Uma checagem adicional rejeita percentuais novos ausentes do trecho fornecido. Essa checagem é limitada a percentuais, não é um verificador geral de fatos.
- No controle com um só parágrafo, a resposta ainda especulava sobre transições que não podia examinar. A intenção de coesão agora exige dois parágrafos na interface e na API; a validação ocorre antes da reserva de cota e do pedido ao provedor.
- Uma personagem fictícia foi tratada de forma excessivamente próxima de evidência real. O prompt ganhou uma orientação específica para ficção/hipótese e a resposta exibe um aviso de que uma ilustração não comprova fatos ou impactos reais.

### Resultado da rodada final

| Caso | HTTP | Tempo aproximado | Leitura da resposta |
| --- | --- | --- | --- |
| Fortalecer argumento | 200 | 2,1 s | Apontou a justificativa ausente, propôs uma ponte localizada e pediu experiência concreta; sem percentual ou fonte inventada. |
| Ligar dois parágrafos | 200 | 1,7 s | Trabalhou a transição entre o obstáculo apresentado e a alternativa escolar; explicou a sugestão e ofereceu uma pergunta de escolha. |
| Usar repertório ficcional | 200 | 1,3 s | Identificou o papel ilustrativo, distinguiu-o de prova empírica e pediu fonte verificável para alegações reais. |
| Coesão com um parágrafo | 400 | 0,24 s | Pediu o parágrafo vizinho e não consultou a IA. |

Os textos e respostas completos da rodada final estão em [registro de avaliação](./avaliacoes/lumi-intencoes-44.json). A amostra confirma o funcionamento real e orienta a calibração, mas não demonstra que toda resposta futura será correta. A interface continua preservando o original, indicando limites e pedindo conferência de referências.

## 45 — Cobertura das telas e leitura

Foi usada uma página temporária isolada com o **App, rotas, autenticação de teste, layout, componentes e estilos reais**, com adaptadores de API e dados fictícios. Não foi usada a sessão de estudantes para operar formulários. A página temporária foi removida antes do build e do commit.

Foram conferidas 35 rotas em duas condições: **390 × 844 px com texto padrão** e **320 × 720 px com fonte em 140%**. Na varredura final das 70 combinações, não houve erro de renderização capturado pelo limite de erro da aplicação, rolagem horizontal da página ou campo textual visível abaixo de 16 px. Tabelas extensas de gestão continuam tendo rolagem própria; isso não foi tratado como erro da largura da página.

| Grupo | Rotas verificadas |
| --- | --- |
| Entrada e acesso | `/`, `/login`, `/register`, `/esqueci-senha`, `/redefinir-senha`, página inexistente |
| Preparação e rotina | `/primeiro-acesso`, `/onboarding`, `/inicio`, `/mesa`, `/meu-entendimento`, `/busca`, `/cronograma`, `/estudar`, `/status` |
| Estudo e escrita | `/aprendizagem`, `/fontes-estudo`, `/ferramentas-estudo`, `/provas`, `/lumi`, `/preferencias`, `/sessao-guiada`, `/redacoes` |
| Conta e turma | `/perfil`, `/minhas-atividades`, `/avisos`, `/minhas-turmas`, `/minhas-turmas/1`, `/alterar-senha` |
| Gestão | `/dashboard-gestor`, `/turmas`, `/atividades`, `/materiais`, `/usuarios`, `/dono` |

### Correções verificadas

- Campos da busca, da Lumi e dos formulários passam a usar pelo menos 16 px e a acompanhar a escala escolhida pelo estudante, evitando fonte pequena e o motivo comum de zoom automático de entrada no iOS.
- Abas do perfil e das ferramentas quebram em linhas, mantendo opções acessíveis no celular. O botão de montagem do cronograma cabe na área disponível, inclusive com fonte ampliada.
- Cartões e títulos da operação deixam de causar rolagem horizontal ou quebras excessivas em tela estreita. O botão de apresentação da entrada tem área de toque de pelo menos 44 px de altura.
- A observação da área visível foi centralizada na estrutura global, abrangendo cadastro e login. O controle flutuante de acessibilidade não cobre o campo enquanto o teclado está ativo; preferências abertas continuam acessíveis. O acionador também é ocultado durante diálogos modais para não sobrepor suas ações.
- No chat da Lumi, ao editar a mensagem, ferramentas secundárias são ocultadas por CSS, mantendo estado e rascunhos, e a composição fica dentro da área visível. O treino com pistas tem fluxo rolável ao receber foco, em vez de ficar cortado pelo cartão.
- Diálogos de senha e de materiais ficam limitados à área visível, com rolagem, identificação acessível, foco inicial, contenção de Tab, Escape e restauração do foco. O fechamento é bloqueado durante o envio; a edição de materiais fica protegida contra alterações concorrentes enquanto salva.
- A confirmação de senha na gestão informa **As senhas precisam ser iguais** abaixo do campo, associa o aviso ao controle e não envia a alteração quando há divergência.
- O formulário de atividade e seus sete formatos de questão têm identificação acessível dos controles. Título, instruções e prazo também ganharam rótulos visíveis. O seletor de tipo de conta na gestão recebeu nome acessível.
- A página de detalhe da turma anuncia um título próprio no documento.

### Formulários e altura de teclado

Além da varredura inicial das rotas, foram abertos cadastro, disponibilidade do planejamento, editor de atividades e diálogos de gestão. Campos de horário, fontes, confirmação de senha e composição da Lumi foram verificados com fonte ampliada. A altura foi reduzida para **430 px** para conferir foco, rolagem e alcance das ações em uma área semelhante à que sobra com o teclado. A composição da Lumi passou a ficar dentro dessa área sem apagar o texto digitado.

Esta foi uma simulação de dimensões e área visível em navegador Chromium. Não houve uso de teclado virtual em aparelho físico Android/iOS. Estados dependentes de conteúdos e entregas reais continuam exigindo acompanhamento do uso; não foram feitas alterações em notas, senhas ou publicações de usuários para testar esses caminhos.

## Evidências e regressão

- Controles de entrada, limites de cota, percentuais sem apoio, contexto mínimo de coesão e aviso de ficção têm testes automatizados.
- Fluxos React verificam confirmação divergente sem envio, foco dos diálogos, retorno ao acionador, recuperação do overflow do documento, campos nomeados nos sete formatos de questão e detecção/limpeza da área de teclado fora do layout autenticado.
- A suíte completa passou com 436 testes. Lint e build são executados antes da entrega; CI e publicação são conferidos no GitHub e no Vercel.
- Relatórios locais: `backups/stage45-mobile-before.json`, `backups/stage45-mobile-final.json` e as três rodadas `backups/stage44-lumi-real*.json`.
- Capturas em `backups/visual-etapas44-45/`: operação antes/depois, senha divergente em tela curta e composição da Lumi em altura reduzida, sempre com dados fictícios.
