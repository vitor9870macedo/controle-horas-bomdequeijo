-- ============================================
-- SISTEMA DE AUDITORIA - INSTALAÇÃO COMPLETA
-- Apaga tudo relacionado a auditoria e cria de novo
-- ============================================

-- 1. REMOVER TUDO QUE JÁ EXISTE (limpeza completa)
DROP TABLE IF EXISTS historico_alteracoes CASCADE;
DROP FUNCTION IF EXISTS registrar_alteracao_admin CASCADE;
DROP FUNCTION IF EXISTS obter_historico_registro CASCADE;

-- 2. CRIAR TABELA DE HISTÓRICO DE ALTERAÇÕES
CREATE TABLE historico_alteracoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome_da_tabela TEXT NOT NULL,
    registro_id UUID NOT NULL,
    funcionario_id UUID REFERENCES funcionarios(id),
    admin_nome TEXT,
    da_operacao TEXT NOT NULL,
    campo_alterado TEXT,
    valor_anterior TEXT,
    valor_novo TEXT,
    motivo TEXT,
    endereco_ip TEXT,
    user_agent TEXT,
    timestamp_criado TIMESTAMP WITH TIME ZONE DEFAULT timezone('America/Sao_Paulo'::text, now())
);

-- 3. CRIAR ÍNDICES
CREATE INDEX idx_historico_registro ON historico_alteracoes(registro_id);
CREATE INDEX idx_historico_funcionario ON historico_alteracoes(funcionario_id);
CREATE INDEX idx_historico_tabela ON historico_alteracoes(nome_da_tabela);
CREATE INDEX idx_historico_data ON historico_alteracoes(timestamp_criado);

-- 4. HABILITAR RLS
ALTER TABLE historico_alteracoes ENABLE ROW LEVEL SECURITY;

-- 5. CRIAR POLÍTICAS
CREATE POLICY "Permitir leitura do histórico"
    ON historico_alteracoes FOR SELECT
    USING (true);

CREATE POLICY "Sistema pode inserir histórico"
    ON historico_alteracoes FOR INSERT
    WITH CHECK (true);

-- 6. FUNÇÃO PARA REGISTRAR ALTERAÇÕES
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

-- 7. FUNÇÃO PARA OBTER HISTÓRICO
CREATE OR REPLACE FUNCTION obter_historico_registro(
    p_tabela TEXT,
    p_registro_id UUID
)
RETURNS TABLE (
    id UUID,
    admin_nome TEXT,
    da_operacao TEXT,
    campo_alterado TEXT,
    valor_anterior TEXT,
    valor_novo TEXT,
    motivo TEXT,
    timestamp_criado TIMESTAMP WITH TIME ZONE
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

-- 8. ADICIONAR CAMPOS DE AUDITORIA NA TABELA DE REGISTROS
ALTER TABLE registros_ponto 
ADD COLUMN IF NOT EXISTS editado BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS editado_em TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS editado_por TEXT;

-- 9. COMENTÁRIOS PARA DOCUMENTAÇÃO
COMMENT ON TABLE historico_alteracoes IS 'Registro de auditoria de todas as alterações feitas no sistema';
COMMENT ON COLUMN historico_alteracoes.nome_da_tabela IS 'Nome da tabela alterada';
COMMENT ON COLUMN historico_alteracoes.registro_id IS 'ID do registro alterado';
COMMENT ON COLUMN historico_alteracoes.admin_nome IS 'Nome do admin que fez a alteração';
COMMENT ON COLUMN historico_alteracoes.da_operacao IS 'Tipo de operação: INSERT, UPDATE ou DELETE';
COMMENT ON COLUMN historico_alteracoes.campo_alterado IS 'Campo modificado';
COMMENT ON COLUMN historico_alteracoes.valor_anterior IS 'Valor antes da alteração';
COMMENT ON COLUMN historico_alteracoes.valor_novo IS 'Valor depois da alteração';
COMMENT ON COLUMN historico_alteracoes.motivo IS 'Motivo da alteração';

-- ============================================
-- PRONTO! Tudo criado do zero
-- ============================================
