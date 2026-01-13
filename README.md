# 🍕 Sistema de Controle de Ponto - Bom de Queijo

Sistema web para controle de ponto e pagamentos de funcionários freelancers.

**🌐 Deployed:** [controle-horas-bomdequeijo.vercel.app](https://controle-horas-bomdequeijo.vercel.app)

---

## 🎯 Funcionalidades

✅ **Registro de Ponto** - Entrada/saída com cálculo automático de horas  
✅ **Gestão de Pagamentos** - Marcar registros como pago/pendente  
✅ **Valor/Hora** - Calcular salário baseado em horas trabalhadas  
✅ **Dashboard Admin** - Visualizar e gerenciar todos os registros  
✅ **Login PIN** - 4 dígitos para funcionários, autenticação Supabase para admin  
✅ **Tema Dark** - Fundo preto + cores neon (#00d9ff, #00ff88, #ff3366)  
✅ **100% Responsivo** - Mobile-first design

---

## 🏗️ Arquitetura

```
┌─────────────────┐
│  Frontend       │  HTML5 + CSS3 + Vanilla JS (ES6)
│  (Vercel)       │  └─ Chama API REST
└────────┬────────┘
         │ HTTPS
         ▼
┌─────────────────┐
│  Supabase       │  Backend completo gerenciado
│  (Cloud)        │  ├─ PostgreSQL (banco de dados)
└─────────────────┘  ├─ REST API (auto-gerada)
                     ├─ Auth (login/senha)
                     └─ Row Level Security (RLS)
```

**⚠️ NÃO há servidor Node.js!** O Supabase é o backend completo.

---

## 📁 Estrutura do Projeto

```
controle-horas-bomdequeijo/
│
├── frontend/                    # 🎨 Frontend estático
│   ├── pages/
│   │   ├── funcionario.html     # Registro de ponto
│   │   └── admin.html           # Dashboard admin (3 tabs)
│   │
│   ├── js/
│   │   ├── app.js               # Lógica funcionário
│   │   ├── admin.js             # Lógica admin + tabs
│   │   └── config.js            # Configuração Supabase
│   │
│   ├── css/
│   │   └── style.css            # Dark theme + responsive
│   │
│   ├── imagens/                 # Logo e assets
│   └── assets/
│
├── database/                    # 🗄️ Scripts SQL
│   ├── schema.sql               # Schema completo
│   ├── verificar-rls.sql        # Script de segurança (RLS)
│   ├── dados-simulacao.sql      # Dados de teste (3 funcionários)
│   ├── add-valor-hora.sql       # Migration: campo valor_hora
│   └── add-campo-pago.sql       # Migration: tracking pagamentos
│
├── index.html                   # Página inicial
├── vercel.json                  # Config Vercel (rotas + headers)
├── .gitignore                   # Arquivos ignorados
├── .env.example                 # Template de variáveis
├── DEPLOY-RAPIDO.md            # 🚀 Guia de deploy (5 min)
├── SEGURANCA-E-DEPLOY.md       # 🔒 Auditoria de segurança
└── README.md                    # Este arquivo
```

---

## ⚡ Instalação Rápida

### 1️⃣ Configure o Supabase (Backend)

1. **Crie conta:** https://supabase.com (grátis)
2. **Crie novo projeto:** Nome: `Bom de Queijo`
3. **Execute migrations no SQL Editor:**

   - `database/schema.sql` (estrutura completa)
   - `database/verificar-rls.sql` (ativar segurança)
   - `database/dados-simulacao.sql` (dados de teste - opcional)

4. **Configure credenciais:**
   - Vá em **Settings > API**
   - Copie: `Project URL` e `anon/public key`
   - Cole em `frontend/js/config.js`

### 2️⃣ Deploy na Vercel

**Opção Rápida:** Siga o guia [DEPLOY-RAPIDO.md](DEPLOY-RAPIDO.md)

**Resumo:**

```bash
# 1. Push para GitHub
git push origin main

# 2. Importe na Vercel
# https://vercel.com/new
# Configure: Output Directory = "frontend"

# 3. Deploy!
```

### 3️⃣ Teste o Sistema

**Admin:**

- URL: `/admin`
- Email: `admin@bomdequeijo.com`
- Senha: `admin123456`

**Funcionário:**

- URL: `/funcionario`
- PIN: `1111` (Vitor Teste)

---

## 🗄️ Banco de Dados

### Tabelas

**`funcionarios`**

```sql
id UUID PRIMARY KEY
nome TEXT
pin TEXT (4 dígitos)
valor_hora DECIMAL (R$/hora)
role TEXT ('admin' | 'funcionario')
ativo BOOLEAN
created_at TIMESTAMP
```

**`registros_ponto`**

```sql
id UUID PRIMARY KEY
funcionario_id UUID → funcionarios(id)
data DATE
entrada TIME
saida TIME
total_horas DECIMAL (calculado via trigger)
pago BOOLEAN (status pagamento)
data_pagamento TIMESTAMP (quando foi pago)
created_at TIMESTAMP
```

### Segurança (RLS)

✅ **Row Level Security** ativado em todas as tabelas  
✅ **Admin** - acesso total via autenticação Supabase  
✅ **Funcionários** - podem inserir/visualizar apenas seus dados  
✅ **ANON_KEY** - exposta no frontend (OK! Protegida por RLS)  
❌ **SERVICE_KEY** - NUNCA expor (acesso total ao banco)

**Verificar segurança:**

```sql
-- Execute database/verificar-rls.sql no Supabase
```

---

## 🎨 Design

**Tema Dark:**

- Fundo: `#000000` (preto)
- Primary: `#00d9ff` (cyan neon)
- Success: `#00ff88` (verde neon)
- Danger: `#ff3366` (vermelho neon)

**Responsividade:**

- Desktop: Grid 3 colunas
- Tablet: Grid 2 colunas (< 768px)
- Mobile: 1 coluna + cards (< 480px)

---

## 📱 Features

### Dashboard Admin (3 Tabs)

1. **Tab Registros** - Filtrar por funcionário/data, ver todas as entradas
2. **Tab Pagamentos** - Marcar como pago, filtrar pendentes, calcular totais
3. **Tab Funcionários** - CRUD completo (criar/editar/deletar/ativar)

### Página Funcionário

- Login com PIN (4 dígitos)
- Botão "Registrar Entrada" (verde)
- Botão "Registrar Saída" (vermelho)
- Lista de registros do dia
- Total de horas trabalhadas
- Valor a receber (horas × valor_hora)

---

## 🔐 Segurança

**Checklist:**

- [x] RLS ativada
- [x] Policies configuradas
- [x] CORS configurado
- [x] Headers de segurança (vercel.json)
- [x] .gitignore protegendo .env
- [x] ANON_KEY pode ser exposta (protegida por RLS)
- [x] SERVICE_KEY nunca commitada

**Ler mais:** [SEGURANCA-E-DEPLOY.md](SEGURANCA-E-DEPLOY.md)

---

## 🚀 Deploy

**Produção:** Vercel (frontend estático)  
**Backend:** Supabase (gerenciado)

**URLs:**

- Frontend: https://controle-horas-bomdequeijo.vercel.app
- API: https://juquuhckfursjzbesofg.supabase.co

**Guia completo:** [DEPLOY-RAPIDO.md](DEPLOY-RAPIDO.md)

---

## 🛠️ Tecnologias

**Frontend:**

- HTML5 (semântico)
- CSS3 (Grid, Flexbox, Custom Properties)
- Vanilla JavaScript (ES6 modules)
- Supabase JS Client (CDN)

**Backend:**

- Supabase (PostgreSQL + API REST + Auth + RLS)
- Nenhum servidor Node.js necessário

**Deploy:**

- Vercel (frontend estático)
- GitHub (controle de versão)

---

## 📊 Status do Projeto

✅ **PRONTO PARA PRODUÇÃO**

**Última atualização:** 12/01/2026  
**Versão:** 1.0.0  
**Deploy:** https://controle-horas-bomdequeijo.vercel.app

---

## 📞 Suporte

**Repositório:** https://github.com/vitor9870macedo/controle-horas-bomdequeijo  
**Issues:** https://github.com/vitor9870macedo/controle-horas-bomdequeijo/issues  
**Docs Supabase:** https://supabase.com/docs  
**Docs Vercel:** https://vercel.com/docs

---

## 📝 Notas Importantes

⚠️ **ANON_KEY pode ser exposta** - Está OK! O RLS protege os dados  
⚠️ **SERVICE_KEY NUNCA deve ser exposta** - Tem acesso total ao banco  
⚠️ **PINs são validados no frontend** - Para produção, considere aumentar para 6 dígitos  
⚠️ **Dados de simulação** - Deletar após testes (`database/dados-simulacao.sql`)

---

**Desenvolvido com ❤️ para Bom de Queijo**

````

### 5️⃣ Deploy (Produção)

```bash
# Opção 1: Vercel CLI
npm i -g vercel
vercel login
vercel

# Opção 2: Vercel Web
# Arraste a pasta para https://vercel.com/new

# Opção 3: Netlify
# Arraste a pasta para https://app.netlify.com/drop
````

---

## 🎯 Como Funciona

### Para Funcionários:

1. Acessa o site
2. Clica "Registrar Ponto"
3. Seleciona nome (lista vem do banco)
4. Digita PIN de 4 dígitos
5. Clica "Entrada" ou "Saída"
6. JavaScript valida PIN e salva no Supabase

### Para Admin:

1. Acessa o site
2. Clica "Área do Admin"
3. Faz login (email + senha)
4. Vê dashboard com:
   - Total de registros
   - Total de horas
   - Funcionários ativos
   - Tabela completa de registros
   - Filtros por data/funcionário
   - Exportação para CSV
   - Gerenciamento de funcionários

---

## 🔧 Tecnologias

| Camada             | Tecnologia                | Custo    | Função                  |
| ------------------ | ------------------------- | -------- | ----------------------- |
| **Frontend**       | HTML5, CSS3, JavaScript   | Grátis   | Interface do usuário    |
| **Hospedagem**     | Vercel                    | Grátis   | Serve o frontend        |
| **Backend**        | Supabase                  | Grátis\* | API REST + Auth + Banco |
| **Banco de Dados** | PostgreSQL (via Supabase) | Grátis\* | Armazena dados          |

\*Planos gratuitos: Supabase (500MB, 50k users/mês), Vercel (100GB/mês)

**Estimativa real:** ~500 KB/dia = MUITO abaixo dos limites! ✅

---

## 📚 Documentação

- **Instalação Detalhada**: [docs/SETUP.md](docs/SETUP.md)
- **Banco de Dados**: [docs/DATABASE.md](docs/DATABASE.md)

---

## 🆘 Problemas Comuns

| Erro                     | Solução                                                         |
| ------------------------ | --------------------------------------------------------------- |
| Não carrega funcionários | Verifique `frontend/js/config.js` com credenciais corretas      |
| Erro no login admin      | Crie usuário no Supabase > Authentication > Users               |
| Horário errado           | Sistema usa timezone America/Sao_Paulo (GMT-3)                  |
| CORS error               | Certifique-se de usar a `anon/public key`, não a `service_role` |

**Documentação completa:** [docs/SETUP.md](docs/SETUP.md)

---

## 🔒 Segurança

- ✅ Row Level Security (RLS) no Supabase
- ✅ Autenticação via Supabase Auth
- ✅ HTTPS automático no deploy
- ✅ Headers de segurança (vercel.json)
- ⚠️ PINs em texto (considere hash em produção)

---

## 📊 Funcionalidades

### ✅ Funcionários

- Registro de entrada
- Registro de saída
- Visualiza último registro do dia
- Validação de PIN

### ✅ Administrador

- Login seguro (email/senha)
- Dashboard com estatísticas
- Lista todos os registros
- Filtros por funcionário e data
- Exportação para CSV
- Adicionar funcionários
- Ativar/desativar funcionários
- Cálculo automático de horas

---

## 💰 Custos

**Total: R$ 0,00/mês**

- Supabase Free: 500MB, 50k users, 2GB bandwidth
- Vercel Free: 100GB bandwidth, deploy ilimitado
- Sistema nunca ultrapassará limites gratuitos!

---

**Sistema 100% funcional, documentado e gratuito!** 🚀

Para começar, veja: [docs/SETUP.md](docs/SETUP.md)
