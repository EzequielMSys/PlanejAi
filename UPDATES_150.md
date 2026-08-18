# PlanejAI — ciclo de 150 melhorias

Este ciclo transforma a redação em uma experiência de estudo completa, melhora o diagnóstico pedagógico e adiciona áudio integrado sem tirar o aluno do site. Os itens abaixo correspondem a comportamentos, estados, proteções, componentes visuais e critérios de análise implementados neste ciclo.

## Estúdio de escrita (1–45)

1. Novo Estúdio de Redação em layout editorial próprio.
2. Folha central com tipografia de leitura longa.
3. Linhas discretas de caderno no editor.
4. Tema visual coerente no modo claro.
5. Tema visual coerente no modo escuro.
6. Cabeçalho editorial “Construir, testar, revisar”.
7. Modo foco em tela ampliada.
8. Saída rápida do modo foco.
9. Editor responsivo para celular.
10. Editor responsivo para tablet.
11. Painéis laterais adaptáveis em telas menores.
12. Salvamento automático local com debounce.
13. Horário do último salvamento visível.
14. Recuperação automática de rascunho.
15. Aviso ao recuperar rascunho anterior.
16. Descarte protegido por confirmação.
17. Limpeza do rascunho após envio bem-sucedido.
18. Contador de palavras em tempo real.
19. Estimativa de linhas ENEM.
20. Contador de parágrafos.
21. Estimativa de tempo de leitura.
22. Progresso para a meta formativa de 280 palavras.
23. Barra visual de progresso.
24. Mapa estrutural da introdução.
25. Mapa estrutural do primeiro argumento.
26. Mapa estrutural do segundo argumento.
27. Mapa estrutural da intervenção.
28. Estado concluído para cada etapa estrutural.
29. Microdica para introdução.
30. Microdica para desenvolvimento 1.
31. Microdica para desenvolvimento 2.
32. Microdica para conclusão.
33. Coach de revisão em três leituras.
34. Revisão específica de ideia e tese.
35. Revisão específica de prova e argumento.
36. Revisão específica de forma e coesão.
37. Lembrete de repertório produtivo.
38. Botão de pré-correção junto ao editor.
39. Botão de pré-correção no mapa lateral.
40. Bloqueio de pré-correção para texto insuficiente.
41. Estado de carregamento durante a análise.
42. Botão de envio desabilitado para texto mínimo insuficiente.
43. Campo de tema com hierarquia visual própria.
44. Corretor ortográfico nativo mantido no textarea.
45. Ações de descartar, revisar e enviar separadas por intenção.

## Correção pedagógica (46–88)

46. Nova rota autenticada de pré-análise de rascunho.
47. Limite mínimo de conteúdo na pré-análise.
48. Limite máximo de texto contra abuso.
49. Limite máximo de tema contra abuso.
50. Pré-análise sem envio ao LanguageTool externo.
51. Mensagem de privacidade da pré-análise.
52. Aviso de que a nota automática não é oficial.
53. Competência 1 em faixas ENEM de 40 pontos.
54. Competência 2 em faixas ENEM de 40 pontos.
55. Competência 3 em faixas ENEM de 40 pontos.
56. Competência 4 em faixas ENEM de 40 pontos.
57. Competência 5 em faixas ENEM de 40 pontos.
58. Escala total consistente de 0 a 1000.
59. Aderência ao tema por vocabulário relevante.
60. Remoção de palavras vazias na comparação temática.
61. Registro das palavras do tema encontradas.
62. Taxa explícita de aderência temática.
63. Reconhecimento de tese por marcadores de posicionamento.
64. Reconhecimento de causa nos argumentos.
65. Reconhecimento de consequência nos argumentos.
66. Reconhecimento de exemplificação.
67. Avaliação de quantidade de parágrafos com contexto.
68. Detecção de repertório sociocultural reconhecível.
69. Feedback para repertório apenas decorativo.
70. Avaliação de variedade de conectivos.
71. Identificação do agente da intervenção.
72. Identificação da ação da intervenção.
73. Identificação do meio da intervenção.
74. Identificação da finalidade da intervenção.
75. Identificação do detalhamento da intervenção.
76. Contagem visual dos cinco elementos da proposta.
77. Feedback individual para cada competência.
78. Medidor visual para cada competência.
79. Plano de revisão ordenado pela menor competência.
80. Limite de três prioridades para evitar sobrecarga.
81. Ações concretas em cada prioridade.
82. Feedback linguístico proporcional aos apontamentos.
83. Nota final salva com o contexto do tema.
84. Plano de revisão retornado no envio final.
85. Resultado de prévia sem gravar redação no banco.
86. Tratamento de erro dedicado para pré-análise.
87. Compatibilidade com competências salvas anteriormente.
88. Testes automatizados da escala, intervenção e aderência.

