-- ==========================================
-- DADOS DE SIMULAÇÃO - FUNCIONÁRIO TESTE
-- ==========================================

-- 1. Criar funcionário teste
INSERT INTO funcionarios (nome, pin, valor_hora, role, ativo)
VALUES ('Vitor Teste', '1111', 16.00, 'funcionario', true)
ON CONFLICT DO NOTHING;

-- Pegar o ID do funcionário (substitua XXXXX pelo ID real após executar)
-- Ou execute cada INSERT separadamente e veja o ID retornado

-- 2. Registros do FIM DE SEMANA 1 (Janeiro 2-5, 2026)
-- Quinta-feira, 2 de Janeiro de 2026
INSERT INTO registros_ponto (funcionario_id, data, entrada, saida, total_horas, pago, data_pagamento)
SELECT id, '2026-01-02', '2026-01-02 18:30:00-03', '2026-01-02 23:00:00-03', 4.5, false, NULL
FROM funcionarios WHERE nome = 'Vitor Teste';

-- Sexta-feira, 3 de Janeiro de 2026
INSERT INTO registros_ponto (funcionario_id, data, entrada, saida, total_horas, pago, data_pagamento)
SELECT id, '2026-01-03', '2026-01-03 18:30:00-03', '2026-01-03 23:00:00-03', 4.5, false, NULL
FROM funcionarios WHERE nome = 'Vitor Teste';

-- Sábado, 4 de Janeiro de 2026
INSERT INTO registros_ponto (funcionario_id, data, entrada, saida, total_horas, pago, data_pagamento)
SELECT id, '2026-01-04', '2026-01-04 18:30:00-03', '2026-01-04 23:00:00-03', 4.5, false, NULL
FROM funcionarios WHERE nome = 'Vitor Teste';

-- Domingo, 5 de Janeiro de 2026
INSERT INTO registros_ponto (funcionario_id, data, entrada, saida, total_horas, pago, data_pagamento)
SELECT id, '2026-01-05', '2026-01-05 18:30:00-03', '2026-01-05 23:00:00-03', 4.5, false, NULL
FROM funcionarios WHERE nome = 'Vitor Teste';

-- 3. Registros do FIM DE SEMANA 2 (Janeiro 9-12, 2026)
-- Quinta-feira, 9 de Janeiro de 2026
INSERT INTO registros_ponto (funcionario_id, data, entrada, saida, total_horas, pago, data_pagamento)
SELECT id, '2026-01-09', '2026-01-09 18:30:00-03', '2026-01-09 23:00:00-03', 4.5, false, NULL
FROM funcionarios WHERE nome = 'Vitor Teste';

-- Sexta-feira, 10 de Janeiro de 2026
INSERT INTO registros_ponto (funcionario_id, data, entrada, saida, total_horas, pago, data_pagamento)
SELECT id, '2026-01-10', '2026-01-10 18:30:00-03', '2026-01-10 23:00:00-03', 4.5, false, NULL
FROM funcionarios WHERE nome = 'Vitor Teste';

-- Sábado, 11 de Janeiro de 2026
INSERT INTO registros_ponto (funcionario_id, data, entrada, saida, total_horas, pago, data_pagamento)
SELECT id, '2026-01-11', '2026-01-11 18:30:00-03', '2026-01-11 23:00:00-03', 4.5, false, NULL
FROM funcionarios WHERE nome = 'Vitor Teste';

-- Domingo, 12 de Janeiro de 2026 (HOJE)
INSERT INTO registros_ponto (funcionario_id, data, entrada, saida, total_horas, pago, data_pagamento)
SELECT id, '2026-01-12', '2026-01-12 18:30:00-03', '2026-01-12 23:00:00-03', 4.5, false, NULL
FROM funcionarios WHERE nome = 'Vitor Teste';

-- ==========================================
-- FUNCIONÁRIO 2: POPIS
-- ==========================================

-- 1. Criar funcionário Popis
INSERT INTO funcionarios (nome, pin, valor_hora, role, ativo)
VALUES ('Popis', '2222', 18.00, 'funcionario', true)
ON CONFLICT DO NOTHING;

