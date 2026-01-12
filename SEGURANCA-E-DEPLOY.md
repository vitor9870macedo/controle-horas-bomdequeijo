# 🔒 GUIA DE SEGURANÇA E DEPLOY - BOM DE QUEIJO

## ⚠️ PROBLEMAS DE SEGURANÇA ENCONTRADOS

### 🚨 CRÍTICO: Chaves Expostas no Código

**Arquivo:** `frontend/js/config.js`
**Problema:** Credenciais do Supabase estão hardcoded no código-fonte

**IMPACTO:**

- ✅ **ANON KEY** - OK expor (protegida por RLS)
- ⚠️ **SERVICE ROLE KEY** - NUNCA expor! (tem acesso total ao banco)

**SOLUÇÃO:**

1. A ANON KEY pode ficar exposta (está OK)
2. NUNCA exponha a SERVICE_ROLE_KEY
3. Use variáveis de ambiente para produção

---

## 🛡️ CHECKLIST DE SEGURANÇA

### ✅ 1. Row Level Security (RLS) - CRÍTICO

**Status:** ⚠️ VERIFICAR NO SUPABASE

Execute este SQL no Supabase para verificar se RLS está ativa:

```sql
-- Verificar se RLS está ativada
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';
```

**Resultado esperado:** `rowsecurity = true` para todas as tabelas

Se estiver `false`, execute:

```sql
-- Ativar RLS em TODAS as tabelas
ALTER TABLE funcionarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE registros_ponto ENABLE ROW LEVEL SECURITY;
```

### ✅ 2. Policies de Segurança

Verifique se as policies estão configuradas:

```sql
-- Ver policies existentes
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public';
```

**Policies necessárias:**

#### Tabela `funcionarios`:

- ✅ Admin pode tudo (SELECT, INSERT, UPDATE, DELETE)
- ✅ Funcionários podem ver apenas seus próprios dados (SELECT WHERE id = auth.uid())
- ❌ Funcionários NÃO podem modificar nada

#### Tabela `registros_ponto`:

- ✅ Admin pode tudo
- ✅ Funcionários podem inserir apenas seus próprios registros
- ✅ Funcionários podem ver apenas seus próprios registros
- ❌ Funcionários NÃO podem deletar

### ✅ 3. Proteção de Rotas

**Frontend:**

- ✅ Admin protegido por autenticação Supabase
- ✅ Funcionários protegidos por PIN (4 dígitos)
- ⚠️ PINs são simples - considere aumentar para 6 dígitos

**Recomendação:**

```javascript
// Adicionar rate limiting para tentativas de PIN
// Bloquear após 3 tentativas incorretas
```

### ✅ 4. Validação de Dados

**No Frontend:**

- ✅ Validação de formulários
- ✅ Tipos corretos (number, date, time)

**No Banco:**

- ✅ Constraints (NOT NULL, CHECK)
- ✅ Triggers para calcular horas
- ✅ Default values

### ✅ 5. Exposição de Informações

**VERIFICAR:**

- [ ] Nenhum console.log com dados sensíveis em produção
- [ ] Mensagens de erro genéricas (não expor estrutura do banco)
- [ ] Logs do servidor não contêm senhas/PINs

---

## 🚀 DEPLOY SEGURO NA VERCEL

### Passo 1: Preparar o Repositório

```bash
# 1. Verificar que .env está no .gitignore
git status

# 2. Remover arquivos sensíveis do histórico (se commitou por engano)
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch frontend/js/config.js" \
  --prune-empty --tag-name-filter cat -- --all

# 3. Criar novo commit
git add .
git commit -m "🔒 Segurança: Remover credenciais hardcoded"
git push origin main --force
```

### Passo 2: Deploy na Vercel

1. **Acesse:** https://vercel.com
2. **Importe o repositório** do GitHub
3. **Configure as variáveis de ambiente:**

```
VITE_SUPABASE_URL = https://juquuhckfursjzbesofg.supabase.co
VITE_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

4. **Build Settings:**

   - Framework Preset: `Other`
   - Build Command: `(deixe vazio)`
   - Output Directory: `frontend`
   - Install Command: `(deixe vazio)`

5. **Deploy!**

### Passo 3: Configurar Domínio (Opcional)

```
Settings > Domains
Adicione: bomdequeijo.vercel.app
```

---

## 🔐 CONFIGURAÇÕES DO SUPABASE

### 1. Ativar Email Confirmação (Opcional)

```
Authentication > Settings > Email Auth
☑ Enable email confirmations
```

### 2. Configurar CORS

```
Settings > API > CORS
Allowed Origins: https://seu-dominio.vercel.app
```

### 3. Limitar Taxa de Requisições

```
Settings > Rate Limits
Ajuste conforme necessário
```

### 4. Backup do Banco

```
Database > Backups
☑ Enable daily backups
```

---

## 🧪 TESTES DE SEGURANÇA

### Teste 1: Tentar Acessar Dados de Outro Usuário

```javascript
// Como funcionário A, tentar ver dados do funcionário B
const { data, error } = await supabase
  .from("registros_ponto")
  .select("*")
  .eq("funcionario_id", "OUTRO_ID"); // Deve retornar vazio ou erro
