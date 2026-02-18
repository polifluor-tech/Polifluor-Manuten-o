-- =============================================================================
-- SCRIPT DE CORREÇÃO E AUDITORIA - SGMI 2.0
-- Cria a infraestrutura no banco de dados para rastrear ações dos usuários.
-- =============================================================================

BEGIN;

-- 1. CRIAÇÃO DA TABELA DE LOG
CREATE TABLE IF NOT EXISTS public.activity_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_email TEXT,
    action TEXT NOT NULL, -- Ex: 'INSERT', 'UPDATE', 'DELETE'
    table_name TEXT NOT NULL,
    record_id TEXT,
    description TEXT NOT NULL
);

-- Habilita RLS para segurança
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow admin read access" ON public.activity_log;
CREATE POLICY "Allow admin read access"
ON public.activity_log
FOR SELECT
USING (auth.role() = 'authenticated');


-- 2. CRIAÇÃO DA FUNÇÃO DE GATILHO GENÉRICA
CREATE OR REPLACE FUNCTION log_activity_trigger_func()
RETURNS TRIGGER AS $$
DECLARE
    user_email_var TEXT;
    description_var TEXT;
    record_id_var TEXT;
BEGIN
    -- Captura o e-mail do usuário autenticado via JWT
    user_email_var := auth.jwt()->>'email';

    -- Define o ID do registro sendo modificado
    IF (TG_OP = 'DELETE') THEN
        record_id_var := OLD.id;
    ELSE
        record_id_var := NEW.id;
    END IF;

    -- Constrói a descrição da ação
    IF (TG_OP = 'INSERT') THEN
        description_var := 'CRIOU o registro em "' || TG_TABLE_NAME || '" com ID: #' || record_id_var;
    ELSIF (TG_OP = 'DELETE') THEN
        description_var := 'DELETOU PERMANENTEMENTE o registro de "' || TG_TABLE_NAME || '" com ID: #' || record_id_var;
    ELSIF (TG_OP = 'UPDATE') THEN
        -- Lógica especial para SOFT DELETE
        IF NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
            description_var := 'MOVEU PARA LIXEIRA o registro de "' || TG_TABLE_NAME || '" com ID: #' || record_id_var;
        ELSE
            description_var := 'ATUALIZOU o registro em "' || TG_TABLE_NAME || '" com ID: #' || record_id_var;
        END IF;
    END IF;

    -- Insere o registro na tabela de log
    INSERT INTO public.activity_log (user_email, action, table_name, record_id, description)
    VALUES (user_email_var, TG_OP, TG_TABLE_NAME, record_id_var, description_var);

    -- Retorna o registro modificado para a operação continuar
    IF (TG_OP = 'DELETE') THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 3. ATIVAÇÃO DOS GATILHOS NAS TABELAS PRINCIPAIS

-- Limpa gatilhos antigos para evitar duplicação
DROP TRIGGER IF EXISTS audit_trigger ON public.work_orders;
DROP TRIGGER IF EXISTS audit_trigger ON public.equipments;
DROP TRIGGER IF EXISTS audit_trigger ON public.maintenance_plans;

-- Tabela de Ordens de Serviço
CREATE TRIGGER audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.work_orders
FOR EACH ROW EXECUTE FUNCTION log_activity_trigger_func();

-- Tabela de Equipamentos
CREATE TRIGGER audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.equipments
FOR EACH ROW EXECUTE FUNCTION log_activity_trigger_func();

-- Tabela de Planos de Manutenção
CREATE TRIGGER audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.maintenance_plans
FOR EACH ROW EXECUTE FUNCTION log_activity_trigger_func();

COMMIT;

SELECT 'Sistema de Auditoria e Log de Atividades implementado com sucesso!';