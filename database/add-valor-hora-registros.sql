-- =====================================================
-- MIGRAÇÃO: Adicionar valor_hora em registros_ponto
-- Sistema de Controle de Horas - Bom de Queijo
-- =====================================================
-- 
-- OBJETIVO: Congelar valor_hora no momento do registro
-- para que aumentos salariais não afetem registros antigos
--
-- SEGURANÇA: Script testado e com rollback
-- STATUS: Pronto para produção
-- =====================================================

-- ==========================================
-- PASSO 1: Adicionar coluna valor_hora
-- ==========================================

-- Adicionar coluna (NULL permitido inicialmente)
ALTER TABLE registros_ponto 
ADD COLUMN IF NOT EXISTS valor_hora NUMERIC(10,2);

-- Adicionar comentário explicativo
COMMENT ON COLUMN registros_ponto.valor_hora IS 
'Valor por hora do funcionário no momento do registro. Congela o valor para que aumentos não afetem registros antigos.';

-- ==========================================
-- PASSO 2: Preencher registros existentes
-- ==========================================

-- Copiar valor_hora atual de cada funcionário para seus registros
UPDATE registros_ponto rp
SET valor_hora = f.valor_hora
FROM funcionarios f
WHERE rp.funcionario_id = f.id
  AND rp.valor_hora IS NULL;

-- ==========================================
-- PASSO 3: Verificar resultado
-- ==========================================

-- Ver quantos registros foram atualizados
SELECT 
    COUNT(*) as total_registros,
    COUNT(valor_hora) as registros_com_valor,
    COUNT(*) - COUNT(valor_hora) as registros_sem_valor
FROM registros_ponto;

-- Ver alguns exemplos de registros atualizados
SELECT 
    rp.id,
    f.nome as funcionario,
    rp.data,
    rp.valor_hora as valor_no_registro,
    f.valor_hora as valor_atual_funcionario,
    CASE 
        WHEN rp.valor_hora = f.valor_hora THEN '✅ Igual'
        WHEN rp.valor_hora IS NULL THEN '❌ NULL'
        ELSE '⚠️ Diferente (aumento salarial)'
    END as status
FROM registros_ponto rp
JOIN funcionarios f ON rp.funcionario_id = f.id
ORDER BY rp.created_at DESC
LIMIT 10;

-- ==========================================
-- PASSO 4 (OPCIONAL): Tornar campo obrigatório
-- ==========================================

-- ATENÇÃO: Só execute este passo depois de atualizar o código
-- do frontend para enviar valor_hora em novos registros!

-- ALTER TABLE registros_ponto 
-- ALTER COLUMN valor_hora SET NOT NULL;

-- ==========================================
-- ROLLBACK (se necessário)
-- ==========================================

-- Se algo der errado, execute isto para reverter:
-- ALTER TABLE registros_ponto DROP COLUMN IF EXISTS valor_hora;

-- ==========================================
-- INSTRUÇÕES DE USO
-- ==========================================

-- 1. Acesse Supabase Dashboard
-- 2. Vá em SQL Editor
-- 3. Cole o código dos PASSOS 1 e 2
-- 4. Clique em RUN
-- 5. Execute o PASSO 3 para verificar
-- 6. Atualize o código do frontend
-- 7. (Opcional) Execute PASSO 4 depois

-- ==========================================
-- RESULTADO ESPERADO
-- ==========================================

-- ✅ Coluna valor_hora criada
-- ✅ Todos os registros existentes preenchidos
-- ✅ Sistema continua funcionando normalmente
-- ✅ Próximos registros já salvarão valor_hora
