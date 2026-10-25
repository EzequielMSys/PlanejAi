-- Registros privados e versões imutáveis. Reaplicar é seguro.
CREATE TABLE IF NOT EXISTS diario_aprendizagem (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario INT NOT NULL,
  id_conteudo INT NULL,
  tipo ENUM('explicacao','duvida') NOT NULL,
  titulo VARCHAR(160) NOT NULL,
  resolvido TINYINT NOT NULL DEFAULT 0,
  criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_diario_owner (id_usuario,tipo,atualizado_em,id),
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  FOREIGN KEY (id_conteudo) REFERENCES conteudos(id_conteudo) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS diario_passos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_diario INT NOT NULL,
  id_usuario INT NOT NULL,
  tipo ENUM('explicacao','anotacao','exemplo','tentativa','resolucao','reabertura') NOT NULL,
  texto TEXT NOT NULL,
  chave VARCHAR(80) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  hash_payload CHAR(64) CHARACTER SET ascii NOT NULL,
  criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_diario_request (id_usuario,chave),
  INDEX idx_diario_passos (id_diario,id),
  FOREIGN KEY (id_diario) REFERENCES diario_aprendizagem(id) ON DELETE CASCADE,
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS diario_lumi_uso (
  id_usuario INT NOT NULL,
  dia DATE NOT NULL,
  total INT NOT NULL DEFAULT 0,
  PRIMARY KEY (id_usuario,dia),
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
