CREATE TABLE IF NOT EXISTS cronograma_avaliacoes (
  id_avaliacao INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario INT NOT NULL,
  id_cronograma INT NOT NULL,
  id_dia INT NULL,
  tipo ENUM('ADIANTAMENTO','FINAL') NOT NULL,
  status ENUM('EM_ANDAMENTO','APROVADA','REPROVADA','EXPIRADA') NOT NULL DEFAULT 'EM_ANDAMENTO',
  questoes JSON NOT NULL,
  total_questoes TINYINT UNSIGNED NOT NULL,
  minimo_acertos TINYINT UNSIGNED NOT NULL,
  acertos TINYINT UNSIGNED NULL,
  percentual TINYINT UNSIGNED NULL,
  iniciado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  finalizado_em DATETIME NULL,
  INDEX idx_avaliacao_usuario (id_usuario, id_cronograma, tipo, status),
  INDEX idx_avaliacao_dia (id_dia, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
