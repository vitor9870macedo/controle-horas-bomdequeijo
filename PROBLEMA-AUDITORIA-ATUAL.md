# 🔴 PROBLEMA ATUAL - AUDITORIA NÃO ESTÁ SALVANDO

**Data:** 31/01/2026  
**Status:** ❌ EM ANDAMENTO - NÃO RESOLVIDO

---

## 📋 RESUMO DO QUE ESTAMOS FAZENDO

### Funcionalidade Implementada: ✅ Geração de PDF da Folha de Pagamento

**Localização:** `frontend/pages/admin.html` + `frontend/js/admin.js`

**Funcionamento:**

- Botão "📄 Gerar PDF" na tela de Registros
- Respeita filtros aplicados (funcionário, data início/fim)
- PDF agrupado por funcionário quando filtro = "Todos"
- Cada funcionário tem subtotal, total geral no final
- Nome arquivo inteligente: `folha_pagamento_Nome_31-01-2026.pdf`

**Bibliotecas usadas:**

- jsPDF (geração de PDF)
- autoTable (tabelas no PDF)

**Status:** ✅ FUNCIONANDO PERFEITAMENTE

---

## 🐛 PROBLEMA ATUAL - Sistema de Auditoria

### O Que Está Acontecendo

**Sintoma:**

- Admin consegue editar horários (entrada/saída) ✅
- Alteração é salva no banco ✅
- **MAS:** Histórico de auditoria NÃO está sendo registrado ❌
- Mensagem de sucesso aparece, mas com aviso: "Alteração salva, mas auditoria falhou"

### Erro Exato

```
POST https://juquuhckfursjzbesofg.supabase.co/rest/v1/rpc/registrar_alteracao_admin 404 (Not Found)

{
  code: 'PGRST202',
  details: 'Searched for the function public.registrar_alteracao_admin with parameters p_campo_alterado, p_funcionario_id, p_motivo, p_registro_id, p_tabela, p_valor_anterior, p_valor_novo or with a single unnamed json/jsonb parameter, but no matches were found in the schema cache.',
  hint: 'Perhaps you meant to call the function public.registrar_alteracao_admin(p_admin_nome, p_campo_alterado, p_funcionario_id, p_motivo, p_registro_id, p_tabela, p_valor_anterior, p_valor_novo)',
  message: 'Could not find the function public.registrar_alteracao_admin(...) in the schema cache'
}
```

### Diagnóstico

**CAUSA RAIZ:** Ordem dos parâmetros da função SQL no Supabase está diferente do que o JavaScript está enviando

**O que o erro indica:**

- Função existe no banco ✅
- Mas os parâmetros estão em ordem diferente ❌
- Supabase usa assinatura: `(p_admin_nome, p_campo_alterado, p_funcionario_id, p_motivo, p_registro_id, p_tabela, p_valor_anterior, p_valor_novo)`

---

## 🔧 O QUE JÁ TENTAMOS (SEM SUCESSO)

### Tentativa 1: Ajustar ordem alfabética

```javascript
// admin.js - linha ~32
await supabase.rpc("registrar_alteracao_admin", {
  p_admin_nome: adminNome,
  p_campo_alterado: campoAlterado,
  p_funcionario_id: funcionarioId,
  p_motivo: motivo,
  p_registro_id: registroId,
  p_tabela: tabela,
  p_valor_anterior: valorAnterior,
  p_valor_novo: valorNovo,
});
```

**Resultado:** ❌ Ainda com erro 404

### Tentativa 2: Criar script SQL de correção

- Arquivo: `database/fix-auditoria.sql`
- Drop e recriar funções
  **Resultado:** ❌ Não resolveu (função já existe no banco com assinatura específica)

---

## 📊 ESTRUTURA ATUAL DO BANCO

### Tabela: `historico_alteracoes`

```sql
CREATE TABLE historico_alteracoes (
    id UUID PRIMARY KEY,
    nome_da_tabela TEXT NOT NULL,      -- ⚠️ Nome diferente!
    registro_id UUID NOT NULL,
    funcionario_id UUID,
    admin_nome TEXT,
    da_operacao TEXT NOT NULL,         -- ⚠️ Nome diferente!
    campo_alterado TEXT,
    valor_anterior TEXT,
    valor_novo TEXT,
    motivo TEXT,
    endereco_ip TEXT,
    user_agent TEXT,
    timestamp_criado TIMESTAMPTZ       -- ⚠️ Nome diferente!
);
```

**⚠️ ATENÇÃO:** Nomes de colunas não são padrão:

