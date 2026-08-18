CREATE TABLE IF NOT EXISTS questoes_estudo (
  id_questao INT AUTO_INCREMENT PRIMARY KEY,
  id_conteudo INT NULL,
  disciplina VARCHAR(100) NOT NULL,
  competencia VARCHAR(160) NULL,
  enunciado TEXT NOT NULL,
  alternativas JSON NOT NULL,
  resposta_correta TINYINT UNSIGNED NOT NULL,
  explicacao TEXT NOT NULL,
  dificuldade ENUM('FACIL','MEDIA','DIFICIL') NOT NULL DEFAULT 'MEDIA',
  origem VARCHAR(80) NOT NULL DEFAULT 'PlanejAI',
  ativo TINYINT(1) NOT NULL DEFAULT 1,
  criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_questoes_disciplina (disciplina),
  INDEX idx_questoes_conteudo (id_conteudo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS tentativas_questoes (
  id_tentativa INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario INT NOT NULL,
  id_questao INT NOT NULL,
  resposta TINYINT UNSIGNED NULL,
  acertou TINYINT(1) NOT NULL DEFAULT 0,
  duracao_segundos INT UNSIGNED NULL,
  criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_tentativas_usuario (id_usuario, criado_em),
  INDEX idx_tentativas_questao (id_questao)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS revisoes_estudo (
  id_revisao INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario INT NOT NULL,
  id_conteudo INT NOT NULL,
  nivel_dominio TINYINT UNSIGNED NOT NULL DEFAULT 0,
  repeticoes INT UNSIGNED NOT NULL DEFAULT 0,
  intervalo_dias INT UNSIGNED NOT NULL DEFAULT 0,
  proxima_revisao DATE NOT NULL,
  ultima_revisao DATETIME NULL,
  ultimo_resultado ENUM('ESQUECI','DIFICIL','LEMBREI','DOMINEI') NULL,
  atualizado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_revisao_usuario_conteudo (id_usuario, id_conteudo),
  INDEX idx_revisoes_fila (id_usuario, proxima_revisao)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS caderno_erros (
  id_erro INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario INT NOT NULL,
  id_questao INT NOT NULL,
  total_erros INT UNSIGNED NOT NULL DEFAULT 1,
  reflexao TEXT NULL,
  resolvido TINYINT(1) NOT NULL DEFAULT 0,
  proxima_tentativa DATE NOT NULL,
  ultimo_erro_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  resolvido_em DATETIME NULL,
  UNIQUE KEY uk_erro_usuario_questao (id_usuario, id_questao),
  INDEX idx_caderno_usuario (id_usuario, resolvido, proxima_tentativa)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS redacao_versoes (
  id_versao INT AUTO_INCREMENT PRIMARY KEY,
  id_redacao INT NOT NULL,
  id_usuario INT NOT NULL,
  numero_versao INT UNSIGNED NOT NULL,
  texto LONGTEXT NOT NULL,
  nota_estimada DECIMAL(6,2) NULL,
  competencias_enem JSON NULL,
  observacao VARCHAR(255) NULL,
  criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_redacao_numero_versao (id_redacao, numero_versao),
  INDEX idx_versoes_usuario (id_usuario, criado_em)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

