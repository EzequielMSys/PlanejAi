# Etapas 13 e 14 — recuperação, desempenho e leitura

## Erros e espera

- Consulta de sessão tem timeout de 15 segundos. Uma resposta parada não mantém a restauração indefinidamente.
- O carregamento compartilhado explica a espera após oito segundos, sem recarregar a página ou apagar um formulário.
- Falha de módulo não provoca mais reload automático. A recuperação de interface distingue uma nova tentativa local da ação explícita de recarregar para buscar a versão atual.
- Falha na consulta de aprendizagem mostra erro com nova tentativa, em vez de apresentar um relatório vazio.
- Redações mantêm o editor disponível quando o histórico falha e não apresentam ausência de registros como se a consulta tivesse sido confirmada.
- Erro de envio fica junto ao editor; o texto é mantido. Uma versão colocada na fila do aparelho não é anunciada como confirmada no servidor nem reenviada novamente pelo mesmo botão.
- Uma resposta atrasada confirma somente o texto submetido: alterações posteriores, inclusive do ditado já iniciado, permanecem no rascunho. O mesmo cuidado se aplica à entrada na fila do aparelho.
- Rascunhos de redação são gravados por conta, imediatamente após a alteração. Quota de armazenamento ou armazenamento bloqueado gera um aviso; o formulário continua editável. Apagar ambos os campos não ressuscita um texto antigo.
- Rascunhos antigos sem proprietário não são associados automaticamente à conta atual. A chave antiga é preservada, sem exibir seu texto para outra conta.
- A oficina guiada aguarda o projeto salvo antes de liberar a edição. Falhas de salvamento preservam o formulário. Portfólio e revisão entre pares têm estado de consulta e recuperação; a revisão mantém o texto se o envio falhar.

## Desempenho

- Editor de redação, versões, portfólio e revisão entre pares usam imports dinâmicos.
- Portfólio e revisão entre pares são carregados ao abrir as ferramentas extras. A oficina consulta o projeto apenas quando aberta.
- Não foram adicionadas dependências.
- Comparação de builds locais: o chunk JavaScript específico de Redações passou de 47,79 KB (13,87 KB gzip) para 32,83 KB (9,95 KB gzip). O CSS específico passou de 35,98 KB para 17,67 KB. São tamanhos dos arquivos dessa rota, não o tráfego total do site nem uma medição de tempo de carregamento em celulares reais.

## Contraste e teclado

- Texto de botões de destaque usa a cor calculada para o fundo, inclusive no hover; mensagens do estudante usam o mesmo princípio.
- Links de leitura têm um token próprio com razão mínima de 4,5:1 nas superfícies principais. Bordas de controles são calculadas para 3:1 nas mesmas superfícies.
- Foco por teclado tem contorno de três pixels; campos com outline removido anteriormente recebem indicação visível.
- Atalhos de navegação não interceptam digitação em inputs, textareas, selects e áreas editáveis.
- Estúdio usa uma seção nomeada no lugar de um segundo landmark main aninhado.
- Títulos de página incluem Lumi, fontes e preferências. Movimento de esqueletos respeita a preferência do sistema para reduzir animações.

## Verificação e limites

Testes cobrem timeout, recuperação, fila, rascunho por conta, armazenamento cheio, limpeza do texto, oficina e atalhos. Contraste é calculado nas seis paletas e em escolhas extremas, nos modos claro e escuro, incluindo o estado de hover.

Na prévia local com conta e API simuladas, uma consulta que falhou foi recuperada pelo botão sem recarregar; a falha de envio manteve a redação; Tab mostrou foco de três pixels. As cores computadas de um botão com amarelo personalizado no modo escuro foram fundo `rgb(194,192,0)` e texto preto.

O navegador disponível não oferece limitação de banda. Foram usados atraso e falha controlados nos testes, além da comparação dos arquivos produzidos; isso não equivale a um teste completo em rede 3G ou em aparelhos físicos. As razões dos tokens não constituem certificação de acessibilidade de todo o site; textos sobre imagens, transparências e componentes não alterados exigem avaliação própria.
