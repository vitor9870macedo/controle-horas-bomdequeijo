# 📝 Guia Git - Controle de Versão

## ✅ Configuração Inicial (JÁ FEITA!)

```bash
✅ git init
✅ git config user.name "Bom de Queijo"
✅ git config user.email "dev@bomdequeijo.com"
✅ Commit inicial criado (9a7c78a)
```

---

## 🔄 Comandos Básicos do Dia a Dia

### Ver status dos arquivos

```bash
git status
```

### Adicionar mudanças

```bash
# Adicionar arquivo específico
git add frontend/js/app.js

# Adicionar todos os arquivos modificados
git add .

# Adicionar apenas arquivos JS
git add *.js
```

### Fazer commit

```bash
# Commit com mensagem
git commit -m "fix: corrigir cálculo de horas"

# Commit com descrição detalhada
git commit -m "feat: adicionar filtro por período" -m "Permite filtrar registros por data inicial e final no dashboard admin"
```

### Ver histórico

```bash
# Histórico resumido
git log --oneline

# Histórico completo
git log

# Últimos 5 commits
git log -5 --oneline
```

---

## 🌿 Branches (Ramificações)

### Ver branches

```bash
git branch
```

### Criar nova branch

```bash
# Criar e mudar para nova branch
git checkout -b feature/novo-relatorio

# Criar branch sem mudar
git branch feature/exportar-pdf
```

### Mudar de branch

```bash
git checkout master
git checkout feature/novo-relatorio
```

### Mesclar branches

```bash
# Voltar para master
git checkout master

# Mesclar feature na master
git merge feature/novo-relatorio
```

### Deletar branch

```bash
git branch -d feature/novo-relatorio
```

---

## 🔙 Desfazer Mudanças

### Descartar mudanças não commitadas

```bash
# Descartar mudanças em arquivo específico
git checkout -- frontend/js/app.js

# Descartar TODAS as mudanças
git reset --hard
```

### Desfazer último commit (mantendo mudanças)

```bash
git reset --soft HEAD~1
```

### Desfazer último commit (descartando mudanças)

```bash
git reset --hard HEAD~1
```

---

## 📤 Conectar com GitHub

### 1. Criar repositório no GitHub

1. Acesse https://github.com
2. Clique em "New repository"
3. Nome: `controle-ponto-bom-de-queijo`
4. **NÃO** marque "Initialize with README"
5. Clique em "Create repository"

### 2. Conectar repositório local

```bash
# Adicionar remote
git remote add origin https://github.com/SEU-USUARIO/controle-ponto-bom-de-queijo.git

# Verificar remote
git remote -v

# Enviar para GitHub
git push -u origin master
```

### 3. Comandos após setup

```bash
# Enviar commits
git push

# Baixar mudanças
git pull

# Clonar em outro PC
git clone https://github.com/SEU-USUARIO/controle-ponto-bom-de-queijo.git
```

---

## 📊 Padrões de Commit (Conventional Commits)

Use esses prefixos para commits organizados:

```bash
# Nova funcionalidade
git commit -m "feat: adicionar gráfico de horas mensais"

# Correção de bug
git commit -m "fix: corrigir timezone em horário de verão"

# Documentação
git commit -m "docs: atualizar README com instruções de deploy"

# Estilo/formatação
git commit -m "style: ajustar espaçamento no dashboard"

# Refatoração
git commit -m "refactor: reorganizar função de cálculo de horas"

# Performance
git commit -m "perf: otimizar query de relatórios"

# Testes
git commit -m "test: adicionar testes para validação de PIN"

# Build/CI
git commit -m "chore: atualizar dependências do npm"
```

---

## 🎯 Workflow Recomendado

### Desenvolvimento de nova feature:

```bash
# 1. Criar branch
git checkout -b feature/exportar-pdf

# 2. Fazer mudanças nos arquivos
# ... editar código ...

# 3. Ver o que mudou
git status
git diff

# 4. Adicionar mudanças
git add .

# 5. Commit
git commit -m "feat: adicionar exportação em PDF"

# 6. Voltar para master
git checkout master

# 7. Mesclar feature
git merge feature/exportar-pdf

# 8. Deletar branch (opcional)
git branch -d feature/exportar-pdf

# 9. Enviar para GitHub
git push
```

---

## 🔍 Comandos Úteis

### Ver mudanças antes de adicionar

```bash
git diff
```

### Ver mudanças após adicionar (staged)

```bash
git diff --staged
```

### Ver quem modificou cada linha

```bash
git blame frontend/js/app.js
```

### Buscar em commits

```bash
git log --grep="PIN"
```

### Ver arquivos em commit específico

```bash
git show 9a7c78a
```

### Criar tag de versão

```bash
git tag v1.0.0
git push --tags
```

---

## 🚨 Boas Práticas

✅ **FAÇA:**

- Commits pequenos e frequentes
- Mensagens claras e descritivas
- Push diário para GitHub (backup)
- Branches para features grandes
- `.gitignore` para não versionar `.env`, `node_modules/`

❌ **NÃO FAÇA:**

- Commitar arquivos com senhas/chaves
- Commits gigantes com 50 mudanças
- Mensagens vagas: "fix", "update", "teste"
- Trabalhar direto na master em equipe
- Deletar .git sem backup

---

## 📦 Arquivo Atual: .gitignore

```gitignore
node_modules/        # Dependências npm
.env                 # Credenciais (NUNCA commitar!)
.DS_Store            # Arquivo Mac
*.log                # Logs
.vercel              # Cache Vercel
```

---

## 🎓 Próximos Passos

1. ✅ **Local:** Já está configurado!
2. 🔜 **GitHub:** Criar repositório e fazer push
3. 🔜 **Vercel:** Conectar GitHub para deploy automático
4. 🔜 **Equipe:** Convidar colaboradores

**Commit atual:**

```
9a7c78a (HEAD -> master) feat: Sistema de controle de ponto inicial
18 arquivos | 3038 linhas adicionadas
```

---

## 💡 Dica Final

A cada mudança importante, faça:

```bash
git add .
git commit -m "tipo: descrição clara"
git push  # Se conectado ao GitHub
```

Isso garante que você nunca perca código e pode voltar a qualquer versão anterior! 🚀
