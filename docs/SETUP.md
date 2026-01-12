# 📖 Guia de Instalação e Configuração Completo

Este guia detalha todos os passos para configurar o Sistema de Controle de Ponto do zero.

## 📋 Índice

1. [Configuração do Supabase](#1-configuração-do-supabase)
2. [Configuração do Projeto](#2-configuração-do-projeto)
3. [Teste Local](#3-teste-local)
4. [Deploy em Produção](#4-deploy-em-produção)
5. [Configuração Inicial](#5-configuração-inicial)
6. [Solução de Problemas](#6-solução-de-problemas)

---

## 1. Configuração do Supabase

### 1.1 Criar Conta e Projeto

1. Acesse https://supabase.com
2. Clique em "Start your project"
3. Crie uma conta (GitHub, Google ou email)
4. Clique em "New Project"
5. Preencha:

   - **Name**: bom-de-queijo-ponto (ou outro nome)
   - **Database Password**: (escolha uma senha forte e salve!)
   - **Region**: South America (São Paulo) - mais próximo do Brasil
   - **Pricing Plan**: Free

6. Aguarde ~2 minutos até o projeto ser criado

### 1.2 Executar o Schema SQL

1. No painel do Supabase, vá em **SQL Editor** (menu lateral)
2. Clique em "+ New query"
3. Abra o arquivo `database/schema.sql` deste projeto
4. Copie TODO o conteúdo
5. Cole no editor SQL do Supabase
6. Clique em **Run** (canto inferior direito)
7. Aguarde a mensagem "Success. No rows returned"

**O que foi criado:**

- Tabela `funcionarios`
- Tabela `registros_ponto`
- Índices para performance
- Row Level Security (RLS)
- Triggers para updated_at
- 3 funcionários de teste

### 1.3 Criar Usuário Administrador

1. Vá em **Authentication** > **Users** (menu lateral)
2. Clique em "Add user" > "Create new user"
3. Preencha:
   - **Email**: admin@bomdequeijo.com (ou outro)
   - **Password**: (escolha uma senha forte)
   - **Auto Confirm User**: ✅ **MARQUE ESTA OPÇÃO**
4. Clique em "Create user"

### 1.4 Copiar Credenciais do Projeto

1. Vá em **Settings** > **API** (menu lateral)
2. Copie os seguintes dados:

```
Project URL: https://xxxxxxxxxxxx.supabase.co
anon/public key: eyJhbGc...longo-texto...
```

**⚠️ IMPORTANTE:** Salve essas informações em local seguro!

---

## 2. Configuração do Projeto

### 2.1 Configurar Supabase no Código

1. Abra o arquivo `src/scripts/config/supabase.js`
2. Substitua os valores:

```javascript
const SUPABASE_URL = "https://seuprojetoid.supabase.co"; // Cole a Project URL
const SUPABASE_ANON_KEY = "eyJhbGc..."; // Cole a anon/public key
```

3. Salve o arquivo

### 2.2 Verificar Estrutura de Arquivos

Certifique-se de que a estrutura está assim:

```
controle-de-horas-bom-de-queijo/
├── index.html
├── src/
│   ├── pages/
│   │   ├── funcionario.html
│   │   └── admin.html
│   ├── scripts/
│   │   ├── app.js
│   │   ├── admin.js
│   │   ├── clock.js
│   │   └── config/
│   │       └── supabase.js
│   └── styles/
│       └── main.css
└── database/
    └── schema.sql
```

---

## 3. Teste Local

### 3.1 Opção 1: Usando http-server (Recomendado)

```bash
# Instalar http-server globalmente
npm install -g http-server

# Na pasta do projeto
cd controle-de-horas-bom-de-queijo

# Iniciar servidor
http-server . -p 3000

# Abrir no navegador
http://localhost:3000
```

### 3.2 Opção 2: Usando VS Code Live Server

1. Instale a extensão "Live Server" no VS Code
2. Clique com botão direito em `index.html`
3. Selecione "Open with Live Server"

### 3.3 Opção 3: Usando Python

```bash
# Python 3
python -m http.server 3000

# Abrir no navegador
http://localhost:3000
```

### 3.4 Testar Funcionalidades

**Teste 1: Registro de Ponto**

1. Clique em "Registrar Ponto"
2. Selecione "João Silva"
3. Digite PIN: `1234`
4. Clique em "Registrar Entrada"
5. Deve aparecer mensagem de sucesso ✅

**Teste 2: Área Admin**

1. Volte para página inicial
2. Clique em "Área do Admin"
3. Digite email e senha do admin
4. Deve entrar no dashboard ✅

---

## 4. Deploy em Produção

### 4.1 Deploy no Vercel (Recomendado)

#### Opção A: Via CLI

```bash
# Instalar Vercel CLI
npm i -g vercel

# Fazer login
vercel login

# Deploy
vercel

# Seguir instruções:
# - Set up and deploy? Yes
# - Which scope? (sua conta)
# - Link to existing project? No
# - Project name? (Enter para aceitar)
# - In which directory? ./
# - Override settings? No

# Deploy completo!
```

#### Opção B: Via GitHub + Vercel Web

1. Crie repositório no GitHub
2. Faça push do código:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/seu-usuario/seu-repo.git
git push -u origin main
```

3. Acesse https://vercel.com
4. Clique em "New Project"
5. Importe o repositório
6. Configure:
   - **Framework Preset**: Other
   - **Root Directory**: ./
   - **Build Command**: (deixe vazio)
   - **Output Directory**: ./
7. Clique em "Deploy"

### 4.2 Deploy no Netlify

1. Acesse https://netlify.com
2. Arraste a pasta do projeto para o Netlify Drop
3. Aguarde o deploy
4. Pronto! ✅

### 4.3 Deploy no GitHub Pages

1. Faça push para GitHub
2. Vá em Settings > Pages
3. Source: main branch / root
4. Salve e aguarde
5. Acesse: https://seu-usuario.github.io/seu-repo

---

## 5. Configuração Inicial

### 5.1 Adicionar Funcionários Reais

1. Acesse a área admin
2. Faça login
3. Clique em "Adicionar Funcionário"
4. Preencha nome e PIN (4 dígitos)
5. Salve

**Dica:** Escolha PINs fáceis de lembrar mas únicos para cada funcionário.

### 5.2 Desativar Funcionários de Teste (Opcional)

1. Na área admin, vá em "Gerenciar Funcionários"
2. Clique em "Desativar" para João Silva, Maria Santos, Pedro Oliveira
3. Eles não aparecerão mais no select de registro

### 5.3 Configurar Domínio Personalizado (Opcional)

#### No Vercel:

1. Acesse seu projeto no Vercel
2. Settings > Domains
3. Adicione seu domínio
4. Configure DNS conforme instruções

---

## 6. Solução de Problemas

### ❌ Erro: "Erro ao carregar funcionários"

**Causa:** Schema SQL não foi executado ou credenciais erradas

**Solução:**

1. Verifique se executou `database/schema.sql` completo no Supabase
2. Confirme se as credenciais em `src/scripts/config/supabase.js` estão corretas
3. Abra o Console (F12) e veja erros detalhados

### ❌ Erro: "Email ou senha incorretos"

**Causa:** Usuário admin não foi criado ou não foi confirmado

**Solução:**

1. Vá em Supabase > Authentication > Users
2. Verifique se o usuário existe
3. Certifique-se de que "Auto Confirm User" estava marcado
4. Tente resetar a senha: clique nos 3 pontos > "Reset password"

### ❌ Erro: "Failed to fetch" ou CORS

**Causa:** URL do Supabase errada ou RLS mal configurado

**Solução:**

1. Verifique se a URL do Supabase está correta
2. Certifique-se de que usou a `anon/public` key, não a `service_role`
3. Execute o schema SQL novamente (inclui políticas RLS)

### ❌ Horário aparece errado

**Causa:** Navegador com timezone diferente

**Solução:**

- O sistema força timezone `America/Sao_Paulo`
- Alguns navegadores antigos podem ter problemas
- Use Chrome, Firefox ou Edge atualizados

### ❌ Tabelas não aparecem no Supabase

**Causa:** Erro ao executar SQL

**Solução:**

1. Vá em SQL Editor
2. Execute linha por linha do schema.sql
3. Veja onde aparece erro
4. Provavelmente já existe - delete as tabelas e execute novamente

### ❌ Deploy deu erro no Vercel

**Causa:** Arquivos com caminhos absolutos ou estrutura errada

**Solução:**

1. Certifique-se de que todos os caminhos são relativos
2. Verifique se `index.html` está na raiz
3. Limpe cache: Settings > Deployment > Redeploy

---

## 🆘 Precisa de Ajuda?

1. **Documentação do Banco:** Veja [DATABASE.md](DATABASE.md)
2. **Console do Navegador:** Pressione F12 e veja a aba Console
3. **Logs do Supabase:** Database > Logs
4. **Suporte Supabase:** https://supabase.com/docs
5. **Suporte Vercel:** https://vercel.com/docs

---

## ✅ Checklist Final

- [ ] Projeto criado no Supabase
- [ ] Schema SQL executado com sucesso
- [ ] Usuário admin criado e confirmado
- [ ] Credenciais configuradas em `supabase.js`
- [ ] Teste local funcionando
- [ ] Deploy em produção concluído
- [ ] Funcionários reais adicionados
- [ ] Sistema funcionando perfeitamente!

---

**Parabéns! Seu sistema está pronto para uso! 🎉**
