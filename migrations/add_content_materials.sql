-- Links complementares para cada conteúdo: vídeo direto, PDF, imagem ou site.
ALTER TABLE conteudos
  ADD COLUMN materiais JSON NULL AFTER link,
  ADD COLUMN atualizado_por INT NULL AFTER materiais,
  ADD COLUMN atualizado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER atualizado_por,
  ADD CONSTRAINT fk_conteudos_atualizado_por FOREIGN KEY (atualizado_por) REFERENCES usuarios(id_usuario) ON DELETE SET NULL;
