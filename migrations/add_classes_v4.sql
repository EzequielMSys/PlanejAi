CREATE TABLE IF NOT EXISTS turmas (
  id_turma INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(160) NOT NULL,
  codigo VARCHAR(24) NOT NULL,
  ano_letivo SMALLINT UNSIGNED NOT NULL,
  descricao TEXT NULL,
  criado_por INT NOT NULL,
  ativa TINYINT(1) NOT NULL DEFAULT 1,
  criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_turma_codigo (codigo),
  CONSTRAINT fk_turma_criador FOREIGN KEY (criado_por) REFERENCES usuarios(id_usuario)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS turma_docentes (id_turma INT NOT NULL,id_docente INT NOT NULL,papel ENUM('RESPONSAVEL','DOCENTE') NOT NULL DEFAULT 'DOCENTE',PRIMARY KEY(id_turma,id_docente),CONSTRAINT fk_td_turma FOREIGN KEY(id_turma) REFERENCES turmas(id_turma) ON DELETE CASCADE,CONSTRAINT fk_td_docente FOREIGN KEY(id_docente) REFERENCES usuarios(id_usuario) ON DELETE CASCADE) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS turma_alunos (id_turma INT NOT NULL,id_aluno INT NOT NULL,matriculado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,ativo TINYINT(1) NOT NULL DEFAULT 1,PRIMARY KEY(id_turma,id_aluno),CONSTRAINT fk_ta_turma FOREIGN KEY(id_turma) REFERENCES turmas(id_turma) ON DELETE CASCADE,CONSTRAINT fk_ta_aluno FOREIGN KEY(id_aluno) REFERENCES usuarios(id_usuario) ON DELETE CASCADE) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS turma_disciplinas (id_turma INT NOT NULL,disciplina VARCHAR(100) NOT NULL,id_docente INT NULL,PRIMARY KEY(id_turma,disciplina),CONSTRAINT fk_tdisc_turma FOREIGN KEY(id_turma) REFERENCES turmas(id_turma) ON DELETE CASCADE,CONSTRAINT fk_tdisc_docente FOREIGN KEY(id_docente) REFERENCES usuarios(id_usuario) ON DELETE SET NULL) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
