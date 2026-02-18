-- SCRIPT DE MIGRAÇÃO: ADICIONAR STATUS AOS TIPOS DE EQUIPAMENTO
-- Objetivo: Permitir desativar tipos de equipamentos obsoletos sem apagar o histórico.

BEGIN;

-- 1. Adiciona a coluna 'active' com padrão TRUE (Ativo)
ALTER TABLE public.equipment_types 
ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true;

-- 2. Atualiza registros existentes para garantir que não sejam nulos
UPDATE public.equipment_types SET active = true WHERE active IS NULL;

COMMIT;

SELECT 'Coluna "active" adicionada à tabela equipment_types com sucesso.';