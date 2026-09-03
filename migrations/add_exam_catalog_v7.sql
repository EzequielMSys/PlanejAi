CREATE TABLE IF NOT EXISTS catalogo_provas (
  id_catalogo INT AUTO_INCREMENT PRIMARY KEY,
  instituicao VARCHAR(50) NOT NULL,
  titulo VARCHAR(160) NOT NULL,
  referencia_ano SMALLINT UNSIGNED NULL,
  descricao TEXT NULL,
  tipo ENUM('SIMULADO_AUTORAL','PROVA_OFICIAL_REFERENCIADA') NOT NULL DEFAULT 'SIMULADO_AUTORAL',
  fonte_url VARCHAR(500) NULL,
  duracao_minutos SMALLINT UNSIGNED NOT NULL DEFAULT 120,
  ativo TINYINT(1) NOT NULL DEFAULT 1,
  criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_catalogo_identidade (instituicao, titulo, referencia_ano),
  INDEX idx_catalogo_instituicao (instituicao, ativo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS catalogo_prova_questoes (
  id_catalogo INT NOT NULL,
  id_questao INT NOT NULL,
  peso DECIMAL(5,2) NOT NULL DEFAULT 1,
  PRIMARY KEY (id_catalogo, id_questao),
  INDEX idx_catalogo_questao (id_questao)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS simulados_catalogo (
  id_simulado INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario INT NOT NULL,
  id_catalogo INT NOT NULL,
  dificuldade ENUM('TODAS','FACIL','MEDIA','DIFICIL') NOT NULL DEFAULT 'TODAS',
  questoes JSON NOT NULL,
  respostas JSON NULL,
  total_questoes SMALLINT UNSIGNED NOT NULL,
  acertos SMALLINT UNSIGNED NULL,
  nota DECIMAL(6,2) NULL,
  status ENUM('EM_ANDAMENTO','CONCLUIDO') NOT NULL DEFAULT 'EM_ANDAMENTO',
  iniciado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  concluido_em DATETIME NULL,
  INDEX idx_simulado_usuario (id_usuario, iniciado_em),
  INDEX idx_simulado_catalogo (id_catalogo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT IGNORE INTO catalogo_provas (instituicao, titulo, referencia_ano, descricao, tipo, duracao_minutos) VALUES
('ITA', 'ITA Sprint 2025', 2025, 'Simulado autoral PlanejAI inspirado no perfil de raciocínio do ITA. Não reproduz a prova oficial.', 'SIMULADO_AUTORAL', 180),
('ITA', 'ITA Sprint 2024', 2024, 'Coleção autoral para treino avançado de Matemática, Física e Química. Não reproduz a prova oficial.', 'SIMULADO_AUTORAL', 180),
('ITA', 'ITA Sprint 2023', 2023, 'Treino autoral por dificuldade com histórico persistente. Não reproduz a prova oficial.', 'SIMULADO_AUTORAL', 180),
('ENEM', 'ENEM Essencial', 2025, 'Simulado autoral interdisciplinar para treino de ritmo e tomada de decisão.', 'SIMULADO_AUTORAL', 120);

INSERT INTO questoes_estudo (disciplina, competencia, enunciado, alternativas, resposta_correta, explicacao, dificuldade, origem)
SELECT 'Matemática', 'Álgebra', 'Se x + 1/x = 3, qual é o valor de x² + 1/x²?', JSON_ARRAY('5', '7', '9', '11'), 1, 'Elevando a igualdade ao quadrado, obtemos x² + 2 + 1/x² = 9.', 'MEDIA', 'PlanejAI ITA autoral v1'
WHERE NOT EXISTS (SELECT 1 FROM questoes_estudo WHERE origem = 'PlanejAI ITA autoral v1' AND competencia = 'Álgebra');

INSERT INTO questoes_estudo (disciplina, competencia, enunciado, alternativas, resposta_correta, explicacao, dificuldade, origem)
SELECT 'Matemática', 'Geometria analítica', 'Uma circunferência de centro (2, -1) passa pelo ponto (5, 3). Qual é o quadrado do raio?', JSON_ARRAY('5', '12', '20', '25'), 3, 'O quadrado da distância é (5-2)² + (3+1)² = 25.', 'FACIL', 'PlanejAI ITA autoral v1'
WHERE NOT EXISTS (SELECT 1 FROM questoes_estudo WHERE origem = 'PlanejAI ITA autoral v1' AND competencia = 'Geometria analítica');

INSERT INTO questoes_estudo (disciplina, competencia, enunciado, alternativas, resposta_correta, explicacao, dificuldade, origem)
SELECT 'Física', 'Mecânica', 'Um corpo parte do repouso com aceleração constante de 4 m/s². Qual distância percorre em 3 s?', JSON_ARRAY('6 m', '12 m', '18 m', '36 m'), 2, 'Usando s = at²/2, temos s = 4·9/2 = 18 m.', 'FACIL', 'PlanejAI ITA autoral v1'
WHERE NOT EXISTS (SELECT 1 FROM questoes_estudo WHERE origem = 'PlanejAI ITA autoral v1' AND competencia = 'Mecânica');

INSERT INTO questoes_estudo (disciplina, competencia, enunciado, alternativas, resposta_correta, explicacao, dificuldade, origem)
SELECT 'Física', 'Eletricidade', 'Dois resistores de 6 ohms ligados em paralelo têm resistência equivalente igual a:', JSON_ARRAY('2 ohms', '3 ohms', '6 ohms', '12 ohms'), 1, 'Para resistores iguais em paralelo, a resistência equivalente é metade de uma resistência.', 'MEDIA', 'PlanejAI ITA autoral v1'
WHERE NOT EXISTS (SELECT 1 FROM questoes_estudo WHERE origem = 'PlanejAI ITA autoral v1' AND competencia = 'Eletricidade');

INSERT INTO questoes_estudo (disciplina, competencia, enunciado, alternativas, resposta_correta, explicacao, dificuldade, origem)
SELECT 'Química', 'Estequiometria', 'Na reação 2 H₂ + O₂ → 2 H₂O, quantos mols de água são formados a partir de 3 mols de O₂ com H₂ em excesso?', JSON_ARRAY('2', '3', '6', '9'), 2, 'Cada mol de O₂ produz dois mols de H₂O.', 'MEDIA', 'PlanejAI ITA autoral v1'
WHERE NOT EXISTS (SELECT 1 FROM questoes_estudo WHERE origem = 'PlanejAI ITA autoral v1' AND competencia = 'Estequiometria');

INSERT INTO questoes_estudo (disciplina, competencia, enunciado, alternativas, resposta_correta, explicacao, dificuldade, origem)
SELECT 'Química', 'Equilíbrio químico', 'Em um sistema em equilíbrio, a adição de reagente tende inicialmente a:', JSON_ARRAY('Deslocar o equilíbrio para os produtos', 'Zerar a constante de equilíbrio', 'Impedir novas colisões', 'Eliminar o catalisador'), 0, 'Pelo princípio de Le Chatelier, o sistema tende a consumir parte do reagente adicionado.', 'DIFICIL', 'PlanejAI ITA autoral v1'
WHERE NOT EXISTS (SELECT 1 FROM questoes_estudo WHERE origem = 'PlanejAI ITA autoral v1' AND competencia = 'Equilíbrio químico');

INSERT IGNORE INTO catalogo_prova_questoes (id_catalogo, id_questao)
SELECT c.id_catalogo, q.id_questao FROM catalogo_provas c CROSS JOIN questoes_estudo q
WHERE c.instituicao = 'ITA' AND q.origem = 'PlanejAI ITA autoral v1';

INSERT IGNORE INTO catalogo_prova_questoes (id_catalogo, id_questao)
SELECT c.id_catalogo, q.id_questao FROM catalogo_provas c CROSS JOIN questoes_estudo q
WHERE c.instituicao = 'ENEM' AND q.ativo = 1 AND q.disciplina IN ('Matemática', 'Física', 'Química');
