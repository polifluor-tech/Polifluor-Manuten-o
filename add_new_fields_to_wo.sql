-- =============================================================================
-- SCRIPT DE EVOLUÇÃO: ADIÇÃO DE CAMPOS ESTRUTURADOS PARA CORRETIVAS
-- Adiciona colunas para data da falha, empresa externa e anexo de imagem.
-- =============================================================================

BEGIN;

-- Adiciona a coluna para armazenar a data/hora exata da falha
ALTER TABLE public.work_orders
ADD COLUMN IF NOT EXISTS failure_date TIMESTAMP WITH TIME ZONE;

-- Adiciona a coluna para o nome da empresa terceirizada
ALTER TABLE public.work_orders
ADD COLUMN IF NOT EXISTS external_company TEXT;

-- Adiciona a coluna para armazenar a imagem do problema em Base64
ALTER TABLE public.work_orders
ADD COLUMN IF NOT EXISTS image_base64 TEXT;

COMMIT;

SELECT 'Tabela "work_orders" atualizada com sucesso com os campos: failure_date, external_company, image_base64.';