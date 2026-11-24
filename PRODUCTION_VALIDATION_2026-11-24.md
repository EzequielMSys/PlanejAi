# Verificação das etapas 4, 5 e 6 — 24/11/2026

## Fluxos de produção

O script `node test/productionFlowSmoke.js` cria e exclui uma conta descartável. Passaram: cadastro, login, perfil e disponibilidade, geração e leitura do cronograma, resposta da Lumi, envio e leitura de redação, consulta das turmas do aluno e exportação JSON com a conta. A solicitação de recuperação foi aceita com HTTP 202. A conta de teste foi excluída ao final.

Limites: o endereço `example.invalid` impede confirmar a entrega do e-mail e o uso do link de recuperação. Criar turma e gerir convites exigem um docente de teste; a conta descartável de estudante só validou a consulta. O teste verifica a API de ponta a ponta, não cada percurso da interface.

## Desempenho móvel

Lighthouse 13.6.0, Chrome em perfil móvel, cache de navegação limpo e limitação de rede/CPU simulada (`--preset=perf --form-factor=mobile --throttling-method=simulate`). Uma execução por página; os resultados variam entre execuções.

| Página | Antes: nota / LCP / bloqueio / transferência | Depois: nota / LCP / bloqueio / transferência |
| --- | --- | --- |
| Inicial | 99/100 · 1,52 s · 94 ms · 931 KB | 100/100 · 1,51 s · 30 ms · 231 KB |
| Login | 99/100 · 1,56 s · 113 ms · 159 KB | 100/100 · 1,65 s · 40 ms · 173 KB |

A imagem da Lumi foi convertida para WebP com transparência, de 758.547 para 55.220 bytes (redução de 92,7%). O componente passou a usar o arquivo novo. A medição final da página inicial foi feita isoladamente; uma primeira tentativa em paralelo com outra medição sofreu disputa de CPU e foi descartada. A queda de bytes é confiável; a diferença de poucos milissegundos no LCP não comprova melhora de latência. Ainda faltam telas autenticadas sob o mesmo perfil móvel e conexão controlada.

## Dependências

Antes: `npm audit --omit=dev` na API encontrou 16 alertas, incluindo um crítico transitivo (`proxy-addr`). O frontend encontrou 7 alertas na auditoria completa. Após atualizar dependências, ambos os `npm audit` completos retornaram zero alertas. O SDK `@vercel/blob` ainda depende de `@vercel/cli-config@0.3.1`, que fixa `zod@4.1.11`; um override restrito ao `zod` desse pacote o atualiza para 4.6.7. O teste de produção com foto confirmou upload, acesso e remoção após a publicação.
