# 📝 Histórico de Alterações - Bom de Queijo

## 🆕 v2.1.0 - Fevereiro 2026 (Congelamento de Valor/Hora e Melhorias)

**Data:** 18/02/2026

### ⭐ Novos Recursos

#### 💰 Congelamento de Valor/Hora

- ✅ Campo `valor_hora` adicionado em `registros_ponto` para preservar histórico salarial
- ✅ Valor/hora é capturado e congelado no momento do registro
- ✅ Cálculos financeiros usam valor histórico, não o valor atual
- ✅ Aviso visual "⚠️ valor mudou" quando valor/hora do registro difere do atual
- ✅ Migração automática: registros antigos preenchidos com valor atual do funcionário

**Arquivos criados:**
- `database/add-valor-hora-registros.sql`: Script de migração SQL completo

**Arquivos modificados:**
- `frontend/js/app.js`: Busca e salva `valor_hora` ao registrar ponto (linha ~257)
- `frontend/js/admin.js`: 
  - Usa `registro.valor_hora` com fallback para `funcionario.valor_hora`
  - Exibe aviso quando valor mudou
  - Query `updateStats()` inclui campo `valor_hora`

#### ✏️ Edição de Funcionários

- ✅ Modal de edição completo (nome, PIN, valor/hora)
- ✅ Auto-reload após salvar para garantir sincronização
- ✅ Validação: PIN deve ter exatamente 4 dígitos
- ✅ Aviso quando editando valor/hora: "Registros antigos manterão o valor antigo"

**Arquivos modificados:**
- `frontend/js/admin.js`: Função `mostrarModalEditarFuncionario()` completa
- `frontend/pages/admin.html`: Estrutura do modal de edição

#### 🗑️ Exclusão de Registros

- ✅ Botão excluir registro (🗑️) funcionando
- ✅ Event listener global usando delegação de eventos
- ✅ Confirmação detalhada antes de excluir
- ✅ Atualização automática de todas as views após exclusão

**Arquivos modificados:**
- `frontend/js/admin.js`: Event listener movido para escopo global (linha ~547)

#### 🔍 Sincronização de Filtros

- ✅ Filtros da aba "Gestão de Pagamentos" atualizam cards do topo
- ✅ Filtros principais sincronizam com gestão de pagamentos
- ✅ Cards de estatísticas (Total a Pagar, Total de Horas) respeitam filtros aplicados

**Arquivos modificados:**
- `frontend/js/admin.js`: 
  - `applyPagamentoFiltersBtn` chama `updateStats()` e `loadRegistros()`
  - `applyFiltersBtn` chama `loadPagamentos()`

### 🐛 Correções

- ✅ Corrigido: `showMessage()` recebia parâmetros incorretos (substituído por `alert()`)
- ✅ Corrigido: Total a Pagar calculava com valor atual em vez de valor histórico
- ✅ Corrigido: Event listeners duplicados em elementos dinâmicos
- ✅ Corrigido: Filtros de pagamento não atualizavam cards do topo
- ✅ Corrigido: Botão excluir registro não respondia a cliques

### 📊 Migração de Banco de Dados

**Script executado com sucesso:**
```sql
-- Adicionar coluna valor_hora
ALTER TABLE registros_ponto ADD COLUMN IF NOT EXISTS valor_hora NUMERIC(10,2);

-- Preencher registros existentes
UPDATE registros_ponto rp 
SET valor_hora = f.valor_hora 
FROM funcionarios f 
WHERE rp.funcionario_id = f.id AND rp.valor_hora IS NULL;
```

**Resultado:** 10 registros migrados com sucesso

---

## 🆕 v2.0.0 - Janeiro 2026 (Sistema de Auditoria e Confiabilidade)

**Data:** 15/01/2026

### ⭐ Novos Recursos

#### 🛡️ Confiabilidade (Offline-First)

- ✅ Sistema offline-first com localStorage
- ✅ Registros de ponto salvos localmente quando offline
- ✅ Sincronização automática ao reconectar
- ✅ Retry automático (até 5 tentativas) para falhas de rede
- ✅ Listeners para eventos online/offline
- ✅ Validação de integridade antes de sincronizar

**Arquivos modificados:**

- `frontend/js/app.js`: Funções `salvarRegistroOffline()`, `sincronizarPendentes()`, retry logic

