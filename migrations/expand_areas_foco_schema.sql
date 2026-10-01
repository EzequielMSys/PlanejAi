-- Migration: Expand areas_foco to allow more subjects and support the checklist feature
-- Execute: mysql -u [user] -p [database] < expand_areas_foco_schema.sql

-- Areas de foco agora precisa suportar multiplas materias do checklist (incluindo "Outra")
ALTER TABLE perfil_estudo
  MODIFY COLUMN areas_foco VARCHAR(500) NULL;

-- Verify
DESCRIBE perfil_estudo;