## Autoria responsável (89–106)

89. Remoção da acusação automática de uso de IA.
90. `flag_ia` automático neutralizado para novos textos.
91. Nome alterado de “detecção” para “sinais de estilo e autoria”.
92. Aviso permanente sobre falsos positivos.
93. Classificação “texto insuficiente”.
94. Classificação “poucos sinais”.
95. Classificação “revisar com contexto”.
96. Medição de regularidade no tamanho das frases.
97. Medição de repetição lexical.
98. Identificação de fórmulas genéricas recorrentes.
99. Observação de parágrafos artificialmente uniformes.
100. Indicadores escritos como sugestões de revisão.
101. Limite de cinco indicadores para reduzir ruído.
102. Propriedade explícita de confiança limitada.
103. Recomendação de consultar histórico de versões.
104. Recomendação de conversar com o autor.
105. Recomendação de avaliação humana contextual.
106. Compatibilidade responsável para análises antigas salvas.

## Tema Lab e repertório (107–132)

107. Tema Lab integrado ao editor.
108. Aplicação do tema sugerido com um clique.
109. Questão norteadora para cada tema.
110. Três rotas possíveis de tese.
111. Rota por causa estrutural e consequência.
112. Rota por avanço legal e aplicação prática.
113. Rota por Estado e sociedade.
114. Coletânea com texto de contexto.
115. Coletânea com tensão social.
116. Coletânea com recorte brasileiro.
117. Checklist de delimitação do problema.
118. Checklist de tese em dois eixos.
119. Checklist de comprovação dos argumentos.
120. Checklist de repertório conectado à tese.
121. Checklist de intervenção completa.
122. Alerta contra cópia do texto motivador.
123. Alerta contra citação sem explicação.
124. Alerta contra solução genérica.
125. Alerta contra dado inventado.
126. Recomendações de podcast por eixo.
127. Recomendações de filme por eixo.
128. Recomendações de documentário por eixo.
129. Recomendações de livro por eixo.
130. Explicação de como usar cada repertório.
131. Busca de tema com sinônimos e palavras relacionadas.
132. Ranqueamento por quantidade de termos correspondentes.

## Spotify, integração e qualidade (133–150)

133. Dock global “Som de foco”.
134. Player oficial do Spotify dentro do site.
135. Suporte a músicas do Spotify.
136. Suporte a álbuns do Spotify.
137. Suporte a playlists do Spotify.
138. Suporte a episódios de podcast.
139. Suporte a programas de podcast.
140. Suporte a páginas de artista.
141. Validação segura de domínio do Spotify.
142. Validação segura do tipo de conteúdo.
143. Validação do identificador antes de criar iframe.
144. Suporte a URLs internacionais do Spotify.
145. Playlist Deep Focus pré-configurada.
146. Playlist Peaceful Piano pré-configurada.
147. Playlist Lo-Fi Beats pré-configurada.
148. Conteúdo de áudio escolhido persistente no navegador.
149. Player minimizável e responsivo.
150. Validações de lint, build, backend e regressão concluídas.
