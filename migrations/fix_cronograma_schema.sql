-- Migration: Fix schema mismatches that break cronogram generation and day completion
-- Execute: mysql -u [user] -p [database] < fix_cronograma_schema.sql

-- 1. prazo_estimado is used as number of days in the code, but stored as DATE in DB.
--    Alter to INT so it can store the day count correctly.
ALTER TABLE perfil_estudo
  MODIFY COLUMN prazo_estimado INT NULL;

-- 2. cronograma_dias is missing the 'concluido' column used by the code and frontend.
ALTER TABLE cronograma_dias
  ADD COLUMN IF NOT EXISTS concluido TINYINT(1) NOT NULL DEFAULT 0;

-- 3. cronogramas.status enum already has proper uppercase values; ensure any
--    legacy lowercase data is normalized.
UPDATE cronogramas SET status = 'ATIVO' WHERE status = 'ativo';
UPDATE cronogramas SET status = 'CONCLUIDO' WHERE status = 'concluído' OR status = 'concluido';
UPDATE cronogramas SET status = 'CANCELADO' WHERE status = 'cancelado' OR status = 'arquivado';

-- Verify
DESCRIBE perfil_estudo;
DESCRIBE cronograma_dias;
