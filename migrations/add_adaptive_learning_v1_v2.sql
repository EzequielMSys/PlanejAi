CREATE TABLE IF NOT EXISTS competencias_estudo (
  id_competencia INT AUTO_INCREMENT PRIMARY KEY,
  disciplina VARCHAR(100) NOT NULL,
  nome VARCHAR(160) NOT NULL,
  descricao TEXT NULL,
  prerequisitos JSON NULL,
  ativo TINYINT(1) NOT NULL DEFAULT 1,
  UNIQUE KEY uk_competencia_disciplina_nome (disciplina, nome)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS dominio_competencias (
  id_usuario INT NOT NULL,
  id_competencia INT NOT NULL,
  dominio TINYINT UNSIGNED NOT NULL DEFAULT 0,
  confianca_media TINYINT UNSIGNED NOT NULL DEFAULT 0,
  evidencias INT UNSIGNED NOT NULL DEFAULT 0,
  acertos INT UNSIGNED NOT NULL DEFAULT 0,
  ultima_pratica DATETIME NULL,
  proxima_pratica DATE NULL,
  atualizado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id_usuario, id_competencia),
  INDEX idx_dominio_prioridade (id_usuario, dominio, proxima_pratica)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS sessoes_guiadas (
  id_sessao_guiada INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario INT NOT NULL,
  id_conteudo INT NULL,
  id_competencia INT NULL,
  objetivo VARCHAR(255) NOT NULL,
  conhecimento_previo TEXT NULL,
  resumo_final TEXT NULL,
  dificuldade_percebida ENUM('BAIXA','MEDIA','ALTA') NULL,
  status ENUM('INICIADA','CONCLUIDA','ABANDONADA') NOT NULL DEFAULT 'INICIADA',
  iniciada_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  concluida_em DATETIME NULL,
  INDEX idx_sessao_guiada_usuario (id_usuario, status, iniciada_em)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS checkins_estudo (
  id_checkin INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario INT NOT NULL,
  energia TINYINT UNSIGNED NOT NULL,
  minutos_disponiveis SMALLINT UNSIGNED NOT NULL,
  formato_preferido ENUM('LEITURA','VIDEO','EXERCICIOS','REVISAO') NOT NULL,
  materia_evitada VARCHAR(100) NULL,
  criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_checkin_usuario_data (id_usuario, criado_em)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS rotinas_estudo (
  id_rotina INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario INT NOT NULL,
  nome VARCHAR(100) NOT NULL,
  configuracao JSON NOT NULL,
  ativa TINYINT(1) NOT NULL DEFAULT 0,
  criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_rotina_usuario_nome (id_usuario, nome)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS missoes_estudo (
  id_missao INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario INT NOT NULL,
  tipo ENUM('REVISOES','QUESTOES','ERROS','MINUTOS','COMPETENCIA') NOT NULL,
  titulo VARCHAR(180) NOT NULL,
  alvo INT UNSIGNED NOT NULL,
  progresso INT UNSIGNED NOT NULL DEFAULT 0,
  expira_em DATETIME NOT NULL,
  concluida_em DATETIME NULL,
  criada_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_missao_usuario (id_usuario, concluida_em, expira_em)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

ALTER TABLE tentativas_questoes
  ADD COLUMN IF NOT EXISTS confianca ENUM('CHUTEI','DUVIDA','CERTEZA') NULL,
  ADD COLUMN IF NOT EXISTS pistas_usadas TINYINT UNSIGNED NOT NULL DEFAULT 0;

ALTER TABLE caderno_erros
  ADD COLUMN IF NOT EXISTS tipo_erro ENUM('CONCEITO','INTERPRETACAO','CALCULO','DISTRACAO','NAO_CLASSIFICADO') NOT NULL DEFAULT 'NAO_CLASSIFICADO',
  ADD COLUMN IF NOT EXISTS como_evitar TEXT NULL;