#### 📋 Sistema de Auditoria

- ✅ Tabela `historico_alteracoes` para rastrear edições
- ✅ Campos de auditoria em `registros_ponto` (editado, editado_em, editado_por)
- ✅ Funções RPC: `registrar_alteracao_admin()`, `obter_historico_registro()`
- ✅ Interface de edição com justificativa obrigatória
- ✅ Histórico completo por registro (antes/depois + motivo)
- ✅ Indicador visual ✏️ para registros editados

**Arquivos criados:**

- `database/instalar-auditoria.sql`: Script completo de instalação
- `IMPLEMENTAR-PILARES.md`: Documentação de implementação
- `ONDE-ESTAO-OS-BOTOES.md`: Guia do usuário

**Arquivos modificados:**

- `frontend/js/admin.js`: Funções de edição e histórico integradas
- `frontend/pages/admin.html`: Coluna "Ações" com botões ✏️ e 📋
- `frontend/css/style.css`: Estilos .btn-warning e .btn-icon-small

### 🎨 Interface

- ✅ Botões de ação na tabela de registros:
  - ✏️ Editar Entrada
  - ✏️ Editar Saída
  - 📋 Ver Histórico
- ✅ Modal de edição com campos data/hora e motivo obrigatório
- ✅ Modal de histórico com timeline de alterações

### 🔧 Melhorias Técnicas

- ✅ Tratamento robusto de erros de rede
- ✅ Mensagens de feedback para operações offline
- ✅ Validação de campos obrigatórios
- ✅ Timezone correto (America/Sao_Paulo) em todos os campos

### 📚 Documentação Atualizada

- ✅ `PROJETO-RESUMO.md`: Novos pilares adicionados
- ✅ `README.md`: Funcionalidades de auditoria documentadas
- ✅ `ARQUITETURA.md`: Estrutura de tabelas e funções RPC atualizadas
- ✅ `CHANGELOG.md`: Este arquivo criado

---

## 📦 v1.1.0 - Dezembro 2025 (Sistema de Pagamentos)

### ⭐ Novos Recursos

- ✅ Campo `pago` em registros_ponto
- ✅ Campo `data_pagamento` para tracking
- ✅ Filtros no dashboard admin (Todos/Pendentes/Pagos)
- ✅ Botão "Marcar como Pago"
- ✅ Cálculo de totais por status

**Arquivos criados:**

- `database/add-campo-pago.sql`

**Arquivos modificados:**

- `frontend/js/admin.js`: Tab de pagamentos
- `frontend/pages/admin.html`: Filtros e botões

---

## 🚀 v1.0.0 - Novembro 2025 (Release Inicial)

### ⭐ Funcionalidades Principais

- ✅ Registro de ponto (entrada/saída)
- ✅ Login via PIN (4 dígitos)
- ✅ Dashboard administrativo
- ✅ Cálculo automático de horas trabalhadas
- ✅ Valor/hora configurável por funcionário
- ✅ Tema dark responsivo
- ✅ Deploy Vercel + Supabase

**Arquivos criados:**

- `frontend/index.html`, `funcionario.html`, `admin.html`
- `frontend/js/app.js`, `admin.js`, `config.js`
- `frontend/css/style.css`
- `database/schema.sql`, `verificar-rls.sql`, `dados-simulacao.sql`
- `vercel.json`
- `README.md`, `DEPLOY-RAPIDO.md`, `SEGURANCA-E-DEPLOY.md`

---

## 📊 Estatísticas do Projeto

**Total de Arquivos:** ~20  
**Linhas de Código:** ~3000+  
**Tabelas no Banco:** 3 (funcionarios, registros_ponto, historico_alteracoes)  
**Funções RPC:** 4  
**Usuários de Teste:** 3 funcionários + 1 admin  
**Status:** ✅ Em produção

---

## 🔮 Roadmap Futuro

### Próximas Versões

- [ ] Relatórios em PDF
- [ ] Gráficos de produtividade
- [ ] Notificações push
- [ ] App mobile (PWA)
- [ ] Integração com WhatsApp
- [ ] Backup automático
- [ ] Multi-empresa
- [ ] API pública

---

**Mantido por:** Vitor Garcia  
**Última atualização:** 15/01/2026
