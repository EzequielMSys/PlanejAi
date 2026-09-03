-- Atividades 2.0: versões, banco de questões e progresso de respostas.
ALTER TABLE atividades
  ADD COLUMN IF NOT EXISTS versao INT UNSIGNED NOT NULL DEFAULT 1 AFTER questoes,
  ADD COLUMN IF NOT EXISTS rubrica JSON NULL AFTER versao,
  ADD COLUMN IF NOT EXISTS publicar_em DATETIME NULL AFTER rubrica,
  ADD COLUMN IF NOT EXISTS permite_reenvio TINYINT(1) NOT NULL DEFAULT 0 AFTER publicar_em;

ALTER TABLE respostas_usuario
  ADD COLUMN IF NOT EXISTS correcao_detalhes JSON NULL AFTER feedback,
  ADD COLUMN IF NOT EXISTS rascunho_salvo_em DATETIME NULL AFTER atualizado_em;

CREATE TABLE IF NOT EXISTS atividade_versoes (
  id_versao BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  id_atividade INT NOT NULL,
  numero_versao INT UNSIGNED NOT NULL,
  conteudo JSON NOT NULL,
  alterado_por INT NULL,
  criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_atividade_numero_versao (id_atividade, numero_versao),
  INDEX idx_atividade_versoes_data (id_atividade, criado_em),
  CONSTRAINT fk_atividade_versao_atividade FOREIGN KEY (id_atividade) REFERENCES atividades(id_atividade) ON DELETE CASCADE,
  CONSTRAINT fk_atividade_versao_usuario FOREIGN KEY (alterado_por) REFERENCES usuarios(id_usuario) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS banco_questoes_atividade (
  id_questao_banco BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  criado_por INT NOT NULL,
  titulo VARCHAR(180) NULL,
  enunciado TEXT NOT NULL,
  tipo VARCHAR(40) NOT NULL,
  disciplina VARCHAR(100) NULL,
  dificuldade ENUM('FACIL','MEDIA','DIFICIL') NOT NULL DEFAULT 'MEDIA',
  dados JSON NOT NULL,
  tags JSON NULL,
  visibilidade ENUM('PRIVADA','PLATAFORMA') NOT NULL DEFAULT 'PRIVADA',
  usos INT UNSIGNED NOT NULL DEFAULT 0,
  criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_banco_questoes_autor (criado_por, atualizado_em),
  INDEX idx_banco_questoes_busca (disciplina, dificuldade, tipo),
  CONSTRAINT fk_banco_questoes_autor FOREIGN KEY (criado_por) REFERENCES usuarios(id_usuario) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
