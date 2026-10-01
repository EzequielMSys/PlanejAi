CREATE TABLE IF NOT EXISTS sessoes_estudo (
  id_sessao INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario INT NOT NULL,
  id_conteudo INT NULL,
  duracao_minutos SMALLINT UNSIGNED NOT NULL,
  resultado ENUM('DIFICIL','LEMBREI','DOMINEI') NULL,
  concluida_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_sessoes_usuario_data (id_usuario, concluida_em),
  INDEX idx_sessoes_conteudo (id_conteudo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS metas_semanais_estudo (
  id_usuario INT PRIMARY KEY,
  minutos_meta SMALLINT UNSIGNED NOT NULL DEFAULT 180,
  atualizado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
