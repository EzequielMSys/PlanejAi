# Etapas 11 e 12 — começar e continuar

## Primeiro acesso

- Uma conta autenticada pode explorar Lumi, fontes e prática sem terminar o perfil. Permissões de docentes/gestores e a troca obrigatória de senha continuam protegidas.
- O convite para preparar o plano explica o que falta. Explorar não marca o perfil como completo e não gera cronograma.
- Ano escolar opcional, objetivo inicial visível e dias escolhidos explicitamente. A interface informa que salvar preferências não cria nem substitui um plano.
- Matérias, objetivo e tempo já enviados ao servidor são recuperados ao voltar à configuração incompleta, inclusive em outro aparelho. Alterações ainda não enviadas permanecem apenas no formulário enquanto a tela estiver aberta.
- Erro ao consultar a configuração não abre um formulário vazio por cima de dados desconhecidos: há opção de tentar novamente ou explorar.
- A substituição dos horários é transacional e consulta o perfil pelo proprietário autenticado, sem interpretar um ID de usuário como ID de perfil.

## Continuidade

- A abertura de um item do cronograma registra a sessão pendente em `estudo_em_andamento`.
- Hoje oferece “Retomar minha sessão”; a sala também consulta o servidor quando aberta sem dados locais.
- O servidor verifica propriedade, plano ativo, data e conclusão. Itens concluídos deixam de aparecer. Terminar uma sessão antiga não apaga uma sessão diferente aberta em outro dispositivo.
- Anotações confirmadas continuam sendo recuperadas pelo conteúdo e pela conta; rascunhos não enviados permanecem no aparelho, com aviso próprio.
- Cache da sessão e histórico complementar usam chaves por usuário. Chaves antigas sem proprietário são ignoradas para não mostrar dados de outra conta.
- O aviso diferencia retomada confirmada na conta de envio não confirmado. Não promete sincronização de rascunhos que nunca chegaram ao servidor.
- Login recupera a rota protegida que motivou a autenticação. Resposta 401/403 ao restaurar a sessão invalida o cache de autenticação; erro temporário mantém as preferências confirmadas.
- Recuperação de senha existente mantida; não foi enviado e-mail a estudantes reais nesta validação.

## Data de nascimento

Era a coluna opcional `usuarios.data_nascimento`, sem uso no cadastro ou no restante do código. A conferência dos bancos local e Aiven encontrou zero datas preenchidas. A migração v22 removeu a coluna nos dois ambientes. A migration base histórica foi preservada; instalações novas criam e depois removem a coluna seguindo a sequência de versões.

Por proteção a instalações diferentes, a migração não descarta datas preenchidas: se encontrar valores, preserva a coluna. Não foi acrescentada coleta de idade ou data de nascimento. Um uso futuro deve ter uma finalidade concreta antes de acrescentar essa informação ao cadastro.

## Validação

Testes automatizados cobrem exploração com perfil incompleto, restauração de configuração, retomada sem sessionStorage, isolamento por conta, sessão revogada e rollback dos horários. Teste no Aiven com duas contas temporárias confirmou persistência, rejeição de acesso à sessão de outra conta e remoção de concluídos da retomada. Os dados temporários foram removidos. A conferência visual usa conta demonstrativa e API simulada, em desktop e largura de 360 pixels.