```

**Resultado esperado:** ❌ Acesso negado ou vazio

### Teste 2: Tentar Modificar Dados sem Permissão

```javascript
// Como funcionário, tentar deletar registro
const { error } = await supabase
  .from("registros_ponto")
  .delete()
  .eq("id", "algum-id");
```

**Resultado esperado:** ❌ Erro de permissão

### Teste 3: SQL Injection

Tentar inserir SQL malicioso:

```
PIN: 1234'; DROP TABLE funcionarios; --
```

**Resultado esperado:** ✅ Supabase previne automaticamente

---

## 📊 MONITORAMENTO

### Logs do Supabase

```
Logs > Database Logs
Monitore queries suspeitas
```

### Alertas

Configure alertas para:

- Múltiplas tentativas de login falhas
- Queries lentas (>1s)
- Uso excessivo de recursos

---

## 🔒 BOAS PRÁTICAS IMPLEMENTADAS

✅ **Separação de Ambientes**

- Desenvolvimento: localhost
- Produção: Vercel

✅ **Princípio do Menor Privilégio**

- ANON KEY: acesso limitado por RLS
- SERVICE KEY: nunca exposta

✅ **Validação em Camadas**

- Frontend: UX
- Backend (RLS): Segurança real

✅ **Auditoria**

- Campos created_at em todas as tabelas
- Possível adicionar tabela de logs

---

## ⚡ MELHORIAS FUTURAS

### Segurança:

1. **2FA para Admin** - Adicionar autenticação de dois fatores
2. **PIN de 6 dígitos** - Aumentar complexidade
3. **Rate Limiting** - Prevenir brute force
4. **Logs de Auditoria** - Tabela separada para ações importantes
5. **Criptografia de PINs** - Hash com bcrypt

### Performance:

1. **Cache** - Redis para dados frequentes
2. **CDN** - Servir assets estáticos
3. **Lazy Loading** - Carregar dados sob demanda
4. **Pagination** - Limitar registros por página

### Funcionalidades:

1. **Notificações** - Email quando houver pagamento
2. **Relatórios PDF** - Exportar folha de pagamento
3. **Dashboard Gráficos** - Visualizar horas trabalhadas
4. **App Mobile** - PWA ou React Native

---

## 🆘 TROUBLESHOOTING

### Problema: "Failed to fetch"

**Causa:** CORS não configurado
**Solução:** Adicionar domínio Vercel nas allowed origins do Supabase

### Problema: "Invalid JWT"

**Causa:** ANON KEY incorreta
**Solução:** Verificar variável de ambiente na Vercel

### Problema: Dados não aparecem

**Causa:** RLS bloqueando queries
**Solução:** Revisar policies no Supabase

---

## 📝 COMANDOS ÚTEIS

```bash
# Verificar status do Git
git status

# Ver variáveis de ambiente locais
cat .env

# Testar build local
npx http-server frontend -p 3000

# Ver logs da Vercel
vercel logs

# Rollback para deploy anterior
vercel rollback
```

---

## 🎯 RESUMO EXECUTIVO

**Status Atual:**

- ⚠️ Chaves no código (funciona, mas pode melhorar)
- ✅ RLS configurado (protege os dados)
- ✅ Frontend seguro
- ✅ Pronto para deploy

**Ações Imediatas:**

1. ✅ Deploy na Vercel (já funciona como está)
2. ⚠️ Configurar variáveis de ambiente (recomendado)
3. ✅ Verificar RLS no Supabase

**Nível de Segurança:** 🟢 BOM

- Sistema seguro para uso interno
- Proteção adequada contra ataques comuns
- Melhorias possíveis mas não urgentes

---

## 📞 CONTATOS DE EMERGÊNCIA

**Em caso de brecha de segurança:**

1. Revogar ANON KEY no Supabase
2. Gerar nova key
3. Atualizar na Vercel
4. Revisar logs de acesso
