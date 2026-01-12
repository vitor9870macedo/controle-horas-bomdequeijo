# 🚀 GUIA RÁPIDO DE DEPLOY - VERCEL

## ⚡ Deploy em 5 Minutos

### 1️⃣ Preparar o Código

```bash
# Certifique-se de estar no diretório do projeto
cd "c:\Users\vitorg\Documents\Controle De Horas Bom De Queijo"

# Verificar status do Git
git status

# Commitar tudo (se necessário)
git add .
git commit -m "🚀 Pronto para deploy"

# Push para GitHub (se ainda não tiver repositório remoto)
# Crie um repositório em: https://github.com/new
# Nome sugerido: controle-horas-bomdequeijo

git remote add origin https://github.com/SEU-USUARIO/controle-horas-bomdequeijo.git
git branch -M main
git push -u origin main
```

### 2️⃣ Deploy na Vercel

**Opção A: Via Site (Recomendado)**

1. Acesse: https://vercel.com/signup
2. Faça login com GitHub
3. Clique em **"Add New Project"**
4. Selecione o repositório `controle-horas-bomdequeijo`
5. Configure:
   - **Framework Preset:** Other
   - **Root Directory:** `./` (raiz)
   - **Build Command:** (deixe vazio)
   - **Output Directory:** `frontend`
   - **Install Command:** (deixe vazio)
6. Clique em **"Deploy"**
7. Aguarde ~30 segundos
8. ✅ Seu site está no ar!

**Opção B: Via CLI**

```bash
# Instalar Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel

# Seguir prompts:
# - Set up and deploy? Y
# - Which scope? (sua conta)
# - Link to existing project? N
# - Project name? controle-horas-bomdequeijo
# - Directory? ./
# - Override settings? N

# Deploy para produção
vercel --prod
```

### 3️⃣ Configurar Variáveis de Ambiente (OPCIONAL)

**Nota:** O sistema atual funciona SEM variáveis de ambiente. Esta etapa é OPCIONAL para melhorar segurança.

No Vercel Dashboard:

1. Vá em **Settings > Environment Variables**
2. Adicione:

```
Name: VITE_SUPABASE_URL
Value: https://juquuhckfursjzbesofg.supabase.co
```

```
Name: VITE_SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp1cXV1aGNrZnVyc2p6YmVzb2ZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyNTMwODgsImV4cCI6MjA4MzgyOTA4OH0.z8-DCHU_2EeqhgwLd1IJ30bonLxS9jQIHfWcKZACwW4
```

3. **Redeploy** para aplicar

### 4️⃣ Configurar CORS no Supabase

1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto: `juquuhckfursjzbesofg`
3. Vá em **Settings > API**
4. Em **CORS Origins**, adicione:

```
https://seu-projeto.vercel.app
```

**Ou permita todos (menos seguro mas mais fácil):**

```
*
```

### 5️⃣ Executar Migrations no Banco

1. Acesse: https://supabase.com/dashboard
2. Vá em **SQL Editor**
3. Execute os scripts na ORDEM:

**a) Verificar e configurar RLS:**

```sql
-- Cole o conteúdo de: database/verificar-rls.sql
-- Este script ativa Row Level Security
```

**b) Adicionar dados de simulação (opcional):**

```sql
-- Cole o conteúdo de: database/dados-simulacao.sql
-- Cria 3 funcionários de teste
```

### 6️⃣ Testar o Deploy

Acesse seu site: `https://seu-projeto.vercel.app`

**Teste 1: Página Inicial**

- ✅ Deve carregar sem erros
- ✅ Botões "Admin" e "Funcionário" funcionam
- ✅ Logo aparece corretamente

**Teste 2: Login Admin**

- URL: `/admin`
- Email: `admin@bomdequeijo.com`
- Senha: `admin123456`
- ✅ Deve logar e mostrar dashboard

**Teste 3: Login Funcionário**

- URL: `/funcionario`
- PIN: `1111` (Vitor Teste)
- ✅ Deve logar e mostrar registros

**Teste 4: Registrar Ponto**

- ✅ Clicar em "Registrar Entrada"
- ✅ Deve salvar no banco
- ✅ Aparecer na lista

---

## 🔧 Configuração Avançada

### Domínio Customizado

1. No Vercel Dashboard > Settings > Domains
2. Clique em **"Add Domain"**
3. Digite: `bomdequeijo.com.br`
4. Configure DNS:

