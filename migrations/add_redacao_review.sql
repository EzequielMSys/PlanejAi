-- Migration: adicionar suporte a avaliação manual (admin/dono) e análise avançada de redação

ALTER TABLE `redacoes`
  ADD COLUMN `nota_manual` decimal(4,2) DEFAULT NULL AFTER `feedback_ia`,
  ADD COLUMN `feedback_manual` text DEFAULT NULL AFTER `nota_manual`,
  ADD COLUMN `avaliado_por` int(11) DEFAULT NULL AFTER `feedback_manual`,
  ADD COLUMN `erros_texto` text DEFAULT NULL AFTER `avaliado_por`,
  ADD COLUMN `sugestoes` text DEFAULT NULL AFTER `erros_texto`,
  ADD COLUMN `flag_ia` tinyint(1) DEFAULT 0 AFTER `sugestoes`;
