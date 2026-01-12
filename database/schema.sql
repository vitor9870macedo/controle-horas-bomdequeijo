-- ============================================
-- SCHEMA DO BANCO DE DADOS - SUPABASE
-- Sistema de Controle de Ponto - Bom de Queijo
-- ============================================

-- 1. CRIAR TABELA DE FUNCIONÁRIOS
CREATE TABLE funcionarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    pin TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'funcionario',
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('America/Sao_Paulo'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('America/Sao_Paulo'::text, now()),
    
    CONSTRAINT check_role CHECK (role IN ('admin', 'funcionario'))
);

-- 2. CRIAR TABELA DE REGISTROS DE PONTO
CREATE TABLE registros_ponto (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    funcionario_id UUID NOT NULL REFERENCES funcionarios(id) ON DELETE CASCADE,
    data DATE NOT NULL,
    entrada TIMESTAMP WITH TIME ZONE,
    saida TIMESTAMP WITH TIME ZONE,
    total_horas NUMERIC(5,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('America/Sao_Paulo'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('America/Sao_Paulo'::text, now())
);

-- 3. CRIAR ÍNDICES PARA PERFORMANCE
CREATE INDEX idx_registros_funcionario ON registros_ponto(funcionario_id);
CREATE INDEX idx_registros_data ON registros_ponto(data);
CREATE INDEX idx_registros_funcionario_data ON registros_ponto(funcionario_id, data);

-- 4. HABILITAR ROW LEVEL SECURITY (RLS)
ALTER TABLE funcionarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE registros_ponto ENABLE ROW LEVEL SECURITY;

-- 5. POLÍTICAS DE SEGURANÇA - FUNCIONÁRIOS

-- Todos podem ler funcionários ativos (para o select do formulário)
CREATE POLICY "Permitir leitura de funcionários ativos"
    ON funcionarios FOR SELECT
    USING (ativo = true);

-- Apenas admin autenticado pode inserir/atualizar/deletar funcionários
CREATE POLICY "Admin pode gerenciar funcionários"
    ON funcionarios FOR ALL
    USING (auth.role() = 'authenticated');

-- 6. POLÍTICAS DE SEGURANÇA - REGISTROS DE PONTO

-- Permitir leitura de todos os registros (necessário para funcionários verem seus registros)
CREATE POLICY "Permitir leitura de registros"
    ON registros_ponto FOR SELECT
    USING (true);

-- Permitir inserção de registros (funcionários registrando ponto)
CREATE POLICY "Permitir inserção de registros"
    ON registros_ponto FOR INSERT
    WITH CHECK (true);

-- Permitir atualização de registros (para registrar saída)
CREATE POLICY "Permitir atualização de registros"
    ON registros_ponto FOR UPDATE
    USING (true);

-- Admin pode deletar registros
CREATE POLICY "Admin pode deletar registros"
    ON registros_ponto FOR DELETE
    USING (auth.role() = 'authenticated');

-- 7. FUNÇÃO PARA ATUALIZAR updated_at AUTOMATICAMENTE
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('America/Sao_Paulo'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 8. TRIGGERS PARA ATUALIZAR updated_at
CREATE TRIGGER update_funcionarios_updated_at 
    BEFORE UPDATE ON funcionarios
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_registros_ponto_updated_at 
    BEFORE UPDATE ON registros_ponto
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- DADOS INICIAIS (OPCIONAL)
-- ============================================

-- Inserir funcionários de teste
INSERT INTO funcionarios (nome, pin, role, ativo) VALUES
    ('João Silva', '1234', 'funcionario', true),
    ('Maria Santos', '5678', 'funcionario', true),
    ('Pedro Oliveira', '9012', 'funcionario', true);

-- ============================================
-- CONFIGURAÇÃO DO ADMIN
-- ============================================

/*
IMPORTANTE: Para criar o usuário admin, faça o seguinte:

1. Vá para o painel do Supabase > Authentication > Users
2. Clique em "Add user" > "Create new user"
3. Preencha:
   - Email: admin@bomdequeijo.com (ou outro email)
   - Password: (escolha uma senha forte)
   - Auto Confirm User: SIM

OU use este SQL (substitua email e senha):

-- Criar usuário admin via SQL (execute após criar via painel)
UPDATE auth.users 
SET raw_user_meta_data = jsonb_build_object('role', 'admin')
WHERE email = 'admin@bomdequeijo.com';
*/

-- ============================================
-- QUERIES ÚTEIS PARA TESTES
-- ============================================

-- Ver todos os funcionários
-- SELECT * FROM funcionarios ORDER BY nome;

-- Ver registros de hoje
-- SELECT 
--     f.nome,
--     r.data,
--     r.entrada,
--     r.saida,
--     r.total_horas
-- FROM registros_ponto r
-- JOIN funcionarios f ON r.funcionario_id = f.id
-- WHERE r.data = CURRENT_DATE
-- ORDER BY r.entrada DESC;

-- Ver total de horas por funcionário
-- SELECT 
--     f.nome,
--     SUM(r.total_horas) as total_horas
-- FROM registros_ponto r
-- JOIN funcionarios f ON r.funcionario_id = f.id
-- WHERE r.total_horas IS NOT NULL
-- GROUP BY f.nome
-- ORDER BY total_horas DESC;
