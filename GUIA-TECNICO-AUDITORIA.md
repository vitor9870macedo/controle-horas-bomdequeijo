# 🛠️ Guia Técnico - Sistema de Auditoria e Confiabilidade

**Versão:** 2.0.0  
**Data:** 15/01/2026

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Arquitetura](#arquitetura)
3. [Confiabilidade (Offline-First)](#confiabilidade-offline-first)
4. [Sistema de Auditoria](#sistema-de-auditoria)
5. [Instalação](#instalação)
6. [Uso](#uso)
7. [Troubleshooting](#troubleshooting)

---

## 🎯 Visão Geral

Implementação dos **dois pilares críticos** do sistema:

### 🛡️ CONFIABILIDADE

Garantir que registros de ponto nunca se percam, mesmo com problemas de rede.

**Solução:** Sistema offline-first com localStorage e sincronização automática.

### 📋 AUDITORIA

Rastrear todas as alterações manuais feitas pelo administrador.

**Solução:** Tabela de histórico com justificativas obrigatórias e timeline completa.

---

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────┐
│                FUNCIONÁRIO                       │
│                                                  │
│  1. Registra ponto (online/offline)             │
│  2. Dados salvos no localStorage (pendentes)    │
│  3. Sincronização automática ao reconectar      │
│  4. Retry em caso de falha (até 5x)             │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│              SUPABASE DATABASE                   │
│                                                  │
│  registros_ponto:                               │
│  ├─ entrada, saida, total_horas                 │
│  ├─ editado (bool)                              │
│  ├─ editado_em (timestamp)                      │
│  └─ editado_por (texto)                         │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│                   ADMIN                          │
│                                                  │
│  1. Visualiza registros na tabela               │
│  2. Clica em ✏️ para editar entrada/saída       │
│  3. Preenche justificativa (obrigatória)        │
│  4. Sistema registra em historico_alteracoes    │
│  5. Marca registro como editado (✏️ indicator)  │
│  6. Pode ver histórico completo (📋 botão)      │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│          TABELA: historico_alteracoes            │
│                                                  │
│  Cada alteração registra:                       │
│  ├─ Quem fez (admin_nome)                       │
│  ├─ O que alterou (campo_alterado)              │
│  ├─ Valor anterior                              │
│  ├─ Valor novo                                  │
│  ├─ Por que (motivo)                            │
│  └─ Quando (timestamp_criado)                   │
└─────────────────────────────────────────────────┘
```

---

## 🛡️ Confiabilidade (Offline-First)

### Como Funciona

#### 1. Detecção de Estado de Rede

```javascript
// Listeners para mudanças de conectividade
window.addEventListener("online", () => {
  sincronizarPendentes(); // Sincroniza automaticamente
});

window.addEventListener("offline", () => {
  console.log("Modo offline ativado");
});
```

#### 2. Salvamento Local

```javascript
const STORAGE_KEY = "bomdequeijo_registros_pendentes";

async function salvarRegistroOffline(registro) {
  const pendentes = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");

  const registroComMetadata = {
    ...registro,
    _tentativas: 0,
    _timestamp: new Date().toISOString(),
  };

  pendentes.push(registroComMetadata);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(pendentes));
}
```

#### 3. Sincronização Inteligente

```javascript
async function sincronizarPendentes() {
    if (!navigator.onLine) return; // Aguarda conexão

    const pendentes = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');

    for (const registro of pendentes) {
        try {
            // Tenta enviar para Supabase
            await supabase.from('registros_ponto').insert({...});

            // Remove da lista de pendentes
            removerDaListaPendente(registro);

        } catch (error) {
            registro._tentativas++;

            if (registro._tentativas >= 5) {
                // Falha permanente - alerta o usuário
                alert('Erro crítico ao sincronizar registro');
            }
        }
    }
}
```

#### 4. Retry Exponencial

| Tentativa | Delay        |
| --------- | ------------ |
| 1         | Imediato     |
| 2         | 2s           |
| 3         | 4s           |
| 4         | 8s           |
| 5         | 16s (última) |

---

## 📋 Sistema de Auditoria

### Estrutura de Dados

#### Tabela: `historico_alteracoes`

```sql
CREATE TABLE historico_alteracoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome_da_tabela TEXT NOT NULL,        -- Ex: 'registros_ponto'
    registro_id UUID NOT NULL,           -- ID do registro alterado
    funcionario_id UUID,                 -- Qual funcionário foi afetado
    admin_nome TEXT,                     -- Nome do admin que fez a edição
    da_operacao TEXT NOT NULL,           -- 'UPDATE', 'INSERT', 'DELETE'
    campo_alterado TEXT,                 -- 'entrada' ou 'saida'
    valor_anterior TEXT,                 -- Antes: "2026-01-15T08:00:00"
    valor_novo TEXT,                     -- Depois: "2026-01-15T08:30:00"
    motivo TEXT,                         -- "Funcionário esqueceu de bater"
    endereco_ip TEXT,                    -- IP do admin (futuro)
    user_agent TEXT,                     -- Browser usado (futuro)
    timestamp_criado TIMESTAMPTZ         -- Quando foi editado
);
```

#### Campos em `registros_ponto`

```sql
ALTER TABLE registros_ponto
ADD COLUMN editado BOOLEAN DEFAULT false,
ADD COLUMN editado_em TIMESTAMP WITH TIME ZONE,
ADD COLUMN editado_por TEXT;
```

### Funções RPC

#### `registrar_alteracao_admin()`

Registra uma alteração no histórico.

**Parâmetros:**

- `p_tabela` - Nome da tabela ("registros_ponto")
- `p_registro_id` - UUID do registro
- `p_funcionario_id` - UUID do funcionário
- `p_admin_nome` - Nome do admin logado
- `p_campo_alterado` - "entrada" ou "saida"
- `p_valor_anterior` - Valor antigo (ISO string)
- `p_valor_novo` - Valor novo (ISO string)
- `p_motivo` - Justificativa (obrigatória)

**Retorno:** UUID do registro de histórico criado

#### `obter_historico_registro()`

Recupera histórico de alterações.

**Parâmetros:**

- `p_tabela` - "registros_ponto"
- `p_registro_id` - UUID do registro

**Retorno:** Tabela com todas as alterações ordenadas por data (mais recente primeiro)

### Fluxo de Edição

```javascript
async function editarHorario(registroId, campoAlterado) {
  // 1. Obter valor atual
  const { data: registro } = await supabase
    .from("registros_ponto")
    .select("*")
    .eq("id", registroId)
    .single();

  const valorAnterior = registro[campoAlterado];

  // 2. Mostrar modal para usuário
  const { novoValor, motivo } = await mostrarModalEdicao();

  if (!motivo) {
    alert("Motivo é obrigatório!");
    return;
  }

  // 3. Atualizar o registro
  await supabase
    .from("registros_ponto")
    .update({
      [campoAlterado]: novoValor,
      editado: true,
      editado_em: new Date().toISOString(),
      editado_por: "Admin",
    })
    .eq("id", registroId);

  // 4. Registrar no histórico
  await supabase.rpc("registrar_alteracao_admin", {
    p_tabela: "registros_ponto",
    p_registro_id: registroId,
    p_funcionario_id: registro.funcionario_id,
    p_admin_nome: "Admin",
    p_campo_alterado: campoAlterado,
    p_valor_anterior: valorAnterior,
    p_valor_novo: novoValor,
    p_motivo: motivo,
  });

  // 5. Recarregar tabela
  loadRegistros();
}
```

---

## 🚀 Instalação

### Pré-requisitos

- Supabase configurado
- Tabelas `funcionarios` e `registros_ponto` já existentes

### Passo 1: Executar Script SQL

```bash
# No Supabase SQL Editor
1. Abrir database/instalar-auditoria.sql
2. Clicar em "Run" (não "Save"!)
3. Aguardar "Sucesso. Nenhuma linha retornada"
```

**O que esse script faz:**

1. ✅ Apaga tabela e funções antigas (se existirem)
2. ✅ Cria tabela `historico_alteracoes`
3. ✅ Cria índices para performance
4. ✅ Habilita RLS com políticas
5. ✅ Cria funções `registrar_alteracao_admin()` e `obter_historico_registro()`
6. ✅ Adiciona campos `editado`, `editado_em`, `editado_por` em `registros_ponto`

### Passo 2: Verificar Instalação

```sql
-- Verificar se tabela foi criada
SELECT * FROM historico_alteracoes;

-- Verificar se funções existem
SELECT routine_name
FROM information_schema.routines
WHERE routine_name IN ('registrar_alteracao_admin', 'obter_historico_registro');

-- Verificar campos novos
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'registros_ponto'
  AND column_name IN ('editado', 'editado_em', 'editado_por');
```

### Passo 3: Deploy Frontend

```bash
# Fazer commit das mudanças
git add .
git commit -m "feat: sistema de auditoria e offline-first"
git push

# Vercel faz deploy automático
# Aguardar ~30 segundos
```

### Passo 4: Limpar Cache

No navegador:

1. **Ctrl + F5** (Windows) ou **Cmd + Shift + R** (Mac)
2. Ou: DevTools > Network > Disable cache

---

## 📖 Uso

### Para Funcionários

#### Registro Normal (Online)

1. Seleciona nome
2. Digita PIN
3. Clica "Registrar Ponto"
4. ✅ Salvo imediatamente no Supabase

#### Registro Offline

1. Seleciona nome
2. Digita PIN
3. Clica "Registrar Ponto"
4. 💾 Mensagem: "Registro salvo localmente (offline)"
5. ⏳ Aguarda conexão voltar
6. 🔄 Sincronização automática ao reconectar
7. ✅ Confirmação: "Registros sincronizados com sucesso"

### Para Administradores

#### Editar Horário

1. **Acessar painel admin**

   - https://controle-horas-bomdequeijo.vercel.app/frontend/pages/admin.html

2. **Localizar registro na tabela**

   - Coluna "Ações" tem 3 botões:
     - ✏️ **Editar Entrada**
     - ✏️ **Editar Saída**
     - 📋 **Ver Histórico**

3. **Clicar em ✏️ Editar Entrada (ou Saída)**

   - Modal abre com:
     - Campo de data/hora (tipo datetime-local)
     - Campo de motivo (textarea, obrigatório)

4. **Preencher justificativa**

   - Ex: "Funcionário esqueceu de registrar"
   - Ex: "Correção de erro no sistema"
   - Ex: "Ajuste solicitado pelo funcionário"

5. **Salvar**
   - Sistema atualiza o registro
   - Adiciona ✏️ ao lado do horário editado
   - Registra no histórico

#### Ver Histórico

1. **Clicar em 📋 Ver Histórico**
2. Modal mostra **todas as alterações** daquele registro:

   ```
   🕐 15/01/2026 14:35 - Admin
   Campo: entrada
   Antes: 15/01/2026 08:00
   Depois: 15/01/2026 08:30
   Motivo: Funcionário esqueceu de bater

   🕐 15/01/2026 10:20 - Admin
   Campo: saida
   Antes: 15/01/2026 12:00
   Depois: 15/01/2026 13:00
   Motivo: Saiu mais tarde devido a demanda
   ```

---

## 🔧 Troubleshooting

### Erro: "Could not find the function registrar_alteracao_admin"

**Causa:** Funções não foram criadas no Supabase.

**Solução:**

1. Abrir Supabase SQL Editor
2. Executar `database/instalar-auditoria.sql`
3. Clicar em **RUN** (não "Save")
4. Aguardar "Sucesso"
5. Recarregar página admin (Ctrl+F5)

---

### Erro: "Searched for function... but no matches were found in the schema cache"

**Causa:** Schema cache desatualizado.

**Solução:**

1. Recriar as funções:
   ```sql
   DROP FUNCTION IF EXISTS registrar_alteracao_admin CASCADE;
   DROP FUNCTION IF EXISTS obter_historico_registro CASCADE;
   ```
2. Executar `instalar-auditoria.sql` novamente

---

### Botões de edição não aparecem

**Causa:** Cache do navegador.

**Solução:**

1. **Ctrl + F5** para hard refresh
2. Ou: Limpar cache do site:
   - Chrome: DevTools > Application > Clear site data
   - Firefox: Preferências > Privacidade > Limpar dados

---

### Registros não sincronizam

**Causa:** Muitas tentativas falhadas.

**Solução:**

1. Abrir DevTools (F12)
2. Console > verificar mensagens de erro
3. Limpar localStorage:
   ```javascript
   localStorage.removeItem("bomdequeijo_registros_pendentes");
   ```
4. Registrar novamente

---

### Modal de edição não abre

**Causa:** Erro de JavaScript.

**Solução:**

1. Verificar console (F12)
2. Conferir se `admin.js` está carregado:
   ```javascript
   console.log(typeof mostrarModalEdicao); // deve ser "function"
   ```
3. Recarregar página (Ctrl+F5)

---

## 📊 Monitoramento

### Verificar Registros Pendentes

```javascript
// No console do navegador (F12)
const pendentes = JSON.parse(
  localStorage.getItem("bomdequeijo_registros_pendentes") || "[]"
);
console.log("Registros pendentes:", pendentes.length);
console.log(pendentes);
```

### Verificar Histórico no Banco

```sql
-- Todos os registros de auditoria
SELECT * FROM historico_alteracoes
ORDER BY timestamp_criado DESC
LIMIT 10;

-- Alterações de um funcionário específico
SELECT * FROM historico_alteracoes
WHERE funcionario_id = 'UUID_DO_FUNCIONARIO'
ORDER BY timestamp_criado DESC;

-- Contagem por admin
SELECT admin_nome, COUNT(*) as total_edicoes
FROM historico_alteracoes
GROUP BY admin_nome;
```

### Registros Editados

```sql
-- Listar todos os registros que foram editados
SELECT
    f.nome,
    r.data,
    r.entrada,
    r.saida,
    r.editado_em,
    r.editado_por
FROM registros_ponto r
JOIN funcionarios f ON r.funcionario_id = f.id
WHERE r.editado = true
ORDER BY r.editado_em DESC;
```

---

## 🎓 Boas Práticas

### ✅ FAZER

- ✅ Sempre adicionar motivo detalhado ao editar
- ✅ Verificar histórico antes de editar novamente
- ✅ Testar modo offline periodicamente
- ✅ Revisar auditoria semanalmente

### ❌ NÃO FAZER

- ❌ Editar sem justificativa
- ❌ Apagar registros do histórico manualmente
- ❌ Modificar localStorage diretamente
- ❌ Desabilitar RLS na tabela de histórico

---

## 📞 Suporte

**Dúvidas?** Consulte:

- [PROJETO-RESUMO.md](PROJETO-RESUMO.md) - Visão geral
- [ARQUITETURA.md](ARQUITETURA.md) - Detalhes técnicos
- [CHANGELOG.md](CHANGELOG.md) - Histórico de versões

---

**Versão:** 2.0.0  
**Última atualização:** 15/01/2026  
**Mantido por:** Vitor Garcia
