-- ============================================
-- CRIAR APENAS AS FUNÇÕES DE AUDITORIA
-- (A tabela historico_alteracoes já existe)
-- ============================================

-- 1. FUNÇÃO PARA REGISTRAR ALTERAÇÕES MANUAIS DO ADMIN
CREATE OR REPLACE FUNCTION registrar_alteracao_admin(
    p_tabela TEXT,
    p_registro_id UUID,
    p_funcionario_id UUID,
    p_admin_nome TEXT,
    p_campo_alterado TEXT,
    p_valor_anterior TEXT,
    p_valor_novo TEXT,
    p_motivo TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_historico_id UUID;
BEGIN
    INSERT INTO historico_alteracoes (
        tabela,
        registro_id,
        funcionario_id,
        admin_nome,
        operacao,
        campo_alterado,
        valor_anterior,
        valor_novo,
        motivo
    ) VALUES (
        p_tabela,
        p_registro_id,
        p_funcionario_id,
        p_admin_nome,
        'UPDATE',
        p_campo_alterado,
        p_valor_anterior,
        p_valor_novo,
        p_motivo
    )
    RETURNING id INTO v_historico_id;
    
    RETURN v_historico_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. FUNÇÃO PARA OBTER HISTÓRICO DE UM REGISTRO
CREATE OR REPLACE FUNCTION obter_historico_registro(
    p_tabela TEXT,
    p_registro_id UUID
)
RETURNS TABLE (
    id UUID,
    admin_nome TEXT,
    operacao TEXT,
    campo_alterado TEXT,
    valor_anterior TEXT,
    valor_novo TEXT,
    motivo TEXT,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        h.id,
        h.admin_nome,
        h.operacao,
        h.campo_alterado,
        h.valor_anterior,
        h.valor_novo,
        h.motivo,
        h.created_at
    FROM historico_alteracoes h
    WHERE h.tabela = p_tabela
      AND h.registro_id = p_registro_id
    ORDER BY h.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. ADICIONAR CAMPOS DE AUDITORIA (se não existirem)
ALTER TABLE registros_ponto 
ADD COLUMN IF NOT EXISTS editado BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS editado_em TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS editado_por TEXT;

-- ============================================
-- PRONTO! Execute este script no Supabase
-- ============================================
