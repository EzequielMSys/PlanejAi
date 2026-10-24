-- Só remove a coluna sem uso se não houver datas preenchidas.
SET @dob_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'usuarios' AND COLUMN_NAME = 'data_nascimento');
SET @dob_sql = IF(@dob_exists > 0, 'SELECT COUNT(*) INTO @dob_values FROM usuarios WHERE data_nascimento IS NOT NULL', 'SET @dob_values = 0');
PREPARE dob_statement FROM @dob_sql;
EXECUTE dob_statement;
DEALLOCATE PREPARE dob_statement;
SET @dob_sql = IF(@dob_exists > 0 AND @dob_values = 0, 'ALTER TABLE usuarios DROP COLUMN data_nascimento', 'SELECT 1');
PREPARE dob_statement FROM @dob_sql;
EXECUTE dob_statement;
DEALLOCATE PREPARE dob_statement;
