# Fluxos de dados enviados à IA

O cliente em `src/utils/openaiClient.js` usa `OPENAI_BASE_URL` e `OPENAI_API_KEY` no servidor. Sem URL explícita, o SDK usa a API oficial da OpenAI. O frontend não deve afirmar um provedor fixo: a configuração da produção precisa ser conferida pelo responsável. Retenção, uso para treinamento, região e subprocessadores dependem desse provedor e do contrato configurado; ainda não foram verificados neste repositório.

## Conferência em 24/11/2026

- O `.env` local aponta para `api.groq.com` com modelo `openai/gpt-oss-120b`. Nenhuma chave foi copiada para este documento. No painel do projeto Vercel, `OPENAI_BASE_URL`, `OPENAI_MODEL` e `OPENAI_API_KEY` existem no ambiente **Production** (consulta em 24/11/2026), porém são variáveis do tipo Secret e os valores não foram revelados. **Isso ainda não comprova que a produção usa a Groq.** O painel do dono mostra o modelo, mas não o host efetivo nem a configuração contratual.
- A [documentação da Groq sobre dados](https://console.groq.com/docs/your-data) informa que pedidos de inferência não são retidos por padrão, mas entradas e saídas podem constar de logs temporários de confiabilidade ou abuso por até 30 dias. A opção Zero Data Retention depende da configuração da organização. O [acordo de serviços](https://console.groq.com/docs/legal/services-agreement) declara que entradas e saídas não são usadas para treinar modelos sem autorização. Essas são condições públicas gerais, não uma verificação do contrato e dos controles da conta PlanejAI.
- O painel do dono passa a mostrar apenas o **host efetivo** de `OPENAI_BASE_URL` e o modelo carregado pelo servidor, sem revelar chaves nem URLs completas. Depois da publicação, usar esses campos para conferir a produção. Na conta do provedor, conferir o acordo aplicável e Data Controls. Registrar data, responsável e evidência sem guardar chaves ou conteúdo dos estudantes.
- O painel Data Controls da Groq pediu login nesta sessão; a opção Zero Data Retention e o contrato específico da organização não puderam ser conferidos em 24/11/2026.

## Payloads conferidos no código

| Recurso | Enviado ao provedor | Persistência local |
| --- | --- | --- |
| Lumi, conversa livre | Mensagem atual, histórico limitado e prompt com nome, disciplina, contexto de estudos e, conforme a pergunta, trecho de redação. | Mensagem e resposta em `mensagens_chat_ia`. |
| Lumi, contexto escolhido | Mensagem, até 12 mensagens de histórico escolhidas e registros selecionados. | Mensagem e resposta em `mensagens_chat_ia`. |
| Leitura de foto de atividade | Imagem escolhida codificada em Base64 e instrução de transcrição. | A imagem é processada em memória; o texto devolvido segue o fluxo iniciado pelo usuário. |
| Transcrição de áudio ou vídeo | Arquivo escolhido de até 4 MB ao endpoint de transcrição. | O serviço devolve texto limitado a 12 mil caracteres. |
| Avaliação de redação | Tema até 500 caracteres e texto até 30 mil caracteres. | A avaliação se liga ao fluxo de redação do produto. |
| Revisão de intenção na redação | Trecho e intenção fornecidos à ferramenta. | A resposta desta revisão não é salva no histórico. |
| Estudo guiado e diário | Texto do registro e contexto selecionado para orientação. | Os registros de estudo são mantidos no banco. |

O código também usa `chat.completions` em `guidedStudyService`, `learningJournalService` e `essayIntentService`; qualquer mudança desses prompts exige nova revisão deste inventário.

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