-- 2. Registros FIM DE SEMANA 1 - Popis (Janeiro 2-5, 2026)
INSERT INTO registros_ponto (funcionario_id, data, entrada, saida, total_horas, pago, data_pagamento)
SELECT id, '2026-01-02', '2026-01-02 18:30:00-03', '2026-01-02 23:00:00-03', 4.5, false, NULL
FROM funcionarios WHERE nome = 'Popis';

INSERT INTO registros_ponto (funcionario_id, data, entrada, saida, total_horas, pago, data_pagamento)
SELECT id, '2026-01-03', '2026-01-03 18:30:00-03', '2026-01-03 23:00:00-03', 4.5, false, NULL
FROM funcionarios WHERE nome = 'Popis';

INSERT INTO registros_ponto (funcionario_id, data, entrada, saida, total_horas, pago, data_pagamento)
SELECT id, '2026-01-04', '2026-01-04 18:30:00-03', '2026-01-04 23:00:00-03', 4.5, false, NULL
FROM funcionarios WHERE nome = 'Popis';

INSERT INTO registros_ponto (funcionario_id, data, entrada, saida, total_horas, pago, data_pagamento)
SELECT id, '2026-01-05', '2026-01-05 18:30:00-03', '2026-01-05 23:00:00-03', 4.5, false, NULL
FROM funcionarios WHERE nome = 'Popis';

-- 3. Registros FIM DE SEMANA 2 - Popis (Janeiro 9-12, 2026)
INSERT INTO registros_ponto (funcionario_id, data, entrada, saida, total_horas, pago, data_pagamento)
SELECT id, '2026-01-09', '2026-01-09 18:30:00-03', '2026-01-09 23:00:00-03', 4.5, false, NULL
FROM funcionarios WHERE nome = 'Popis';

INSERT INTO registros_ponto (funcionario_id, data, entrada, saida, total_horas, pago, data_pagamento)
SELECT id, '2026-01-10', '2026-01-10 18:30:00-03', '2026-01-10 23:00:00-03', 4.5, false, NULL
FROM funcionarios WHERE nome = 'Popis';

INSERT INTO registros_ponto (funcionario_id, data, entrada, saida, total_horas, pago, data_pagamento)
SELECT id, '2026-01-11', '2026-01-11 18:30:00-03', '2026-01-11 23:00:00-03', 4.5, true, '2026-01-11 23:30:00-03'
FROM funcionarios WHERE nome = 'Popis';

INSERT INTO registros_ponto (funcionario_id, data, entrada, saida, total_horas, pago, data_pagamento)
SELECT id, '2026-01-12', '2026-01-12 18:30:00-03', '2026-01-12 23:00:00-03', 4.5, true, '2026-01-12 23:30:00-03'
FROM funcionarios WHERE nome = 'Popis';

-- ==========================================
-- FUNCIONÁRIO 3: LEANDRO
-- ==========================================

-- 1. Criar funcionário Leandro
INSERT INTO funcionarios (nome, pin, valor_hora, role, ativo)
VALUES ('Leandro', '3333', 22.00, 'funcionario', true)
ON CONFLICT DO NOTHING;

-- 2. Registros FIM DE SEMANA 1 - Leandro (Janeiro 2-5, 2026)
INSERT INTO registros_ponto (funcionario_id, data, entrada, saida, total_horas, pago, data_pagamento)
SELECT id, '2026-01-02', '2026-01-02 18:30:00-03', '2026-01-02 23:00:00-03', 4.5, true, '2026-01-03 10:00:00-03'
FROM funcionarios WHERE nome = 'Leandro';

INSERT INTO registros_ponto (funcionario_id, data, entrada, saida, total_horas, pago, data_pagamento)
SELECT id, '2026-01-03', '2026-01-03 18:30:00-03', '2026-01-03 23:00:00-03', 4.5, true, '2026-01-04 10:00:00-03'
FROM funcionarios WHERE nome = 'Leandro';

