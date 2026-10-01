CREATE TABLE IF NOT EXISTS limites_requisicao (
  escopo VARCHAR(40) NOT NULL,
  chave_hash CHAR(64) NOT NULL,
  janela_inicio DATETIME NOT NULL,
  tentativas SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  atualizado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (escopo, chave_hash, janela_inicio),
  INDEX idx_limites_expiracao (janela_inicio)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
