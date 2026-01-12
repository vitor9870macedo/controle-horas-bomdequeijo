# 🧪 Guia de Simulação e Testes

## 📋 Passo a Passo para Testar o Sistema

### 1️⃣ Configurar o Supabase (15 minutos)

#### a) Criar Conta e Projeto
1. Acesse https://supabase.com
2. Clique em "Start your project"
3. Crie uma conta (pode usar GitHub)
4. Clique em "New Project"
5. Preencha:
   - **Name:** bom-de-queijo-ponto
   - **Database Password:** (copie e guarde!)
   - **Region:** South America (São Paulo)
6. Aguarde ~2 minutos (projeto sendo criado)

#### b) Criar o Banco de Dados
1. No menu lateral, clique em **SQL Editor**
2. Clique em "+ New Query"
3. Abra o arquivo `database/schema.sql`
4. Copie TODO o conteúdo
5. Cole no SQL Editor do Supabase
6. Clique em **Run** (ou Ctrl+Enter)
7. ✅ Deve aparecer "Success. No rows returned"

#### c) Inserir Dados de Teste
1. Ainda no SQL Editor, clique em "+ New Query"
2. Abra o arquivo `database/dados-teste.sql`
3. Copie TODO o conteúdo
4. Cole no SQL Editor
5. Clique em **Run**
6. ✅ Deve mostrar uma tabela com 4 registros de exemplo

#### d) Copiar Credenciais
1. No menu lateral, clique em ⚙️ **Settings**
2. Clique em **API**
3. Você verá:
   - **Project URL** → `https://xxxxxxxx.supabase.co`
   - **anon public** key → `eyJhbGciOiJ...` (texto longo)
4. Copie esses valores

#### e) Configurar o Frontend
1. Abra o arquivo `frontend/js/config.js`
2. Substitua:
   ```javascript
   const SUPABASE_URL = "https://xxxxxxxx.supabase.co";  // Cole sua URL
   const SUPABASE_ANON_KEY = "eyJhbGc...";  // Cole sua key
   ```
3. Salve o arquivo

---

### 2️⃣ Testar Registro de Ponto

#### a) Iniciar o Servidor
```powershell
cd "c:\Users\vitorg\Documents\Controle De Horas Bom De Queijo"
npx http-server . -p 3000
```

#### b) Abrir no Navegador
1. Acesse: http://localhost:3000
2. Clique em **"Registrar Ponto"**

#### c) Fazer um Registro
1. **Selecione:** João Silva
2. **Digite PIN:** 1234
3. Clique em **"Registrar Entrada"** 🟢
4. ✅ Deve aparecer: "✅ Entrada registrada com sucesso!"

#### d) Fazer Saída
1. **Selecione:** João Silva novamente
2. **Digite PIN:** 1234
3. Clique em **"Registrar Saída"** 🔴
4. ✅ Deve aparecer: "✅ Saída registrada! Total: X.XX horas"

---

### 3️⃣ Criar Usuário Admin

#### a) No Supabase
1. No menu lateral, clique em 🔐 **Authentication**
2. Clique em **Users**
3. Clique em **Add User** → **Create new user**
4. Preencha:
   - **Email:** admin@bomdequeijo.com
   - **Password:** admin123456
   - **Auto Confirm User:** ✅ SIM (marque isso!)
5. Clique em **Create User**

---

### 4️⃣ Testar o Dashboard Admin

#### a) Fazer Login
1. No navegador, volte para http://localhost:3000
2. Clique em **"Área do Admin"** ⚙️
3. Preencha:
   - **Email:** admin@bomdequeijo.com
   - **Senha:** admin123456
4. Clique em **Entrar**

#### b) Explorar o Dashboard
Você verá:
- 📊 **Cards de Estatísticas:**
  - Total de funcionários: 4
  - Registros hoje: 2
  - Horas trabalhadas hoje: ~X horas
  - Funcionários ativos agora: 1 (Maria ainda está trabalhando!)

- 📅 **Filtros:**
  - Funcionário específico
  - Período de datas
  - Botão de atualizar

- 📋 **Tabela de Registros:**
  - Todos os pontos registrados
  - Entrada/Saída/Total de horas
  - Ordenados por data

- 💾 **Exportar CSV:**
  - Clique no botão verde
  - Baixa arquivo Excel com todos os dados

---

## 🎭 Cenários de Teste

### Cenário 1: Jornada Completa
```
1. Maria Santos (PIN: 5678)
   - Registrar Entrada às 18:00
   - Trabalhar algumas horas...
   - Registrar Saída às 23:00
   - Ver total de ~5 horas
```

### Cenário 2: Múltiplos Funcionários
```
1. Pedro (PIN: 9012) → Entrada
2. Ana (PIN: 3456) → Entrada
3. João (PIN: 1234) → Saída
4. No admin: ver 3 pessoas ativas
```

### Cenário 3: Filtros no Admin
```
1. Filtrar por "João Silva"
2. Ver apenas registros dele
3. Filtrar por "Última semana"
4. Exportar CSV filtrado
```

---

## 🔍 Verificações de Segurança

### ✅ O que DEVE funcionar:
- ✅ Qualquer pessoa pode VER lista de funcionários
- ✅ Registro de ponto com PIN correto
- ✅ Admin logado vê todos os registros
- ✅ Exportar relatórios

### ❌ O que NÃO deve funcionar:
- ❌ Registrar ponto com PIN errado → Erro!
- ❌ Acessar admin sem login → Redireciona
- ❌ Modificar registros pelo navegador → Bloqueado pelo RLS

---

## 📊 Dados de Teste Disponíveis

| Nome | PIN | Status | Situação |
|------|-----|--------|----------|
| João Silva | 1234 | Ativo | Trabalhou hoje (6h) |
| Maria Santos | 5678 | Ativo | Está trabalhando agora |
| Pedro Costa | 9012 | Ativo | Trabalhou ontem (5.5h) |
| Ana Oliveira | 3456 | Ativo | Trabalhou semana passada (5h) |

**Credenciais Admin:**
- Email: admin@bomdequeijo.com
- Senha: admin123456

---

## 🐛 Problemas Comuns

### Erro: "fetch is not defined"
→ Esqueceu de configurar URL/Key no `config.js`

### Erro: "Invalid API key"
→ Chave copiada errada, copie novamente do Supabase

### Funcionários não aparecem
→ Execute o `schema.sql` e depois `dados-teste.sql`

### PIN não funciona
→ Verifique se digitou exatamente 4 dígitos (ex: 1234)

### Admin não loga
→ Verifique se marcou "Auto Confirm User" ao criar

---

## 🚀 Próximos Passos

Após testar localmente:
1. ✅ Criar conta no Vercel
2. ✅ Conectar seu projeto GitHub
3. ✅ Deploy automático
4. ✅ Sistema online 24/7!
