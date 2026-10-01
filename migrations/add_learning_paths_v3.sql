CREATE TABLE IF NOT EXISTS competencia_prerequisitos (
  id_competencia INT NOT NULL,
  id_prerequisito INT NOT NULL,
  dominio_minimo TINYINT UNSIGNED NOT NULL DEFAULT 60,
  PRIMARY KEY (id_competencia, id_prerequisito),
  CONSTRAINT fk_cp_competencia FOREIGN KEY (id_competencia) REFERENCES competencias_estudo(id_competencia) ON DELETE CASCADE,
  CONSTRAINT fk_cp_prerequisito FOREIGN KEY (id_prerequisito) REFERENCES competencias_estudo(id_competencia) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS trilhas_aprendizagem (
  id_trilha INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario INT NOT NULL,
  disciplina VARCHAR(100) NOT NULL,
  status ENUM('ATIVA','CONCLUIDA','PAUSADA') NOT NULL DEFAULT 'ATIVA',
  criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_trilha_usuario_disciplina (id_usuario, disciplina),
  CONSTRAINT fk_trilha_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS trilha_etapas (
  id_etapa INT AUTO_INCREMENT PRIMARY KEY,
  id_trilha INT NOT NULL,
  id_competencia INT NOT NULL,
  ordem SMALLINT UNSIGNED NOT NULL,
  status ENUM('BLOQUEADA','DISPONIVEL','EM_PROGRESSO','DOMINADA') NOT NULL DEFAULT 'BLOQUEADA',
  atualizado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_trilha_competencia (id_trilha, id_competencia),
  CONSTRAINT fk_te_trilha FOREIGN KEY (id_trilha) REFERENCES trilhas_aprendizagem(id_trilha) ON DELETE CASCADE,
  CONSTRAINT fk_te_competencia FOREIGN KEY (id_competencia) REFERENCES competencias_estudo(id_competencia) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
