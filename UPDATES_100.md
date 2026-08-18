# 100 melhorias verificadas no PlanejAI

## Segurança e autenticação

1. Header `X-Content-Type-Options` habilitado.
2. Header `X-Frame-Options` habilitado na API.
3. Política de referência restrita.
4. Permissões de câmera bloqueadas por padrão.
5. Permissões de microfone bloqueadas por padrão.
6. Permissões de geolocalização bloqueadas por padrão.
7. Permissões de pagamento bloqueadas por padrão.
8. Identificador único por requisição.
9. Identificador retornado em erros para diagnóstico.
10. Remoção do header `X-Powered-By`.
11. Cache desabilitado nas respostas privadas da API.
12. Limitação de tentativas de login.
13. Limitação de tentativas de cadastro.
14. Limitação de recuperação de senha.
15. Header `Retry-After` em bloqueios temporários.
16. Limpeza automática do mapa de tentativas.
17. JWT limitado ao algoritmo HS256.
18. Segredo JWT mínimo obrigatório em produção.
19. E-mails normalizados antes do cadastro.
20. E-mails normalizados antes do login.
21. E-mails normalizados na recuperação.
22. Comparação bcrypt fictícia contra enumeração temporal.
23. Tokens expirados descartados no frontend.
24. Sessões corrompidas limpas integralmente.
25. Confirmação de nova senha validada no backend.
26. Nova senha impedida de repetir a senha atual.
27. Rate limit separado por IP e rota.
28. Limite de JSON reduzido para 2 MB.
29. Limite específico para formulários URL-encoded.
30. Mensagem própria para payload excessivo.

## Uploads e conteúdo

31. Extensões de upload validadas por lista exata.
32. MIME validado junto com a extensão.
33. Extensões normalizadas para minúsculas.
34. Nomes de arquivos limitados em comprimento.
35. UUID adicionado aos nomes enviados.
36. Colisão de nomes de arquivo evitada.
37. Fotos de perfil limitadas a JPG, PNG e WEBP.
38. GIF recusado para foto de perfil.
39. Documentos recusados para foto de perfil.
40. Foto de perfil limitada a um arquivo.
41. Material PDF exige link direto `.pdf`.
42. Material de vídeo exige página direta de reprodução.
43. Links de pesquisa são recusados pelo backend.
44. Links antigos do banco são reparados automaticamente.
45. Botões diferenciam vídeo, PDF e leitura.
46. Player interno para YouTube.
47. Player interno para vídeos enviados.
48. Leitor interno para PDF.
49. Leitura interna para artigos.
50. Alternativa externa preservada para bloqueios de incorporação.

## Confiabilidade e diagnóstico

51. Encerramento seguro em `SIGTERM`.
52. Encerramento seguro em `SIGINT`.
53. Pool MySQL fechado no desligamento.
54. Timeout de segurança no encerramento.
55. Rejeições de Promise registradas.
56. Exceções não capturadas registradas.
57. Health check valida o banco.
58. Health check informa uptime.
59. Health check informa horário UTC.
60. Health check informa o ambiente.
61. Erros do servidor associados ao request ID.
62. Error Boundary recupera falhas do React.
63. Tela de recuperação preserva os dados.
64. Monitor automático de conexão.
65. Monitor diferencia internet e servidor.
66. Verificação de conexão tem timeout.
67. Botão de nova tentativa disponível.
68. Timeout padrão de 15 segundos no Axios.
69. Header JSON aceito por padrão.
70. Página 404 própria do PlanejAI.

## Acessibilidade e experiência

71. Link “Pular para o conteúdo”.
72. Conteúdo principal pode receber foco.
73. Mudanças de rota anunciadas a leitores de tela.
74. Títulos do documento mudam por página.
75. Rolagem volta ao topo nas rotas.
76. `Esc` remove foco preso.
77. Atalho `Alt+1` abre o início.
78. Atalho `Alt+C` abre o cronograma.
79. Atalho `Alt+R` abre redações.
80. Atalho `Alt+A` abre atividades.
81. Preferência de movimento reduzido respeitada.
82. Contraste elevado recebe bordas reforçadas.
83. Cursores de campos desabilitados corrigidos.
84. Layout de impressão remove navegação.
85. Imagens não extrapolam o contêiner.
86. Tema do navegador acompanha claro/escuro.
87. Mensagem disponível quando JavaScript está desativado.
88. Timer de foco persiste entre páginas.
89. Ciclos de 25 e 50 minutos.
90. Ciclo curto de pausa.

## PWA, deploy e manutenção

91. Manifesto de aplicativo criado.
92. PlanejAI instalável quando o navegador permitir.
93. Service worker não roda durante desenvolvimento.
94. Shell principal disponível offline.
95. Assets estáticos usam estratégia cache-first.
96. APIs e uploads nunca entram no cache offline.
97. Caches antigos são removidos na ativação.
98. Sitemap e robots adicionados.
99. Deploy executa lint e validação do backend antes de publicar.
100. Dependabot, EditorConfig, GitAttributes e política de segurança adicionados.
