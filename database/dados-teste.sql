-- ============================================
-- DADOS DE TESTE - Sistema de Ponto
-- Execute isso no SQL Editor do Supabase
-- ============================================

-- 1. INSERIR FUNCIONÁRIOS DE TESTE
INSERT INTO funcionarios (nome, pin, role, ativo) VALUES
    ('João Silva', '1234', 'funcionario', true),
    ('Maria Santos', '5678', 'funcionario', true),
    ('Pedro Costa', '9012', 'funcionario', true),
    ('Ana Oliveira', '3456', 'funcionario', true);

-- 2. INSERIR REGISTROS DE PONTO DE EXEMPLO

-- Registros de João (hoje)
INSERT INTO registros_ponto (funcionario_id, data, entrada, saida, total_horas) 
SELECT 
    id,
    CURRENT_DATE,
    timezone('America/Sao_Paulo', CURRENT_TIMESTAMP - INTERVAL '8 hours'),
    timezone('America/Sao_Paulo', CURRENT_TIMESTAMP - INTERVAL '2 hours'),
    6.0
FROM funcionarios WHERE nome = 'João Silva';

-- Registros de Maria (hoje)
INSERT INTO registros_ponto (funcionario_id, data, entrada, saida) 
SELECT 
    id,
    CURRENT_DATE,
    timezone('America/Sao_Paulo', CURRENT_TIMESTAMP - INTERVAL '6 hours'),
    NULL  -- Ainda está trabalhando
FROM funcionarios WHERE nome = 'Maria Santos';

-- Registros de Pedro (ontem)
INSERT INTO registros_ponto (funcionario_id, data, entrada, saida, total_horas) 
SELECT 
    id,
    CURRENT_DATE - INTERVAL '1 day',
    timezone('America/Sao_Paulo', (CURRENT_DATE - INTERVAL '1 day') + TIME '18:00:00'),
    timezone('America/Sao_Paulo', (CURRENT_DATE - INTERVAL '1 day') + TIME '23:30:00'),
    5.5
FROM funcionarios WHERE nome = 'Pedro Costa';

-- Registros de Ana (semana passada)
INSERT INTO registros_ponto (funcionario_id, data, entrada, saida, total_horas) 
SELECT 
    id,
    CURRENT_DATE - INTERVAL '7 days',
    timezone('America/Sao_Paulo', (CURRENT_DATE - INTERVAL '7 days') + TIME '17:00:00'),
    timezone('America/Sao_Paulo', (CURRENT_DATE - INTERVAL '7 days') + TIME '22:00:00'),
    5.0
FROM funcionarios WHERE nome = 'Ana Oliveira';

-- 3. VERIFICAR DADOS INSERIDOS
SELECT 
    f.nome,
    r.data,
    TO_CHAR(r.entrada, 'HH24:MI') as entrada,
    TO_CHAR(r.saida, 'HH24:MI') as saida,
    r.total_horas
FROM registros_ponto r
JOIN funcionarios f ON r.funcionario_id = f.id
ORDER BY r.data DESC, f.nome;
