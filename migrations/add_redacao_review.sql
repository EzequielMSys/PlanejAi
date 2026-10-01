-- Migration: adicionar suporte a avaliação manual (admin/dono) e análise avançada de redação

ALTER TABLE `redacoes`
  ADD COLUMN IF NOT EXISTS `nota_manual` decimal(6,2) DEFAULT NULL AFTER `feedback_ia`,
  ADD COLUMN IF NOT EXISTS `feedback_manual` text DEFAULT NULL AFTER `nota_manual`,
  ADD COLUMN IF NOT EXISTS `avaliado_por` int(11) DEFAULT NULL AFTER `feedback_manual`,
  ADD COLUMN IF NOT EXISTS `erros_texto` text DEFAULT NULL AFTER `avaliado_por`,
  ADD COLUMN IF NOT EXISTS `sugestoes` text DEFAULT NULL AFTER `erros_texto`,
  ADD COLUMN IF NOT EXISTS `flag_ia` tinyint(1) DEFAULT 0 AFTER `sugestoes`;
