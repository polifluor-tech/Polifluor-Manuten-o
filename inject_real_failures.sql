
-- =============================================================================
-- SCRIPT DE "CHOQUE DE REALIDADE" - GERAR KPIs REAIS
-- Objetivo: Converter algumas Preventivas em Corretivas e aumentar o tempo de parada
-- para que os indicadores MTBF, MTTR e Disponibilidade saiam de 100% / 0.
-- =============================================================================

BEGIN;

-- 1. TRANSFORMAR OS #0127 (PH-15 - Prensa) EM QUEBRA REAL
-- Cenário: Vazamento no pistão parou a máquina por 4 horas e meia.
UPDATE public.work_orders
SET 
    type = 'Corretiva',
    corrective_category = 'Hidráulica',
    description = '[QUEBRA] Vazamento grave no pistão principal - Parada de emergência',
    start_date_execution = '2026-01-07 13:00:00',
    end_date = '2026-01-07 17:30:00', -- 4.5 horas de parada
    machine_stopped = true,
    man_hours = '[{"maintainer": "Darci", "hours": 4.5}]'::jsonb
WHERE id = '0127';

-- 2. TRANSFORMAR OS #0043 (EX-02 - Extrusora) EM FALHA ELÉTRICA
-- Cenário: Curto na resistência parou a máquina por 3 horas.
UPDATE public.work_orders
SET 
    type = 'Corretiva',
    corrective_category = 'Elétrica',
    description = '[FALHA] Curto circuito na zona de aquecimento 2',
    start_date_execution = '2026-01-08 13:00:00',
    end_date = '2026-01-08 16:00:00', -- 3.0 horas de parada
    machine_stopped = true,
    man_hours = '[{"maintainer": "Equipe Interna", "hours": 3.0}]'::jsonb
WHERE id = '0043';

-- 3. TRANSFORMAR OS #0303 (AEX-02 - Extrusora PA) EM FALHA MECÂNICA
-- Cenário: Quebra do rolamento do motor.
UPDATE public.work_orders
SET 
    type = 'Corretiva',
    corrective_category = 'Mecânica',
    description = '[QUEBRA] Travamento do rolamento do motor principal',
    start_date_execution = '2026-01-08 08:00:00',
    end_date = '2026-01-08 14:00:00', -- 6.0 horas de parada
    machine_stopped = true,
    man_hours = '[{"maintainer": "Sergio", "hours": 6.0}]'::jsonb
WHERE id = '0303';

COMMIT;

SELECT 'Dados atualizados! 3 Ordens transformadas em Corretivas com tempos de parada reais. Verifique o Dashboard agora.';
