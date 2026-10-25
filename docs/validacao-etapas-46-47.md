# Etapas 46 e 47 — salvamento e tela Hoje

Validação em 25/10/2026.

## Salvamento

- Anotações distinguem uma falha de envio de uma cópia local recuperada. O reenvio continua explícito e as gravações continuam serializadas, para uma resposta antiga não confirmar alterações posteriores. O horário é mostrado apenas em estado confirmado na conta.
- Redações mantêm o rascunho local durante falhas e oferecem nova tentativa no próprio aviso. O envio exibe seu estado; somente uma resposta com identificação da redação confirma o sucesso e permite limpar o rascunho correspondente. Uma versão já encaminhada à fila não recebe outro botão de envio da mesma versão.
- A oficina de redação guarda as alterações por conta e aparelho, oferece recuperação explícita depois de consultar o projeto da conta e distingue rascunho, envio, confirmação e falha. Falha de armazenamento mantém o formulário disponível e ativa o aviso de saída. A consulta ao servidor continua sendo necessária para editar o projeto, evitando substituir dados desconhecidos.
- Planejamento mostra avisos persistentes para matérias e horários, preserva as escolhas em caso de erro e permite repetir a etapa. Falhas de armazenamento local também têm nova tentativa. A conclusão continua dependendo da confirmação do servidor.
- Uma cópia local não é um backup online: pode ser perdida se o usuário apagar os dados do navegador. Os avisos distinguem esse estado de dados confirmados na conta.

## Hoje

- Mensagens próprias para início, sessão aberta e retorno após pelo menos três dias desde o acesso anterior à tela neste aparelho, com prioridade para a sessão aberta.
- O acesso anterior é uma preferência local separada por conta; não presume dias sem estudo nem acompanha acessos em outros aparelhos. A primeira experiência continua sendo determinada pelos registros disponíveis, sem presumir histórico vazio quando há falha na consulta.
- A recomendação principal mantém conteúdo, motivo, duração e acesso direto ao estudo. Atalhos ficam em Outras opções; roteiro, sinais de aprendizagem e indicadores complementares ficam em Ver detalhes do meu dia. Ajustes de rotina e revisão continuam diretamente disponíveis.

## Verificação

- 443 testes passaram, incluindo falha e nova tentativa de planejamento, redação e anotações; recuperação da oficina; armazenamento cheio; isolamento entre contas; sessão em andamento e prioridade do primeiro estudo.
- Lint e build de produção passaram.
- Navegador com dados fictícios e APIs substituídas: desktop de 1280 px, celular de 390 px e tela de 320 px com fonte a 140%. Sem rolagem horizontal nos estados conferidos, inclusive com detalhes expandidos.
- Falha de planejamento reproduzida no navegador: escolhas mantidas e botão Tentar salvar novamente disponível. Nenhuma informação de estudante foi alterada para esses testes.
- Evidências locais: backups/stage46-tests.log, backups/stage46-build.log e backups/visual-etapas46-47/.
- Não houve mudança de esquema do banco nem nova chamada paga à Lumi nesta rodada.
