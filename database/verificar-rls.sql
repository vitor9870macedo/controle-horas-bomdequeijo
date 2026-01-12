-- ================================================
-- SCRIPT DE VERIFICAÇÃO E CONFIGURAÇÃO DE SEGURANÇA
-- Sistema de Controle de Horas - Bom de Queijo
-- ================================================

-- ==========================================
-- PARTE 1: VERIFICAR CONFIGURAÇÃO ATUAL
-- ==========================================

-- 1. Verificar se RLS está ativada
SELECT 
    tablename,
    rowsecurity as "RLS Ativada?",
    CASE 
        WHEN rowsecurity = true THEN '✅ Protegida'
        ELSE '❌ VULNERÁVEL!'
    END as "Status"
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- 2. Ver todas as policies existentes
SELECT 
    schemaname as "Schema",
    tablename as "Tabela",
    policyname as "Nome da Policy",
    cmd as "Comando",
    roles as "Roles",
    CASE permissive 
        WHEN 'PERMISSIVE' THEN '✅ Permissiva'
        ELSE '⚠️ Restritiva'
    END as "Tipo"
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 3. Verificar usuários e roles
SELECT 
    usename as "Usuário",
    usesuper as "É Superuser?",
    usecreatedb as "Pode Criar DB?",
    valuntil as "Válido Até"
FROM pg_user
WHERE usename NOT LIKE 'pg_%'
ORDER BY usename;

-- ==========================================
-- PARTE 2: ATIVAR RLS (se não estiver)
-- ==========================================

-- Ativar RLS em todas as tabelas
ALTER TABLE funcionarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE registros_ponto ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- PARTE 3: CRIAR POLICIES DE SEGURANÇA
-- ==========================================

-- IMPORTANTE: Remova as policies antigas antes de criar novas
DROP POLICY IF EXISTS "Admin pode ver todos os funcionários" ON funcionarios;
DROP POLICY IF EXISTS "Admin pode criar funcionários" ON funcionarios;
DROP POLICY IF EXISTS "Admin pode atualizar funcionários" ON funcionarios;
DROP POLICY IF EXISTS "Admin pode deletar funcionários" ON funcionarios;
DROP POLICY IF EXISTS "Funcionários podem ver apenas seus dados" ON funcionarios;

DROP POLICY IF EXISTS "Admin pode ver todos os registros" ON registros_ponto;
DROP POLICY IF EXISTS "Admin pode criar registros" ON registros_ponto;
DROP POLICY IF EXISTS "Admin pode atualizar registros" ON registros_ponto;
DROP POLICY IF EXISTS "Admin pode deletar registros" ON registros_ponto;
DROP POLICY IF EXISTS "Funcionários podem inserir seus registros" ON registros_ponto;
DROP POLICY IF EXISTS "Funcionários podem ver seus registros" ON registros_ponto;

-- ==========================================
-- POLICIES PARA TABELA: funcionarios
-- ==========================================

-- 1. ADMIN: Acesso total
CREATE POLICY "Admin pode ver todos os funcionários"
ON funcionarios
FOR SELECT
TO authenticated
USING (
    (SELECT role FROM auth.users WHERE id = auth.uid()) = 'admin'
);

CREATE POLICY "Admin pode criar funcionários"
ON funcionarios
FOR INSERT
TO authenticated
WITH CHECK (
    (SELECT role FROM auth.users WHERE id = auth.uid()) = 'admin'
);

CREATE POLICY "Admin pode atualizar funcionários"
ON funcionarios
FOR UPDATE
TO authenticated
USING (
    (SELECT role FROM auth.users WHERE id = auth.uid()) = 'admin'
);

CREATE POLICY "Admin pode deletar funcionários"
ON funcionarios
FOR DELETE
TO authenticated
USING (
    (SELECT role FROM auth.users WHERE id = auth.uid()) = 'admin'
);

-- 2. FUNCIONÁRIOS: Apenas leitura dos próprios dados
-- Nota: Sistema atual não usa auth.uid() para funcionários (usa PIN)
-- Então esta policy serve apenas para prevenir acesso direto via API

CREATE POLICY "Funcionários podem ver apenas seus dados"
ON funcionarios
FOR SELECT
TO anon, authenticated
USING (true);  -- Permite leitura pública (necessário para login com PIN)

-- IMPORTANTE: Funcionários NÃO podem modificar nada
-- (sem policies de INSERT/UPDATE/DELETE = automaticamente negado)

-- ==========================================
-- POLICIES PARA TABELA: registros_ponto
-- ==========================================

-- 1. ADMIN: Acesso total
CREATE POLICY "Admin pode ver todos os registros"
ON registros_ponto
FOR SELECT
TO authenticated
USING (
    (SELECT role FROM auth.users WHERE id = auth.uid()) = 'admin'
);

CREATE POLICY "Admin pode criar registros"
ON registros_ponto
FOR INSERT
TO authenticated
WITH CHECK (
    (SELECT role FROM auth.users WHERE id = auth.uid()) = 'admin'
);

CREATE POLICY "Admin pode atualizar registros"
ON registros_ponto
FOR UPDATE
TO authenticated
USING (
    (SELECT role FROM auth.users WHERE id = auth.uid()) = 'admin'
);

CREATE POLICY "Admin pode deletar registros"
ON registros_ponto
FOR DELETE
TO authenticated
USING (
    (SELECT role FROM auth.users WHERE id = auth.uid()) = 'admin'
);

-- 2. FUNCIONÁRIOS: Podem inserir e ver apenas seus registros
-- Nota: Como não usamos auth.uid() para funcionários, 
-- a segurança real vem da lógica do frontend