```
Type: A
Name: @
Value: 76.76.21.21

Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

5. Aguarde propagação (~24h)

### SSL/HTTPS

✅ Vercel configura automaticamente

- Certificado Let's Encrypt
- Renovação automática
- Redirect HTTP → HTTPS

### Preview Deploys

Cada commit no GitHub cria um deploy de preview:

- URL: `https://seu-projeto-git-branch-name.vercel.app`
- Útil para testar antes de ir para produção

### Rollback

Se algo der errado:

1. Vá em **Deployments**
2. Selecione um deploy anterior
3. Clique em **"Promote to Production"**

---

## 📊 Monitoramento

### Analytics

Ative analytics gratuito:

1. Settings > Analytics
2. Enable Web Analytics
3. Ver visitantes, páginas mais acessadas, etc.

### Logs

Ver logs em tempo real:

```bash
vercel logs
```

Ou no dashboard:

- Deployments > [seu deploy] > Build Logs
- Deployments > [seu deploy] > Function Logs

### Alertas

Configure alertas de:

- Deploy falhou
- Site fora do ar
- Erros 500

---

## 🛠️ Troubleshooting

### Erro: "404 - File Not Found"

**Causa:** Caminho incorreto no vercel.json

**Solução:**

```json
{
  "rewrites": [
    { "source": "/", "destination": "/pages/index.html" },
    { "source": "/admin", "destination": "/pages/admin.html" },
    { "source": "/funcionario", "destination": "/pages/funcionario.html" }
  ]
}
```

### Erro: "Failed to fetch"

**Causa:** CORS bloqueando requisições

**Solução:** Adicione seu domínio Vercel no Supabase (Settings > API > CORS)

### Erro: "Invalid JWT"

**Causa:** ANON_KEY incorreta ou expirada

**Solução:**

1. Copie a key correta do Supabase (Settings > API)
2. Atualize em `frontend/js/config.js`
3. Commit e push

### CSS não carrega

**Causa:** Cache do browser

**Solução:**

1. Hard refresh: `Ctrl + Shift + R`
2. Limpar cache do browser
3. Testar em aba anônima

### Mudanças não aparecem

**Causa:** Deploy antigo em cache

**Solução:**

1. Force new deployment no Vercel
2. Ou: Settings > General > Force Invalidate Cache

---

## ⚡ Performance

### Otimizações Aplicadas

✅ Cache de assets estáticos (1 ano)
✅ Headers de segurança
✅ Minificação automática
✅ Gzip/Brotli compression
✅ CDN global (Edge Network)

### Melhorias Futuras

```javascript
// Lazy load de imagens
<img loading="lazy" src="logo.png">

// Preload de assets críticos
<link rel="preload" href="style.css" as="style">

// Defer de scripts não críticos
<script defer src="app.js"></script>
```

---

## 🌍 URLs do Projeto

Após deploy, você terá:

- **Produção:** `https://seu-projeto.vercel.app`
- **Preview:** `https://seu-projeto-git-branch.vercel.app`
- **Domínio custom:** `https://bomdequeijo.com.br` (se configurado)

**API Supabase:** `https://juquuhckfursjzbesofg.supabase.co`

---

## 📋 Checklist Final

Antes de marcar como concluído:

- [ ] ✅ Código commitado no GitHub
- [ ] ✅ Deploy feito na Vercel
- [ ] ✅ CORS configurado no Supabase
- [ ] ✅ RLS ativada no banco
- [ ] ✅ Migrations executadas
- [ ] ✅ Dados de teste criados
- [ ] ✅ Login admin funciona
- [ ] ✅ Login funcionário funciona
- [ ] ✅ Registro de ponto funciona
- [ ] ✅ Relatório de pagamentos funciona
- [ ] ✅ Mobile responsivo OK
- [ ] ✅ HTTPS ativo (certificado válido)

---

## 🎉 PRONTO!

Seu sistema está no ar e funcionando! 🚀

**Próximos Passos:**

1. Compartilhe o link com os funcionários
2. Cadastre funcionários reais no admin
3. Remova dados de teste (se desejar)
4. Configure domínio customizado
5. Monitore logs e uso

**Suporte:**

- Vercel Docs: https://vercel.com/docs
- Supabase Docs: https://supabase.com/docs
- GitHub Issues: (crie no seu repositório)

---

**Desenvolvido com ❤️ para Bom de Queijo**
