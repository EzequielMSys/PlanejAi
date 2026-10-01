CREATE TABLE IF NOT EXISTS diagnosticos_estudo (
  id_diagnostico INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario INT NOT NULL,
  disciplina VARCHAR(100) NOT NULL,
  acertos TINYINT UNSIGNED NOT NULL DEFAULT 0,
  total TINYINT UNSIGNED NOT NULL DEFAULT 0,
  nivel_recomendado ENUM('FACIL','MEDIA','DIFICIL') NOT NULL DEFAULT 'MEDIA',
  concluido_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_diagnostico_usuario (id_usuario, disciplina, concluido_em)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS metas_por_materia (
  id_meta INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario INT NOT NULL,
  disciplina VARCHAR(100) NOT NULL,
  tipo ENUM('QUESTOES','REDACOES','MINUTOS') NOT NULL,
  alvo INT UNSIGNED NOT NULL,
  inicio_semana DATE NOT NULL,
  UNIQUE KEY uk_meta_materia_semana (id_usuario, disciplina, tipo, inicio_semana),
  INDEX idx_meta_usuario (id_usuario, inicio_semana)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS privacidade_aprendizagem (
  id_usuario INT PRIMARY KEY,
  visibilidade ENUM('RESUMO','DETALHADO','PRIVADO') NOT NULL DEFAULT 'RESUMO',
  atualizado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS flashcards_estudo (
  id_flashcard INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario INT NOT NULL,
  frente TEXT NOT NULL,
  verso TEXT NOT NULL,
  disciplina VARCHAR(100) NULL,
  origem ENUM('ANOTACAO','ERRO','MANUAL') NOT NULL DEFAULT 'MANUAL',
  proxima_revisao DATE NOT NULL DEFAULT (CURRENT_DATE),
  criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_flashcards_fila (id_usuario, proxima_revisao)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS provas_planejadas (
  id_prova INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario INT NOT NULL,
  titulo VARCHAR(160) NOT NULL,
  data_prova DATE NOT NULL,
  materias JSON NOT NULL,
  criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_provas_usuario_data (id_usuario, data_prova)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
