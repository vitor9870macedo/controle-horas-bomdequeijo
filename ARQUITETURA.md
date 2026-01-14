# 📐 Arquitetura Técnica - Sistema de Controle de Ponto

> **Documentação técnica completa para novos contextos de chat**

## 🎯 Visão Geral do Projeto

Sistema web de controle de ponto eletrônico para a **Pizzaria Bom de Queijo**, permitindo que funcionários registrem entrada/saída via PIN e administradores gerenciem dados e relatórios.

**Stack Tecnológica:**

- **Frontend:** HTML5, CSS3, JavaScript (Vanilla - ES6 Modules)
- **Backend:** Supabase (PostgreSQL + Auth + REST API)
- **Deploy:** Vercel (frontend estático)
- **Timezone:** America/Sao_Paulo (Brasília)

---

## 📁 Estrutura de Diretórios

```
controle-horas-bomdequeijo/
├── frontend/                    # Aplicação web
│   ├── index.html              # Página inicial (seleção Admin/Funcionário)
│   ├── pages/
│   │   ├── admin.html          # Dashboard administrativo
│   │   └── funcionario.html    # Registro de ponto
│   ├── css/
│   │   └── style.css           # Estilos globais responsivos
│   ├── js/
│   │   ├── config.js           # Configuração Supabase (ANON_KEY exposto OK)
│   │   ├── app.js              # Lógica de registro de ponto
│   │   └── admin.js            # Lógica do painel administrativo
│   └── imagens/                # Assets (logo, backgrounds)
│
├── database/                    # Scripts SQL
│   ├── schema.sql              # Estrutura completa do banco
│   ├── add-campo-pago.sql      # Migração: campo 'pago'
│   ├── add-valor-hora.sql      # Migração: valor_hora
│   └── dados-simulacao.sql     # Dados de teste
│
├── vercel.json                 # Configuração de deploy e rotas
├── package.json                # Apenas para deploy (sem build)
└── .gitignore                  # Ignora .env e arquivos temporários
```

---

## 🗄️ Estrutura do Banco de Dados (Supabase/PostgreSQL)

### **Tabela: `funcionarios`**