- `nome_da_tabela` (ao invés de `tabela`)
- `da_operacao` (ao invés de `operacao`)
- `timestamp_criado` (ao invés de `created_at`)

### Função SQL Atual no Banco

```sql
CREATE OR REPLACE FUNCTION registrar_alteracao_admin(
    p_admin_nome TEXT,        -- ← PRIMEIRO PARÂMETRO
    p_campo_alterado TEXT,
    p_funcionario_id UUID,
    p_motivo TEXT,
    p_registro_id UUID,
    p_tabela TEXT,
    p_valor_anterior TEXT,
    p_valor_novo TEXT
)
```

---

## 🎯 PRÓXIMOS PASSOS PARA RESOLVER

### Opção 1: Ajustar JavaScript (RECOMENDADO)

Garantir que `admin.js` envie parâmetros **exatamente** na ordem que o banco espera.

**Verificar em:** `frontend/js/admin.js` linha ~32

### Opção 2: Recriar função no Supabase

1. Ir em Supabase → SQL Editor
2. Buscar função atual:
   ```sql
   SELECT * FROM pg_proc WHERE proname = 'registrar_alteracao_admin';
   ```
3. Deletar todas as versões:
   ```sql
   DROP FUNCTION IF EXISTS registrar_alteracao_admin CASCADE;
   ```
4. Recriar com ordem correta dos parâmetros

### Opção 3: Verificar se função existe

```sql
-- Ver assinatura exata da função
SELECT
    p.proname AS function_name,
    pg_get_function_arguments(p.oid) AS parameters
FROM pg_proc p
WHERE p.proname LIKE 'registrar_alteracao%';
```

---

## 📝 ARQUIVOS ENVOLVIDOS

### Frontend

- `frontend/js/admin.js` - Linha 15-50: Função `registrarAlteracao()`
- `frontend/js/admin.js` - Linha 75-150: Função `editarHorario()`

### Database

- `database/criar-funcoes-auditoria.sql` - Funções originais
- `database/instalar-auditoria.sql` - Setup completo
- `database/fix-auditoria.sql` - ⚠️ Tentativa de correção (não funcionou)

### Bibliotecas

- Supabase JS Client v2
- jsPDF v2.5.1
- jsPDF-autotable v3.5.31

---

## ✅ O QUE ESTÁ FUNCIONANDO

1. ✅ Login admin
2. ✅ Edição de horários (entrada/saída)
3. ✅ Cálculo automático de horas
4. ✅ Atualização da tabela `registros_ponto`
5. ✅ Campos de auditoria (`editado`, `editado_em`, `editado_por`)
6. ✅ Geração de PDF da folha de pagamento
7. ✅ Filtros e busca

## ❌ O QUE NÃO ESTÁ FUNCIONANDO

1. ❌ Inserção na tabela `historico_alteracoes` via função RPC
2. ❌ Botão "Histórico" (não mostra nada porque não há registros)

---

## 🔍 INFORMAÇÕES PARA DEBUG

**URL Supabase:** `https://juquuhckfursjzbesofg.supabase.co`

**Função RPC que está falhando:**

```
/rest/v1/rpc/registrar_alteracao_admin
```

**Mensagem do hint do erro:**

```
Perhaps you meant to call the function public.registrar_alteracao_admin(
  p_admin_nome,
  p_campo_alterado,
  p_funcionario_id,
  p_motivo,
  p_registro_id,
  p_tabela,
  p_valor_anterior,
  p_valor_novo
)
```

---

## 💡 POSSÍVEL SOLUÇÃO RÁPIDA

Verificar se há **múltiplas versões** da função no banco com assinaturas diferentes:

```sql
-- Ver todas as funções de auditoria
SELECT
    p.proname,
    pg_get_function_identity_arguments(p.oid) as args,
    p.pronargs as num_args
FROM pg_proc p
WHERE p.proname LIKE '%auditoria%' OR p.proname LIKE '%alteracao%';
```

Se houver múltiplas, **deletar TODAS** e recriar apenas uma com ordem correta.

---

**ÚLTIMA ALTERAÇÃO:** JavaScript ajustado para ordem alfabética dos parâmetros  
**RESULTADO:** Ainda com erro 404 (função não encontrada com essa assinatura)

---

## 📞 PARA CONTINUAR

1. Verificar assinatura exata da função no Supabase
2. Ajustar JavaScript ou SQL para bater
3. Testar edição de horário
4. Verificar se registro aparece em `historico_alteracoes`
5. Testar botão "Histórico"

**BOA SORTE! 🍀**
