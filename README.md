# 🍕 Sistema de Controle de Ponto - Bom de Queijo

Sistema web simples para controle de ponto de funcionários freelancers.

---

## 🏗️ Arquitetura

```
┌─────────────────┐
│  Frontend       │  HTML + CSS + JavaScript
│  (Vercel)       │  └─ Chama API REST
└────────┬────────┘
         │ HTTPS
         ▼
┌─────────────────┐
│  Supabase       │  Backend completo na nuvem
│  (Nuvem)        │  ├─ PostgreSQL (banco de dados)
└─────────────────┘  ├─ API REST (gerada automaticamente)
                     ├─ Auth (autenticação)
                     └─ Row Level Security (segurança)
```

**⚠️ NÃO HÁ BACKEND NODE.JS!**  
O Supabase já é o backend completo. Não precisa Render, Express, ou servidor Node.js.

---

## 📁 Estrutura do Projeto

```
controle-de-horas-bom-de-queijo/
│
├── frontend/                    # 🎨 Frontend (HTML/CSS/JS)
│   ├── pages/
│   │   ├── funcionario.html     # Tela de registro de ponto
│   │   └── admin.html           # Painel administrativo
│   │
│   ├── js/
│   │   ├── app.js               # Lógica do registro de ponto
│   │   ├── admin.js             # Lógica do painel admin
│   │   ├── clock.js             # Relógio em tempo real
│   │   └── config.js            # ⚙️ Configuração do Supabase
│   │
│   ├── css/
│   │   └── style.css            # Todos os estilos
│   │
│   └── assets/                  # Imagens, ícones
│
├── database/                    # 🗄️ Scripts SQL
│   └── schema.sql               # Schema completo do PostgreSQL
│
├── docs/                        # 📚 Documentação
│   ├── SETUP.md                 # Guia de instalação detalhado
│   └── DATABASE.md              # Documentação do banco
│
├── index.html                   # Página inicial
├── package.json                 # Config NPM (scripts)
├── vercel.json                  # Config deploy Vercel
├── .gitignore
├── .env.example
└── README.md                    # Este arquivo
```

---

## ⚡ Instalação Rápida

### 1️⃣ Configure o Supabase (Backend)

```bash
1. Crie conta: https://supabase.com (grátis)
2. Crie novo projeto
3. Vá em "SQL Editor"
4. Cole todo o conteúdo de database/schema.sql
5. Clique "Run"
6. Vá em Settings > API
7. Copie: Project URL e anon/public key
```

### 2️⃣ Configure o Frontend

Edite `frontend/js/config.js`:

```javascript
const SUPABASE_URL = "https://seuprojetoid.supabase.co"; // ← Cole aqui
const SUPABASE_ANON_KEY = "eyJhbGc...sua-key-aqui"; // ← Cole aqui
```

### 3️⃣ Crie Usuário Admin

```bash
No Supabase:
1. Vá em Authentication > Users
2. Clique "Add user" > "Create new user"
3. Email: admin@bomdequeijo.com
4. Password: (escolha uma senha forte)
5. ✅ Marque "Auto Confirm User"
6. Clique "Create user"
```

### 4️⃣ Teste Local

```bash
# Opção 1: http-server
npx http-server . -p 3000

# Opção 2: Live Server (VS Code)
# Botão direito no index.html > "Open with Live Server"

# Abra: http://localhost:3000
```

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
```

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
