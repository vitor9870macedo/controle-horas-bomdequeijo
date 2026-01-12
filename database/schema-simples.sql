-- COPIE E COLE TODO ESTE ARQUIVO NO SUPABASE SQL EDITOR

-- Tabela de Funcionários
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

-- Tabela de Registros de Ponto
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

-- Índices
CREATE INDEX idx_registros_funcionario ON registros_ponto(funcionario_id);
CREATE INDEX idx_registros_data ON registros_ponto(data);
CREATE INDEX idx_registros_funcionario_data ON registros_ponto(funcionario_id, data);

-- Row Level Security
ALTER TABLE funcionarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE registros_ponto ENABLE ROW LEVEL SECURITY;

-- Políticas de Segurança
CREATE POLICY "Permitir leitura de funcionários ativos" ON funcionarios FOR SELECT USING (ativo = true);
CREATE POLICY "Admin pode gerenciar funcionários" ON funcionarios FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Permitir leitura de registros" ON registros_ponto FOR SELECT USING (true);
CREATE POLICY "Permitir inserção de registros" ON registros_ponto FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir atualização de registros" ON registros_ponto FOR UPDATE USING (true);
CREATE POLICY "Admin pode deletar registros" ON registros_ponto FOR DELETE USING (auth.role() = 'authenticated');

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('America/Sao_Paulo'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers
CREATE TRIGGER update_funcionarios_updated_at BEFORE UPDATE ON funcionarios FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_registros_ponto_updated_at BEFORE UPDATE ON registros_ponto FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Dados de teste
INSERT INTO funcionarios (nome, pin, role, ativo) VALUES
    ('João Silva', '1234', 'funcionario', true),
    ('Maria Santos', '5678', 'funcionario', true),
    ('Pedro Oliveira', '9012', 'funcionario', true);
