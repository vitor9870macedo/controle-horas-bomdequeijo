-- ============================================
-- CORRIGIR FUNÇÕES DE AUDITORIA
-- Execute este script no SQL Editor do Supabase
-- ============================================

-- 1. RECRIAR FUNÇÃO DE REGISTRAR ALTERAÇÃO
DROP FUNCTION IF EXISTS registrar_alteracao_admin CASCADE;

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
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_historico_id UUID;
BEGIN
    INSERT INTO historico_alteracoes (
        nome_da_tabela,
        registro_id,
        funcionario_id,
        admin_nome,
        da_operacao,
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
$$;

-- 2. RECRIAR FUNÇÃO DE OBTER HISTÓRICO
DROP FUNCTION IF EXISTS obter_historico_registro CASCADE;

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
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        h.id,
        h.admin_nome,
        h.da_operacao,
        h.campo_alterado,
        h.valor_anterior,
        h.valor_novo,
        h.motivo,
        h.timestamp_criado
    FROM historico_alteracoes h
    WHERE h.nome_da_tabela = p_tabela
      AND h.registro_id = p_registro_id
    ORDER BY h.timestamp_criado DESC;
END;
$$;

-- 3. VERIFICAR SE FUNCIONOU
SELECT 'Funções criadas com sucesso!' as status;

-- 4. TESTAR (opcional)
-- SELECT * FROM pg_proc WHERE proname LIKE 'registrar_alteracao%';
-- SELECT * FROM pg_proc WHERE proname LIKE 'obter_historico%';
