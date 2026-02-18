-- =============================================================================
-- SCRIPT DE REVERSÃO (UNDO) - REMOVER SISTEMA DE AUDITORIA
-- Use APENAS se a aplicação do script de correção causar um problema inesperado.
-- =============================================================================

BEGIN;

-- 1. REMOVE OS GATILHOS DAS TABELAS
-- É uma boa prática remover explicitamente, embora o passo 2 já fizesse isso com CASCADE.
DROP TRIGGER IF EXISTS audit_trigger ON public.work_orders;
DROP TRIGGER IF EXISTS audit_trigger ON public.equipments;
DROP TRIGGER IF EXISTS audit_trigger ON public.maintenance_plans;

-- 2. REMOVE A FUNÇÃO DE GATILHO
-- O 'CASCADE' garante que qualquer dependência (como os triggers acima) seja removida junto.
DROP FUNCTION IF EXISTS log_activity_trigger_func() CASCADE;

-- 3. REMOVE A TABELA DE LOG
DROP TABLE IF EXISTS public.activity_log;

COMMIT;

SELECT 'Sistema de auditoria removido com sucesso. O banco de dados voltou ao estado anterior à instalação do log.';