# 💰 Adicionar Funcionalidade de Valor/Hora

## 🗄️ Passo 1: Atualizar Banco de Dados

### Execute no Supabase SQL Editor:

1. Acesse seu projeto no Supabase
2. Menu lateral → **SQL Editor**
3. Clique em **New Query**
4. Copie e cole o código abaixo:

```sql
-- Adicionar campo valor_hora na tabela funcionarios
ALTER TABLE funcionarios
ADD COLUMN valor_hora NUMERIC(10,2) DEFAULT 0;

-- Atualizar funcionários existentes com um valor padrão (R$ 15,00/hora)
UPDATE funcionarios
SET valor_hora = 15.00
WHERE valor_hora IS NULL OR valor_hora = 0;

-- Comentário: valor_hora armazena quanto o funcionário recebe por hora trabalhada
COMMENT ON COLUMN funcionarios.valor_hora IS 'Valor em reais que o funcionário recebe por hora trabalhada';
```

5. Clique em **Run** (ou Ctrl+Enter)
6. ✅ Deve aparecer: "Success"

---

## ✨ Funcionalidades Adicionadas:

### 1️⃣ **Card "Total a Pagar"**

- Nova estatística no dashboard
- Mostra em verde o valor total que deve ser pago aos funcionários
- Calculado automaticamente: `Horas Trabalhadas × Valor/Hora`

### 2️⃣ **Campo Valor/Hora por Funcionário**

- Coluna editável na tabela de funcionários
- Admin pode definir quanto cada um ganha por hora
- Atualização em tempo real (digite e tecle Enter)

### 3️⃣ **Coluna "Valor a Receber"**

- Nova coluna na tabela de registros
- Mostra quanto cada funcionário vai receber por aquele registro
- Cálculo: `Total de Horas × Valor/Hora do funcionário`

### 4️⃣ **Formulário de Adicionar Funcionário**

- Novo campo: "Valor/Hora (R$)"
- Obrigatório ao cadastrar novo funcionário
- Aceita valores decimais (ex: 15.50)

### 5️⃣ **Exportação CSV Atualizada**

- Excel agora inclui coluna "Valor a Receber"
- Facilita cálculos de folha de pagamento

---

## 📊 Como Usar:

### Definir Valor/Hora:

**Ao Adicionar Funcionário:**

1. Clique em "+ Adicionar Funcionário"
2. Preencha Nome, PIN e **Valor/Hora**
3. Exemplo: R$ 15.00, R$ 18.50, R$ 20.00
4. Salvar

**Para Funcionários Existentes:**

1. Vá na tabela "Gerenciar Funcionários"
2. Na coluna "Valor/Hora (R$)", digite o novo valor
3. Tecle Enter ou clique fora do campo
4. ✅ Atualizado automaticamente!

### Ver Valores:

**Dashboard:**

- **Total a Pagar:** Soma de tudo que deve ser pago
- Verde brilhante para destaque

**Tabela de Registros:**

- Cada linha mostra "Valor a Receber"
- Exemplo: 8h × R$ 15,00 = **R$ 120,00**

**Exportar:**

- CSV completo com todos os valores
- Pronto para importar no Excel

---

## 🧮 Exemplos de Cálculo:

### Funcionário: João Silva

- **Valor/Hora:** R$ 15,00
- **Trabalhou:** 8 horas e 30 minutos (8.5h)
- **Recebe:** R$ 127,50

### Funcionário: Maria Santos

- **Valor/Hora:** R$ 18,00
- **Trabalhou:** 6 horas (6h)
- **Recebe:** R$ 108,00

### Total a Pagar (Dashboard):

- João: R$ 127,50
- Maria: R$ 108,00
- **Total:** R$ 235,50

---

## ✅ Checklist de Teste:

1. ✅ Executar SQL no Supabase
2. ✅ Recarregar página do admin
3. ✅ Ver 4º card "Total a Pagar"
4. ✅ Adicionar novo funcionário com valor/hora
5. ✅ Editar valor/hora de funcionário existente
6. ✅ Ver "Valor a Receber" na tabela de registros
7. ✅ Exportar CSV e conferir coluna

---

## 🎨 Aparência:

- **Total a Pagar:** Verde neon (#00ff88)
- **Valor a Receber:** Verde destaque
- **Input Valor/Hora:** Campo editável inline
- **Formulário:** Campo obrigatório com placeholder

---

## 💡 Dicas:

- Valores padrão: R$ 15,00 (já aplicado aos existentes)
- Aceita centavos: 15.50, 18.75, etc
- Atualização instantânea ao digitar
- Cálculos automáticos em tempo real

Pronto para usar! 💰
