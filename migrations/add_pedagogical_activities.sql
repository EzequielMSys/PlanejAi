-- Atividades pedagógicas: criação por docentes, questões, entregas e correção.
-- Execute uma vez no banco antes de usar os novos endpoints.
ALTER TABLE atividades
  ADD COLUMN IF NOT EXISTS titulo VARCHAR(180) NULL AFTER id_conteudo,
  ADD COLUMN IF NOT EXISTS descricao TEXT NULL AFTER titulo,
  ADD COLUMN IF NOT EXISTS criado_por INT NULL AFTER resposta_correta,
  ADD COLUMN IF NOT EXISTS prazo DATETIME NULL AFTER criado_por,
  ADD COLUMN IF NOT EXISTS status ENUM('RASCUNHO', 'PUBLICADA', 'ARQUIVADA') NOT NULL DEFAULT 'RASCUNHO' AFTER prazo,
  ADD COLUMN IF NOT EXISTS anexos JSON NULL AFTER status,
  ADD COLUMN IF NOT EXISTS questoes JSON NULL AFTER anexos,
  ADD COLUMN IF NOT EXISTS atualizado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER questoes,
  ADD CONSTRAINT fk_atividades_criado_por FOREIGN KEY (criado_por) REFERENCES usuarios(id_usuario) ON DELETE SET NULL;

ALTER TABLE respostas_usuario
  ADD COLUMN IF NOT EXISTS status ENUM('RASCUNHO', 'ENTREGUE', 'CORRIGIDA') NOT NULL DEFAULT 'ENTREGUE' AFTER correta,
  ADD COLUMN IF NOT EXISTS nota DECIMAL(6,2) NULL AFTER status,
  ADD COLUMN IF NOT EXISTS feedback TEXT NULL AFTER nota,
  ADD COLUMN IF NOT EXISTS corrigido_por INT NULL AFTER feedback,
  ADD COLUMN IF NOT EXISTS corrigido_em DATETIME NULL AFTER corrigido_por,
  ADD COLUMN IF NOT EXISTS atualizado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER respondido_em,
  ADD CONSTRAINT fk_respostas_corrigido_por FOREIGN KEY (corrigido_por) REFERENCES usuarios(id_usuario) ON DELETE SET NULL;

CREATE INDEX idx_atividades_status_prazo ON atividades(status, prazo);
CREATE INDEX idx_respostas_atividade_usuario ON respostas_usuario(id_atividade, id_usuario);