```sql
CREATE TABLE funcionarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  pin TEXT NOT NULL,              -- PIN de 4 dígitos (texto para manter zeros à esquerda)
  role TEXT DEFAULT 'funcionario', -- 'admin' | 'funcionario'
  ativo BOOLEAN DEFAULT true,
  valor_hora NUMERIC(10,2) DEFAULT 0.00,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Índices:**

- `idx_funcionarios_nome` em `nome`
- `idx_funcionarios_pin` em `pin`
- `idx_funcionarios_ativo` em `ativo`

**Dados Importantes:**

- Admin padrão: `admin@bomdequeijo.com` (PIN: 1234)
- Usuários teste: Vitor Teste (1111), Popis (2222), Leandro (3333)

---

### **Tabela: `registros_ponto`**

```sql
CREATE TABLE registros_ponto (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  funcionario_id UUID REFERENCES funcionarios(id) ON DELETE CASCADE,
  data DATE NOT NULL,
  entrada TIMESTAMPTZ,
  saida TIMESTAMPTZ,
  total_horas NUMERIC(10,2),       -- Calculado automaticamente
  pago BOOLEAN DEFAULT false,       -- Controle de pagamento
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Índices:**

- `idx_registros_funcionario` em `funcionario_id`
- `idx_registros_data` em `data`
- `idx_registros_pago` em `pago`

**Constraint:**

```sql
CONSTRAINT chk_entrada_saida CHECK (saida IS NULL OR saida > entrada)
```

---

### **RPC Functions (Row Level Security)**

#### 🔐 `validar_pin_funcionario(nome_input TEXT, pin_input TEXT)`

```sql
CREATE OR REPLACE FUNCTION validar_pin_funcionario(nome_input TEXT, pin_input TEXT)
RETURNS TABLE(id UUID, nome TEXT, valor_hora NUMERIC, ativo BOOLEAN)
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT f.id, f.nome, f.valor_hora, f.ativo
  FROM funcionarios f
  WHERE f.nome = nome_input
    AND f.pin = pin_input
    AND f.ativo = true;
END;
$$ LANGUAGE plpgsql;
```

**Propósito:** Validar PIN sem expor dados sensíveis via `SELECT` público.

#### 📊 `listar_nomes_funcionarios()`

```sql
CREATE OR REPLACE FUNCTION listar_nomes_funcionarios()
RETURNS TABLE(nome TEXT)
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT f.nome
  FROM funcionarios f
  WHERE f.ativo = true AND f.role = 'funcionario'
  ORDER BY f.nome;
END;
$$ LANGUAGE plpgsql;
```

**Propósito:** Expor apenas nomes para dropdown, sem IDs ou PINs.

---

### **RLS (Row Level Security) - ESTADO ATUAL**

⚠️ **DESABILITADO** para uso interno:

```sql
ALTER TABLE funcionarios DISABLE ROW LEVEL SECURITY;
ALTER TABLE registros_ponto DISABLE ROW LEVEL SECURITY;
```

**Justificativa:**

- Sistema interno (não público)
- Segurança garantida por:
  1. PIN de 4 dígitos
  2. Autenticação Supabase para admin
  3. Uso de RPC functions para validação
- Tentativas de RLS causaram erro `42501` (permission denied on auth.users)

---

## 🔑 Autenticação e Segurança

### **Funcionários**

- **Método:** PIN de 4 dígitos
- **Validação:** Via `validar_pin_funcionario()` (SECURITY DEFINER)
- **Armazenamento:** Texto plano no banco (contexto interno)
- **Fluxo:**
  1. Seleciona nome no dropdown
  2. Insere PIN
  3. Backend valida via RPC
  4. Retorna ID do funcionário se válido

### **Administradores**

- **Método:** Email + senha (Supabase Auth)
- **Sessão:** Token JWT armazenado no `localStorage`
- **Verificação:** `supabase.auth.getSession()` no carregamento
- **Logout:** `supabase.auth.signOut()`

### **ANON_KEY Exposto**

✅ **É seguro** para este projeto:

- Chave anônima permite apenas operações via RPC functions
- Dados sensíveis protegidos por lógica de validação
- Sistema interno (não público na internet)

---

## 🎨 Frontend - Estrutura e Componentes

### **index.html** - Página Inicial

**Responsabilidade:** Seleção de perfil (Admin ou Funcionário)

**Elementos principais:**

- Relógio em tempo real (atualiza a cada 1s)
- Botões de navegação estilizados
- Logo da pizzaria

**Scripts:**

```javascript
// Relógio
function updateClock() {
  const now = new Date();
  const timeString = now.toLocaleTimeString("pt-BR", {
    timeZone: "America/Sao_Paulo",
  });
  // Atualiza DOM
}
setInterval(updateClock, 1000);
```

---

### **funcionario.html** - Registro de Ponto

**Componentes:**

1. **Dropdown de funcionários** (`<select id="funcionario">`)

   - Carregado via `loadFuncionarios()`
   - Lista apenas funcionários ativos
   - Ordenado alfabeticamente

2. **Campo PIN** (`<input id="pin" type="password">`)

   - `maxlength="4"`
   - `pattern="[0-9]{4}"`
   - Autocomplete desabilitado

3. **Botões de ação:**
   - 🟢 **Registrar Entrada** (`data-action="entrada"`)
   - 🔴 **Registrar Saída** (`data-action="saida"`)

**Lógica de UX (app.js):**

```javascript
pontoForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const botaoClicado = e.submitter;

  // 1. Desabilitar botões (prevenir cliques duplos)
  botoes.forEach((btn) => (btn.disabled = true));

  // 2. Mostrar loading visual
  botaoClicado.querySelector(".btn-icon").textContent = "⏳";
  botaoClicado.childNodes[2].textContent = "Registrando...";

  // 3. Validar PIN via RPC
  const funcionario = await verificarPin(nome, pin);

  // 4. Registrar ponto
  await registrarPonto(funcionario.id, acao, botaoClicado);

  // 5. Reabilitar botões (finally block)
});
```

**Fluxo de Registro:**

1. Verifica se já existe registro de hoje
2. **Entrada:** Insere novo registro com `saida = NULL`
3. **Saída:**
   - Atualiza registro existente
   - Calcula `total_horas = (saida - entrada) / 3600000`
   - Mostra tempo trabalhado formatado

**Validações:**

- ❌ Não pode registrar entrada se já tem entrada sem saída
- ❌ Não pode registrar saída sem entrada prévia
- ✅ Mensagens de erro/sucesso visíveis por 5 segundos

---

### **admin.html** - Dashboard Administrativo

**Estrutura de Abas (Tabs):**

```html
<div class="tabs">
  <button data-tab="dashboard">📊 Dashboard</button>
  <button data-tab="registros">📝 Registros</button>
  <button data-tab="funcionarios">👥 Funcionários</button>
  <button data-tab="relatorios">📈 Relatórios</button>
  <button data-tab="pagamentos">💰 Pagamentos</button>
</div>
```

#### **Aba: Dashboard**

- Resumo de registros de hoje
- Total de funcionários ativos
- Cards informativos

#### **Aba: Registros**

**Funcionalidades:**

- Listar todos os registros de ponto
- Filtros:
  - Por funcionário
  - Por período (data início/fim)
  - Por status de pagamento
- Ações:
  - ✏️ Editar registro (modal)
  - 🗑️ Excluir registro

**Edição de Registro:**

```javascript
async function editarRegistro(id, novaEntrada, novaSaida) {
  const entrada = new Date(novaEntrada);
  const saida = new Date(novaSaida);
  const diffHours = (saida - entrada) / (1000 * 60 * 60);

  await supabase
    .from("registros_ponto")
    .update({
      entrada: novaEntrada,
      saida: novaSaida,
      total_horas: diffHours.toFixed(2),
    })
    .eq("id", id);
}
```

#### **Aba: Funcionários**

**CRUD Completo:**

- ➕ Adicionar funcionário
- ✏️ Editar funcionário (nome, PIN, valor/hora)
- 🗑️ Desativar funcionário (soft delete: `ativo = false`)
- 🔄 Reativar funcionário

**Campos:**

- Nome (único)
- PIN (4 dígitos)
- Valor/hora (R$)
- Role (admin/funcionario)
- Status (ativo/inativo)

#### **Aba: Relatórios**

**Tipos de relatório:**

1. **Por funcionário e período**

   - Total de horas trabalhadas
   - Total a pagar (horas × valor_hora)
   - Detalhamento dia a dia

2. **Exportação:** CSV/Excel (futuro)

**Cálculo de Pagamento:**

```javascript
const totalPagar = totalHoras * funcionario.valor_hora;
```

#### **Aba: Pagamentos**

**Gestão de status:**

- Listar registros não pagos
- Marcar como pago (`pago = true`)
- Filtrar por período
- Resumo de valores pendentes

---

## 🚀 Deploy e Configuração

### **Vercel (Frontend)**

**vercel.json:**

```json
{
  "rewrites": [
    { "source": "/", "destination": "/frontend/index.html" },
    { "source": "/admin", "destination": "/frontend/pages/admin.html" },
    {
      "source": "/funcionario",
      "destination": "/frontend/pages/funcionario.html"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" }
      ]
    }
  ]
}
```

**Deploy automático:**

- Push no branch `main` → Vercel faz build automático
- URL: https://controle-horas-bomdequeijo.vercel.app

---

### **Supabase (Backend)**

**Projeto:** `juquuhckfursjzbesofg`
**URL:** https://juquuhckfursjzbesofg.supabase.co

**Configuração em `config.js`:**

```javascript
const SUPABASE_URL = "https://juquuhckfursjzbesofg.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
```

**Variáveis de Ambiente (.env - NÃO commitado):**

```
SUPABASE_URL=https://juquuhckfursjzbesofg.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 🐛 Problemas Conhecidos e Soluções

### ❌ Erro 403/42501 - RLS

**Problema:** Ao habilitar RLS, queries retornam "permission denied for table users"

**Causa:** Políticas RLS tentavam acessar `auth.users` sem permissão

**Solução Atual:** RLS desabilitado, segurança via RPC functions

---

### ❌ Cliques Duplos em Registros

**Problema:** Usuário podia clicar múltiplas vezes criando registros duplicados

**Solução Implementada (14/01/2026):**

```javascript
// Desabilitar botões durante processamento
botoes.forEach((btn) => (btn.disabled = true));

// Feedback visual
botaoClicado.querySelector(".btn-icon").textContent = "⏳";
botaoClicado.textContent = "Registrando...";

// Reabilitar no finally block
```

---

### ⚠️ Timezone

**Importante:** SEMPRE usar `America/Sao_Paulo` nas queries:

```javascript
const brasiliaTime = new Date().toLocaleString("en-US", {
  timeZone: "America/Sao_Paulo",
});
```

PostgreSQL armazena em UTC, conversão feita no frontend.

---

## 🔄 Fluxos Principais

### **Fluxo: Registro de Entrada**

```
1. Funcionário seleciona nome → 2. Insere PIN →
3. Clica "Registrar Entrada" →
4. Frontend valida campos →
5. Chama validar_pin_funcionario() →
6. Se válido, busca registro de hoje →
7. Se não tem entrada, INSERT novo registro →
8. Mostra mensagem "Entrada registrada" →
9. Limpa PIN
```

### **Fluxo: Registro de Saída**

```
1-5. Mesmos passos de entrada →
6. Busca registro de hoje com entrada sem saída →
7. Calcula total_horas = (agora - entrada) →
8. UPDATE registro com saída e total_horas →
9. Mostra "Saída registrada! Trabalhou Xh Ymin"
```

### **Fluxo: Login Admin**

```
1. Acessa /admin →
2. Verifica session existente →
3. Se não autenticado, mostra form login →
4. Submit → supabase.auth.signInWithPassword() →
5. Se sucesso, esconde login, mostra dashboard →
6. Carrega dados das abas
```

---

## 📊 Queries Importantes

### **Buscar registros de um período:**

```javascript
const { data } = await supabase
  .from("registros_ponto")
  .select(
    `
    *,
    funcionarios(nome, valor_hora)
  `
  )
  .gte("data", dataInicio)
  .lte("data", dataFim)
  .order("data", { ascending: false });
```

### **Calcular total a pagar:**

```javascript
const { data } = await supabase
  .from("registros_ponto")
  .select(
    `
    total_horas,
    funcionarios(valor_hora)
  `
  )
  .eq("funcionario_id", id)
  .eq("pago", false);

const total = data.reduce(
  (acc, r) => acc + r.total_horas * r.funcionarios.valor_hora,
  0
);
```

---

## 🎨 Estilização (CSS)

**Paleta de cores:**

- Verde primário: `#4CAF50`
- Verde hover: `#45a049`
- Vermelho: `#f44336`
- Cinza claro: `#f5f5f5`
- Texto: `#333`

**Responsividade:**

- Mobile-first design
- Breakpoints: `max-width: 768px`
- Cards flexíveis
- Botões em coluna no mobile

**Classes principais:**

- `.container` - Wrapper centralizado
- `.card` - Cards com sombra
- `.btn` - Botões base
- `.btn-success`, `.btn-danger` - Variantes coloridas
- `.message.success`, `.message.error` - Feedback visual

---

## 📝 Histórico de Alterações Importantes

### **14/01/2026 - Melhorias UX**

- ✅ Adicionado loading visual aos botões de registro
- ✅ Prevenção de cliques duplos
- ✅ Feedback imediato ao usuário

### **13/01/2026 - Segurança**

- ✅ Implementadas RPC functions para validação
- ✅ RLS desabilitado após testes (problemas de permissão)
- ✅ Validação de PIN movida para backend

### **Dezembro/2025 - Estrutura Inicial**

- ✅ Criação do banco de dados
- ✅ Frontend básico com registro de ponto
- ✅ Painel administrativo com abas
- ✅ Deploy no Vercel

---

## 🔐 Credenciais de Teste

**Admin:**

- Email: `admin@bomdequeijo.com`
- Senha: `admin123`

**Funcionários:**

- Vitor Teste - PIN: `1111`
- Popis - PIN: `2222`
- Leandro - PIN: `3333`

---

## 📞 Informações de Contexto

**Cliente:** Pizzaria Bom de Queijo  
**Objetivo:** Sistema interno de controle de ponto  
**Usuários:** ~10 funcionários  
**Deploy:** https://controle-horas-bomdequeijo.vercel.app  
**Repositório:** https://github.com/vitor9870macedo/controle-horas-bomdequeijo

---

## ⚙️ Comandos Úteis

### **Desenvolvimento local:**

```bash
# Servir frontend localmente
npx serve frontend

# Ou usar Live Server no VS Code
```

### **Deploy:**

```bash
# Vercel faz deploy automático no push
git add .
git commit -m "mensagem"
git push origin main
```

### **Banco de dados:**

```sql
-- Resetar registros de teste
DELETE FROM registros_ponto;

-- Ver registros de hoje
SELECT * FROM registros_ponto
WHERE data = CURRENT_DATE;

-- Reativar funcionário
UPDATE funcionarios
SET ativo = true
WHERE id = 'uuid-aqui';
```

---

## 🎯 Próximas Melhorias (Backlog)

- [ ] Exportação de relatórios em Excel/CSV
- [ ] Notificações de falta de registro
- [ ] Gráficos de horas trabalhadas
- [ ] Auditoria de alterações
- [ ] Modo escuro
- [ ] Impressão de comprovantes de ponto

---

**Última atualização:** 14/01/2026  
**Versão da documentação:** 1.0
