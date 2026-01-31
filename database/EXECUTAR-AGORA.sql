-- ============================================
-- SOLUÇÃO DEFINITIVA - Execute este script
-- ============================================

-- PASSO 1: Remover função antiga (se existir)
DROP FUNCTION IF EXISTS registrar_alteracao_admin CASCADE;

-- PASSO 2: Criar a função com os parâmetros CORRETOS
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
    -- Tentar inserir na estrutura com "tabela"
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
    EXCEPTION
        WHEN undefined_column THEN
            -- Se falhar, tentar estrutura com "nome_da_tabela"
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
END;
$$;

-- PASSO 3: Verificar se funcionou
SELECT 
    'Função criada com sucesso!' as status,
    proname as funcao,
    pg_get_function_arguments(oid) as parametros
FROM pg_proc 
WHERE proname = 'registrar_alteracao_admin';
