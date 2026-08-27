CREATE TABLE IF NOT EXISTS projetos_redacao (
  id_projeto INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario INT NOT NULL,
  tema VARCHAR(500) NOT NULL,
  tese TEXT NULL,
  argumento_um TEXT NULL,
  argumento_dois TEXT NULL,
  repertorio TEXT NULL,
  intervencao TEXT NULL,
  rascunho LONGTEXT NULL,
  etapa ENUM('TEMA','TESE','ARGUMENTOS','REPERTORIO','INTERVENCAO','RASCUNHO','REVISAO','CONCLUIDO') NOT NULL DEFAULT 'TEMA',
  id_redacao INT NULL,
  criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_projeto_usuario (id_usuario, etapa, atualizado_em)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS intervencoes_pedagogicas (
  id_intervencao INT AUTO_INCREMENT PRIMARY KEY,
  id_aluno INT NOT NULL,
  criado_por INT NOT NULL,
  tipo ENUM('ORIENTACAO','PLANO_REVISAO','CONTATO','ATIVIDADE','ACOMPANHAMENTO') NOT NULL,
  motivo VARCHAR(255) NOT NULL,
  plano TEXT NOT NULL,
  status ENUM('ABERTA','EM_ACOMPANHAMENTO','CONCLUIDA') NOT NULL DEFAULT 'ABERTA',
  retorno_em DATE NULL,
  criada_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  concluida_em DATETIME NULL,
  INDEX idx_intervencao_aluno (id_aluno, status, retorno_em)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS grupos_dinamicos (
  id_grupo INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(160) NOT NULL,
  disciplina VARCHAR(100) NOT NULL,
  competencia VARCHAR(160) NULL,
  objetivo TEXT NOT NULL,
  criado_por INT NOT NULL,
  ativo TINYINT(1) NOT NULL DEFAULT 1,
  criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS grupos_dinamicos_membros (
  id_grupo INT NOT NULL,
  id_usuario INT NOT NULL,
  papel ENUM('APRENDIZ','MENTOR_PAR') NOT NULL DEFAULT 'APRENDIZ',
  PRIMARY KEY (id_grupo, id_usuario)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS revisoes_pares (
  id_revisao_par INT AUTO_INCREMENT PRIMARY KEY,
  id_redacao INT NOT NULL,
  id_autor INT NOT NULL,
  id_revisor INT NOT NULL,
  pontos_fortes TEXT NULL,
  sugestao_principal TEXT NULL,
  criterio_foco ENUM('TESE','ARGUMENTACAO','COESAO','INTERVENCAO','GERAL') NOT NULL DEFAULT 'GERAL',
  status ENUM('PENDENTE','CONCLUIDA','CANCELADA') NOT NULL DEFAULT 'PENDENTE',
  criada_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  concluida_em DATETIME NULL,
  UNIQUE KEY uk_revisao_redacao_revisor (id_redacao, id_revisor),
  INDEX idx_revisao_revisor (id_revisor, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS sessoes_colaborativas (
  id_sessao INT AUTO_INCREMENT PRIMARY KEY,
  id_grupo INT NOT NULL,
  titulo VARCHAR(180) NOT NULL,
  objetivo TEXT NOT NULL,
  inicio_em DATETIME NOT NULL,
  duracao_minutos SMALLINT UNSIGNED NOT NULL DEFAULT 30,
  status ENUM('AGENDADA','ATIVA','CONCLUIDA','CANCELADA') NOT NULL DEFAULT 'AGENDADA',
  criada_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_sessao_grupo (id_grupo, inicio_em)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
