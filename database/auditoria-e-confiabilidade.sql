-- ============================================
-- AUDITORIA E CONFIABILIDADE
-- Sistema de Controle de Ponto - Bom de Queijo
-- ============================================

-- 1. CRIAR TABELA DE HISTÓRICO DE ALTERAÇÕES (AUDITORIA)
CREATE TABLE IF NOT EXISTS historico_alteracoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tabela TEXT NOT NULL,
    registro_id UUID NOT NULL,
    funcionario_id UUID REFERENCES funcionarios(id),
    admin_nome TEXT,
    operacao TEXT NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
    campo_alterado TEXT,
    valor_anterior TEXT,
    valor_novo TEXT,
    motivo TEXT,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('America/Sao_Paulo'::text, now())
);

-- 2. CRIAR ÍNDICES PARA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_historico_registro ON historico_alteracoes(registro_id);
CREATE INDEX IF NOT EXISTS idx_historico_funcionario ON historico_alteracoes(funcionario_id);
CREATE INDEX IF NOT EXISTS idx_historico_tabela ON historico_alteracoes(tabela);
CREATE INDEX IF NOT EXISTS idx_historico_data ON historico_alteracoes(created_at);

-- 3. HABILITAR RLS
ALTER TABLE historico_alteracoes ENABLE ROW LEVEL SECURITY;

-- 4. POLÍTICA: Permitir leitura para todos (admin verá no painel)
CREATE POLICY "Permitir leitura do histórico"
    ON historico_alteracoes FOR SELECT
    USING (true);

-- 5. POLÍTICA: Apenas sistema pode inserir (via trigger ou RPC)
CREATE POLICY "Sistema pode inserir histórico"
    ON historico_alteracoes FOR INSERT
    WITH CHECK (true);

-- 6. FUNÇÃO PARA REGISTRAR ALTERAÇÕES MANUAIS DO ADMIN
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

-- 7. FUNÇÃO PARA OBTER HISTÓRICO DE UM REGISTRO
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

-- 8. ADICIONAR CAMPO PARA MARCAR REGISTROS EDITADOS
ALTER TABLE registros_ponto 
ADD COLUMN IF NOT EXISTS editado BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS editado_em TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS editado_por TEXT;

-- 9. COMENTÁRIOS PARA DOCUMENTAÇÃO
COMMENT ON TABLE historico_alteracoes IS 'Registro de auditoria de todas as alterações feitas no sistema';
COMMENT ON COLUMN historico_alteracoes.tabela IS 'Nome da tabela alterada (ex: registros_ponto, funcionarios)';
COMMENT ON COLUMN historico_alteracoes.registro_id IS 'ID do registro que foi alterado';
COMMENT ON COLUMN historico_alteracoes.admin_nome IS 'Nome do admin que fez a alteração';
COMMENT ON COLUMN historico_alteracoes.operacao IS 'Tipo de operação: INSERT, UPDATE ou DELETE';
COMMENT ON COLUMN historico_alteracoes.campo_alterado IS 'Nome do campo que foi modificado';
COMMENT ON COLUMN historico_alteracoes.valor_anterior IS 'Valor antes da alteração';
COMMENT ON COLUMN historico_alteracoes.valor_novo IS 'Valor depois da alteração';
COMMENT ON COLUMN historico_alteracoes.motivo IS 'Motivo da alteração informado pelo admin';

-- ============================================
-- SCRIPT COMPLETO
-- Execute este arquivo no SQL Editor do Supabase
-- ============================================