INSERT INTO registros_ponto (funcionario_id, data, entrada, saida, total_horas, pago, data_pagamento)
SELECT id, '2026-01-04', '2026-01-04 18:30:00-03', '2026-01-04 23:00:00-03', 4.5, true, '2026-01-05 10:00:00-03'
FROM funcionarios WHERE nome = 'Leandro';

INSERT INTO registros_ponto (funcionario_id, data, entrada, saida, total_horas, pago, data_pagamento)
SELECT id, '2026-01-05', '2026-01-05 18:30:00-03', '2026-01-05 23:00:00-03', 4.5, true, '2026-01-06 10:00:00-03'
FROM funcionarios WHERE nome = 'Leandro';

-- 3. Registros FIM DE SEMANA 2 - Leandro (Janeiro 9-12, 2026)
INSERT INTO registros_ponto (funcionario_id, data, entrada, saida, total_horas, pago, data_pagamento)
SELECT id, '2026-01-09', '2026-01-09 18:30:00-03', '2026-01-09 23:00:00-03', 4.5, false, NULL
FROM funcionarios WHERE nome = 'Leandro';

INSERT INTO registros_ponto (funcionario_id, data, entrada, saida, total_horas, pago, data_pagamento)
SELECT id, '2026-01-10', '2026-01-10 18:30:00-03', '2026-01-10 23:00:00-03', 4.5, false, NULL
FROM funcionarios WHERE nome = 'Leandro';

INSERT INTO registros_ponto (funcionario_id, data, entrada, saida, total_horas, pago, data_pagamento)
SELECT id, '2026-01-11', '2026-01-11 18:30:00-03', '2026-01-11 23:00:00-03', 4.5, false, NULL
FROM funcionarios WHERE nome = 'Leandro';

INSERT INTO registros_ponto (funcionario_id, data, entrada, saida, total_horas, pago, data_pagamento)
SELECT id, '2026-01-12', '2026-01-12 18:30:00-03', '2026-01-12 23:00:00-03', 4.5, false, NULL
FROM funcionarios WHERE nome = 'Leandro';

-- ==========================================
-- RESUMO DA SIMULAÇÃO:
-- ==========================================
-- 
-- FUNCIONÁRIO 1: Vitor Teste
--   PIN: 1111
--   Valor/Hora: R$ 16,00
--   Total dias: 8 dias (2 fins de semana)
--   Total horas: 36 horas
--   Total a receber: R$ 576,00
--   Status: Todos pendentes (⏳)
-- 
-- FUNCIONÁRIO 2: Popis
--   PIN: 2222
--   Valor/Hora: R$ 18,00
--   Total dias: 8 dias (2 fins de semana)
--   Total horas: 36 horas
--   Total a receber: R$ 648,00
--   Status: 6 pendentes + 2 pagos (últimos 2 dias)
-- 
-- FUNCIONÁRIO 3: Leandro
--   PIN: 3333
--   Valor/Hora: R$ 22,00
--   Total dias: 8 dias (2 fins de semana)
--   Total horas: 36 horas
--   Total a receber: R$ 792,00
--   Status: 4 pagos (1º fim de semana) + 4 pendentes (2º fim de semana)
-- 
-- TOTAL GERAL:
--   Total de horas: 108 horas
--   Total a pagar: R$ 2.016,00
--   Pendentes: R$ 1.476,00 (Vitor: 576 + Popis: 162 + Leandro: 396)
--   Pagos: R$ 540,00 (Popis: 162 + Leandro: 396)
-- ==========================================

-- Para verificar os dados inseridos:
SELECT 
  f.nome,
  r.data,
  r.entrada::time as entrada,
  r.saida::time as saida,
  r.total_horas,
  (r.total_horas * f.valor_hora) as valor_receber,
  CASE WHEN r.pago THEN '✅ Pago' ELSE '⏳ Pendente' END as status
FROM registros_ponto r
JOIN funcionarios f ON r.funcionario_id = f.id
WHERE f.nome = 'Vitor Teste'
ORDER BY r.data;