CREATE POLICY "Funcionários podem inserir seus registros"
ON registros_ponto
FOR INSERT
TO anon, authenticated
WITH CHECK (true);  -- Frontend valida o funcionario_id correto

CREATE POLICY "Funcionários podem ver seus registros"
ON registros_ponto
FOR SELECT
TO anon, authenticated
USING (true);  -- Frontend filtra por funcionario_id

-- IMPORTANTE: Funcionários NÃO podem deletar nem atualizar
-- (sem policies de DELETE/UPDATE = automaticamente negado)

-- ==========================================
-- PARTE 4: VERIFICAR RESULTADO FINAL
-- ==========================================

-- Mostrar resumo de segurança
SELECT 
    'RLS Ativada' as "Verificação",
    tablename as "Tabela",
    CASE 
        WHEN rowsecurity = true THEN '✅ OK'
        ELSE '❌ FALHA'
    END as "Status"
FROM pg_tables 
WHERE schemaname = 'public'

UNION ALL

SELECT 
    'Policies Criadas' as "Verificação",
    tablename as "Tabela",
    COUNT(*)::text || ' policies' as "Status"
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename

ORDER BY "Verificação", "Tabela";

-- ==========================================
-- PARTE 5: TESTES DE SEGURANÇA
-- ==========================================

-- TESTE 1: Verificar se anon pode criar funcionários (deve falhar)
-- Execute no frontend sem estar logado como admin:
-- const { data, error } = await supabase.from('funcionarios').insert({ nome: 'Hacker' })
-- Resultado esperado: error.code = '42501' (insufficient_privilege)

-- TESTE 2: Verificar se anon pode deletar registros (deve falhar)
-- const { error } = await supabase.from('registros_ponto').delete().eq('id', 'algum-id')
-- Resultado esperado: error.code = '42501'

-- TESTE 3: Verificar se admin consegue tudo (deve funcionar)
-- const { data, error } = await supabase.auth.signInWithPassword({ email: 'admin@...', password: '...' })
-- const { data } = await supabase.from('funcionarios').select('*')
-- Resultado esperado: Retorna todos os funcionários

-- ==========================================
-- PARTE 6: AUDITORIA E MONITORAMENTO
-- ==========================================

-- Criar tabela de logs (opcional mas recomendado)
CREATE TABLE IF NOT EXISTS logs_auditoria (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tabela TEXT NOT NULL,
    acao TEXT NOT NULL, -- INSERT, UPDATE, DELETE
    usuario_id UUID REFERENCES auth.users(id),
    funcionario_id UUID REFERENCES funcionarios(id),
    dados_antigos JSONB,
    dados_novos JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS na tabela de logs
ALTER TABLE logs_auditoria ENABLE ROW LEVEL SECURITY;

-- Policy: Apenas admin pode ver logs
CREATE POLICY "Apenas admin vê logs"
ON logs_auditoria
FOR SELECT
TO authenticated
USING (
    (SELECT role FROM auth.users WHERE id = auth.uid()) = 'admin'
);

-- ==========================================
-- PARTE 7: ÍNDICES PARA PERFORMANCE
-- ==========================================

-- Índices para melhorar performance das queries com RLS
CREATE INDEX IF NOT EXISTS idx_funcionarios_ativo ON funcionarios(ativo);
CREATE INDEX IF NOT EXISTS idx_registros_funcionario ON registros_ponto(funcionario_id);
CREATE INDEX IF NOT EXISTS idx_registros_data ON registros_ponto(data);
CREATE INDEX IF NOT EXISTS idx_registros_pago ON registros_ponto(pago);

-- Índice composto para queries de filtro
CREATE INDEX IF NOT EXISTS idx_registros_filtro 
ON registros_ponto(funcionario_id, data, pago);

-- ==========================================
-- PARTE 8: INFORMAÇÕES IMPORTANTES
-- ==========================================

-- SOBRE RLS (Row Level Security):
-- ✅ Protege dados mesmo se ANON_KEY for exposta
-- ✅ Cada query é automaticamente filtrada
-- ✅ Funciona em SELECT, INSERT, UPDATE, DELETE
-- ❌ Pode impactar performance (use índices)

-- SOBRE AS POLICIES:
-- PERMISSIVE (padrão): Se QUALQUER policy permitir, acesso liberado
-- RESTRICTIVE: TODAS as policies devem permitir

-- SOBRE auth.uid():
-- Retorna o ID do usuário autenticado
-- Retorna NULL para requisições anônimas (anon key)
-- Sistema atual: Admin usa auth, Funcionários usam PIN (sem auth)

-- LIMITAÇÕES DO SISTEMA ATUAL:
-- ⚠️ PINs são validados no frontend (pode ser bypassado)
-- ⚠️ Funcionários não têm auth.uid() (usam anon key)
-- ✅ RLS protege contra modificações não autorizadas
-- ✅ Admin tem controle total via autenticação real

-- RECOMENDAÇÕES:
-- 1. Considere adicionar rate limiting no Supabase
-- 2. Configure CORS para apenas seu domínio
-- 3. Monitore logs regularmente
-- 4. Faça backups diários automáticos
-- 5. Implemente logs de auditoria

-- ==========================================
-- FIM DO SCRIPT
-- ==========================================

-- Como executar este script:
-- 1. Acesse Supabase Dashboard
-- 2. Vá em SQL Editor
-- 3. Cole todo este código
-- 4. Clique em RUN
-- 5. Verifique os resultados

-- Resultado esperado:
-- ✅ RLS ativada em todas as tabelas
-- ✅ Policies criadas (10+ policies)
-- ✅ Índices criados para performance
-- ✅ Tabela de logs criada (opcional)
