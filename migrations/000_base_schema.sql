CREATE TABLE IF NOT EXISTS usuarios (
  id_usuario INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(150) NOT NULL,
  email VARCHAR(150) NOT NULL,
  senha VARCHAR(255) NOT NULL,
  data_nascimento DATE NULL,
  data_cadastro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  tipo ENUM('dono','admin','docente','aluno') NOT NULL DEFAULT 'aluno',
  UNIQUE KEY unique_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS conteudos (
  id_conteudo INT AUTO_INCREMENT PRIMARY KEY,
  area VARCHAR(100) NULL,
  disciplina VARCHAR(100) NULL,
  titulo VARCHAR(180) NOT NULL,
  tipo ENUM('VIDEO','PDF','LIVRO','ARTIGO') NULL,
  link TEXT NULL,
  nivel ENUM('BASICO','INTERMEDIARIO','AVANCADO') NULL,
  INDEX idx_conteudos_disciplina (disciplina)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS perfil_estudo (
  id_perfil INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario INT NOT NULL,
  ano_escolar VARCHAR(50) NULL,
  objetivo VARCHAR(255) NULL,
  areas_foco VARCHAR(500) NULL,
  tempo_diario_min INT NULL,
  prazo_estimado INT NULL,
  criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_perfil_usuario (id_usuario),
  CONSTRAINT fk_perfil_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS disponibilidade_semana (
  id_disponibilidade INT AUTO_INCREMENT PRIMARY KEY,
  id_perfil INT NOT NULL,
  dia_semana VARCHAR(20) NOT NULL,
  hora_inicio TIME NULL,
  hora_fim TIME NULL,
  ocupado TINYINT(1) NOT NULL DEFAULT 0,
  CONSTRAINT fk_disponibilidade_perfil FOREIGN KEY (id_perfil) REFERENCES perfil_estudo(id_perfil) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS cronogramas (
  id_cronograma INT AUTO_INCREMENT PRIMARY KEY,
  id_perfil INT NOT NULL,
  data_inicio DATE NOT NULL,
  data_fim DATE NULL,
  status ENUM('ATIVO','CONCLUIDO','CANCELADO') NOT NULL DEFAULT 'ATIVO',
  criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_cronograma_perfil FOREIGN KEY (id_perfil) REFERENCES perfil_estudo(id_perfil) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS cronograma_dias (
  id_dia INT AUTO_INCREMENT PRIMARY KEY,
  id_cronograma INT NOT NULL,
  data_estudo DATE NOT NULL,
  tempo_previsto INT NULL,
  concluido TINYINT(1) NOT NULL DEFAULT 0,
  CONSTRAINT fk_dia_cronograma FOREIGN KEY (id_cronograma) REFERENCES cronogramas(id_cronograma) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS cronograma_conteudos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_dia INT NOT NULL,
  id_conteudo INT NOT NULL,
  concluido TINYINT(1) NOT NULL DEFAULT 0,
  CONSTRAINT fk_cronograma_conteudo_dia FOREIGN KEY (id_dia) REFERENCES cronograma_dias(id_dia) ON DELETE CASCADE,
  CONSTRAINT fk_cronograma_conteudo_item FOREIGN KEY (id_conteudo) REFERENCES conteudos(id_conteudo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS atividades (
  id_atividade INT AUTO_INCREMENT PRIMARY KEY,
  id_conteudo INT NULL,
  pergunta TEXT NULL,
  tipo ENUM('OBJETIVA','DISSERTATIVA') NULL,
  resposta_correta TEXT NULL,
  CONSTRAINT fk_atividade_conteudo FOREIGN KEY (id_conteudo) REFERENCES conteudos(id_conteudo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS respostas_usuario (
  id_resposta INT AUTO_INCREMENT PRIMARY KEY,
  id_atividade INT NOT NULL,
  id_usuario INT NOT NULL,
  resposta TEXT NULL,
  correta TINYINT(1) NULL,
  respondido_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_resposta_atividade FOREIGN KEY (id_atividade) REFERENCES atividades(id_atividade) ON DELETE CASCADE,
  CONSTRAINT fk_resposta_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS redacoes (
  id_redacao INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario INT NOT NULL,
  tema VARCHAR(255) NOT NULL,
  texto LONGTEXT NOT NULL,
  nota_estimada DECIMAL(6,2) NULL,
  feedback_ia LONGTEXT NULL,
  enviada_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_redacao_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
