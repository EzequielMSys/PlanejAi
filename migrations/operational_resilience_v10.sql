CREATE TABLE IF NOT EXISTS auditoria_api (
  id_auditoria BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  id_usuario INT NULL,
  metodo VARCHAR(10) NOT NULL,
  rota VARCHAR(255) NOT NULL,
  status_http SMALLINT UNSIGNED NOT NULL,
  request_id VARCHAR(100) NULL,
  ip_hash CHAR(64) NULL,
  duracao_ms INT UNSIGNED NOT NULL DEFAULT 0,
  criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_auditoria_data (criado_em),
  INDEX idx_auditoria_usuario_data (id_usuario, criado_em),
  CONSTRAINT fk_auditoria_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS idempotencia_api (
  chave VARCHAR(100) NOT NULL,
  id_usuario INT NOT NULL,
  operacao VARCHAR(100) NOT NULL,
  status ENUM('PROCESSANDO','CONCLUIDA','FALHOU') NOT NULL DEFAULT 'PROCESSANDO',
  codigo_http SMALLINT UNSIGNED NULL,
  resposta JSON NULL,
  criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expira_em DATETIME NOT NULL,
  PRIMARY KEY (chave, id_usuario, operacao),
  INDEX idx_idempotencia_expira (expira_em),
  CONSTRAINT fk_idempotencia_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_usuarios_status_tipo_data ON usuarios (ativo, tipo, data_cadastro);
CREATE INDEX idx_cronogramas_perfil_status_data ON cronogramas (id_perfil, status, criado_em);
CREATE INDEX idx_cronograma_dias_cronograma_data ON cronograma_dias (id_cronograma, data_estudo);
CREATE INDEX idx_cronograma_conteudos_dia_status ON cronograma_conteudos (id_dia, concluido);
CREATE INDEX idx_respostas_usuario_data ON respostas_usuario (id_usuario, respondido_em);
CREATE INDEX idx_redacoes_usuario_data ON redacoes (id_usuario, enviada_em);
