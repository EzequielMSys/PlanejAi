# Etapa 37 — Conectar os assuntos

## Entrega

Na sala de estudo, **Uma ideia abre outra** apresenta uma relação editorial entre o assunto atual e outro conceito. O recurso começa com oito relações direcionais entre sete assuntos:

| Assuntos conectados | Utilidade |
| --- | --- |
| Leis de Newton ↔ Trabalho e energia | Relacionar força, deslocamento e variação da energia cinética. |
| Funções do 1º grau ↔ Mecânica: cinemática | Interpretar taxa e valor inicial no movimento retilíneo uniforme. |
| Coesão e coerência ↔ Estrutura da redação | Escolher relações de sentido e revisar a ligação dos argumentos. |
| Repertório sociocultural ↔ Estrutura da redação | Explicar como uma referência contribui para a tese. |

Cada direção tem justificativa, exemplo, pergunta de aplicação e raciocínio próprios. Não se presume que a relação inversa tenha a mesma explicação. A seção começa recolhida, com uma conexão de cada vez; o estudante pode expandir e consultar outra quando disponível.

O botão **Registrar esta conexão nas anotações** acrescenta a ponte e a pergunta ao texto atual, uma única vez, e abre o editor existente. O estudante registra sua explicação com o mesmo salvamento da conta e as mesmas proteções de rascunho das anotações. Nada é enviado à Lumi nem registrado como conclusão de sessão por essa ação.

**Buscar este assunto no meu acervo** abre a busca unificada em outra aba. As permissões e a reautorização de materiais continuam sendo feitas pelo backend já existente. A relação conceitual é pública; sua presença não promete um material disponível na conta.

## Curadoria e limites

- Catálogo explícito em `frontend/src/data/studyConnections.js`, conferido em 25/10/2026. Exemplos e perguntas autorais, com referências primárias acessíveis em cada conexão.
- Revisão editorial do conteúdo e das condições dos exemplos; não se apresenta como aprovação de um professor externo.
- Correspondência por disciplina e título/alias definidos. Variações de maiúsculas, acentos, espaços e símbolos ordinais são normalizadas. Não há correspondência por palavras soltas, associação gerada por IA ou pontuação de domínio.
- Assuntos fora desse recorte não exibem uma conexão inventada. Cada novo assunto exige definir aliases, revisar a relação, exemplos e referências, e acrescentar validação ao catálogo.
- Nenhuma leitura de redações, anotações ou histórico pessoal para inferir “você usou esta ideia”. Relações pessoais exigiriam evidência e um escopo de acesso próprio em uma futura etapa.
- Referências de escrita usam a edição de 2025 explicitamente identificada, para conceitos de coesão e argumentação; não fazem afirmações sobre novas regras ou critérios exclusivos do Enem 2026.

## Referências consultadas

- [OpenStax — Kinetic Energy and the Work-Energy Theorem](https://openstax.org/books/college-physics-2e/pages/7-2-kinetic-energy-and-the-work-energy-theorem).
- [OpenStax — Position vs. Time Graphs](https://openstax.org/books/physics/pages/2-3-position-vs-time-graphs).
- [Inep — Cartilha de redação 2025, versão acessível, competência IV](https://download.inep.gov.br/publicacoes/institucionais/avaliacoes_e_exames_da_educacao_basica/a_redacao_no_enem_2025_cartilha_do_participante_dislexia.pdf).
- [Inep — Cartilha de redação 2025](https://www.gov.br/inep/pt-br/centrais-de-conteudo/acervo-linha-editorial/publicacoes-institucionais/avaliacoes-e-exames-da-educacao-basica/redacao-do-enem-2025-cartilha-do-a-participante/).

## Validação e desempenho

- Testes de integridade do catálogo, aliases não ambíguos, compatibilidade com o catálogo inicial do projeto, disciplina correta e recusa de títulos desconhecidos ou semelhantes.
- Fluxos de interface: expansão sem consultas extras, link seguro para busca com filtro de materiais, preservação e não duplicação de anotações, troca de conexão mantendo foco do teclado, acessibilidade e ausência de envio automático à IA ou leitura de redações.
- Conferência visual com dados fictícios em desktop e celular de 390 px, cores personalizadas, tema escuro e fonte ampliada a 200%, sem transbordamento horizontal. No modo leitura, a seção fica oculta e suas informações continuam montadas.
- Componente carregado sob demanda na rota de estudo, sem biblioteca de grafos, novas dependências, consultas ao banco ou chamadas adicionais à API. Falha no carregamento da seção não remove o editor da sessão.
- Suíte completa, lint e build do frontend antes da publicação.

Esta etapa não exige migration. As propostas de logo existentes continuam fora desta alteração.
