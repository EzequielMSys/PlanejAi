# Fluxos de dados enviados à IA

O cliente em `src/utils/openaiClient.js` usa `OPENAI_BASE_URL` e `OPENAI_API_KEY` no servidor. Sem URL explícita, o SDK usa a API oficial da OpenAI. O frontend não deve afirmar um provedor fixo: a configuração da produção precisa ser conferida pelo responsável. Retenção, uso para treinamento, região e subprocessadores dependem desse provedor e do contrato configurado; ainda não foram verificados neste repositório.

| Recurso | Dados que podem compor o pedido | Ação que inicia |
| --- | --- | --- |
| Lumi, conversa livre | Mensagem, disciplina, histórico recente, nome e contexto de estudos disponível da conta; pode incluir trechos de redação quando a pergunta é sobre escrita. | Enviar mensagem. |
| Lumi, contexto escolhido | Mensagem, até 12 mensagens de histórico e os registros que a pessoa conferiu. | Escolher contexto e enviar mensagem. |
| Leitura de foto ou arquivo | Conteúdo do arquivo ou texto extraído, conforme o formato e a função. | Pedir leitura após escolher o arquivo. |
| Revisão de redação | Texto ou trecho da redação e instrução de revisão. | Pedir análise ou orientação. |
| Estudo guiado e diário | Texto e registros selecionados para a orientação. | Pedir ajuda ao assistente. |

## Verificações antes de publicar uma política completa

1. Conferir o valor efetivo de `OPENAI_BASE_URL`, modelo, contrato e retenção do provedor na produção, sem expor chaves.
2. Revisar cada chamada `chat.completions.create` para confirmar o payload exato e se há persistência local antes e depois da chamada.
3. Definir e publicar prazos de retenção de conversas, arquivos, logs e backups com base na operação real.
4. Repetir o inventário quando uma nova função de IA for adicionada.
