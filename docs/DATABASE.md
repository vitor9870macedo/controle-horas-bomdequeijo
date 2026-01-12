# 🗄️ Documentação do Banco de Dados

Documentação completa da estrutura do banco de dados PostgreSQL usado no sistema.

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Tabelas](#tabelas)
- [Relacionamentos](#relacionamentos)
- [Índices](#índices)
- [Políticas de Segurança](#políticas-de-segurança)
- [Funções e Triggers](#funções-e-triggers)
- [Queries Úteis](#queries-úteis)

---

## Visão Geral

O banco de dados utiliza **PostgreSQL** (via Supabase) com as seguintes características:

- ✅ Row Level Security (RLS) habilitado
- ✅ Timezone: America/Sao_Paulo (GMT-3)
- ✅ Triggers automáticos para updated_at
- ✅ Constraints para integridade de dados

---

## Tabelas

### 1. `funcionarios`

Armazena informações dos funcionários.

| Coluna       | Tipo        | Descrição             | Constraints                                                        |
| ------------ | ----------- | --------------------- | ------------------------------------------------------------------ |
| `id`         | UUID        | Identificador único   | PRIMARY KEY, DEFAULT gen_random_uuid()                             |
| `nome`       | TEXT        | Nome completo         | NOT NULL                                                           |
| `pin`        | TEXT        | PIN de 4 dígitos      | NOT NULL                                                           |
| `role`       | TEXT        | Tipo de usuário       | NOT NULL, DEFAULT 'funcionario', CHECK IN ('admin', 'funcionario') |
| `ativo`      | BOOLEAN     | Status do funcionário | DEFAULT true                                                       |
| `created_at` | TIMESTAMPTZ | Data de criação       | DEFAULT now() (Brasília)                                           |
| `updated_at` | TIMESTAMPTZ | Última atualização    | DEFAULT now() (Brasília)                                           |

**Exemplo de registro:**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "nome": "João Silva",
  "pin": "1234",
  "role": "funcionario",
  "ativo": true,
  "created_at": "2026-01-12T18:30:00-03:00",
  "updated_at": "2026-01-12T18:30:00-03:00"
}
```

---

### 2. `registros_ponto`

Armazena todos os registros de ponto (entradas e saídas).

| Coluna           | Tipo         | Descrição                  | Constraints                                                |
| ---------------- | ------------ | -------------------------- | ---------------------------------------------------------- |
| `id`             | UUID         | Identificador único        | PRIMARY KEY, DEFAULT gen_random_uuid()                     |
| `funcionario_id` | UUID         | Referência ao funcionário  | NOT NULL, FOREIGN KEY → funcionarios(id) ON DELETE CASCADE |
| `data`           | DATE         | Data do registro           | NOT NULL                                                   |
| `entrada`        | TIMESTAMPTZ  | Horário de entrada         | NULL (preenchido ao registrar entrada)                     |
| `saida`          | TIMESTAMPTZ  | Horário de saída           | NULL (preenchido ao registrar saída)                       |
| `total_horas`    | NUMERIC(5,2) | Total de horas trabalhadas | NULL (calculado ao registrar saída)                        |
| `created_at`     | TIMESTAMPTZ  | Data de criação            | DEFAULT now() (Brasília)                                   |
| `updated_at`     | TIMESTAMPTZ  | Última atualização         | DEFAULT now() (Brasília)                                   |

**Exemplo de registro:**

```json
{
  "id": "660e8400-e29b-41d4-a716-446655440001",
  "funcionario_id": "550e8400-e29b-41d4-a716-446655440000",
  "data": "2026-01-12",
  "entrada": "2026-01-12T18:00:00-03:00",
  "saida": "2026-01-12T23:00:00-03:00",
  "total_horas": 5.0,
  "created_at": "2026-01-12T18:00:00-03:00",
  "updated_at": "2026-01-12T23:00:00-03:00"
}
```

---

## Relacionamentos

```
funcionarios (1) ──────── (N) registros_ponto
    ↑                           ↓
    id                    funcionario_id
```

**Relacionamento:**

- Um funcionário pode ter **muitos** registros de ponto
- Cada registro pertence a **um** funcionário
- **ON DELETE CASCADE**: Se um funcionário for deletado, todos seus registros são removidos

---

## Índices

Índices criados para otimizar consultas:

```sql
-- Buscar registros de um funcionário específico
CREATE INDEX idx_registros_funcionario
  ON registros_ponto(funcionario_id);

-- Buscar registros por data
CREATE INDEX idx_registros_data
  ON registros_ponto(data);

-- Buscar registros de um funcionário em uma data específica
CREATE INDEX idx_registros_funcionario_data
  ON registros_ponto(funcionario_id, data);
```

**Performance:**

- ✅ Buscar registros de um funcionário: O(log n)
- ✅ Filtrar por período: O(log n)
- ✅ Dashboard do admin: rápido mesmo com milhares de registros

---

## Políticas de Segurança

### Row Level Security (RLS)

RLS está habilitado em ambas as tabelas para garantir segurança.

### Tabela `funcionarios`

```sql
-- Política 1: Todos podem ler funcionários ativos
CREATE POLICY "Permitir leitura de funcionários ativos"
  ON funcionarios FOR SELECT
  USING (ativo = true);

-- Política 2: Apenas admin autenticado pode gerenciar
CREATE POLICY "Admin pode gerenciar funcionários"
  ON funcionarios FOR ALL
  USING (auth.role() = 'authenticated');
```

**Explicação:**

- Qualquer pessoa (mesmo não autenticada) pode ver funcionários ativos (necessário para o formulário)
- Apenas usuários autenticados (admin) podem adicionar/editar/deletar

### Tabela `registros_ponto`

```sql
-- Política 1: Todos podem ler registros
CREATE POLICY "Permitir leitura de registros"
  ON registros_ponto FOR SELECT
  USING (true);

-- Política 2: Todos podem inserir registros
CREATE POLICY "Permitir inserção de registros"
  ON registros_ponto FOR INSERT
  WITH CHECK (true);

-- Política 3: Todos podem atualizar registros
CREATE POLICY "Permitir atualização de registros"
  ON registros_ponto FOR UPDATE
  USING (true);

-- Política 4: Apenas admin pode deletar
CREATE POLICY "Admin pode deletar registros"
  ON registros_ponto FOR DELETE
  USING (auth.role() = 'authenticated');
```

**Explicação:**

- Funcionários podem registrar ponto (insert) e atualizar (para saída)
- Funcionários podem ver registros (necessário para mostrar último registro)
- Apenas admin pode deletar registros incorretos

---

## Funções e Triggers

### Função `update_updated_at_column`

Atualiza automaticamente o campo `updated_at` em operações de UPDATE.

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('America/Sao_Paulo'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';
```

### Triggers

```sql
-- Trigger para funcionarios
CREATE TRIGGER update_funcionarios_updated_at
  BEFORE UPDATE ON funcionarios
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger para registros_ponto
CREATE TRIGGER update_registros_ponto_updated_at
  BEFORE UPDATE ON registros_ponto
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

**Funcionamento:**

- Sempre que um registro é atualizado, `updated_at` é modificado automaticamente
- Usa timezone de Brasília

---

## Queries Úteis

### 1. Listar todos os funcionários ativos

```sql
SELECT * FROM funcionarios
WHERE ativo = true
ORDER BY nome;
```

### 2. Registros de hoje

```sql
SELECT
  f.nome,
  r.entrada,
  r.saida,
  r.total_horas
FROM registros_ponto r
JOIN funcionarios f ON r.funcionario_id = f.id
WHERE r.data = CURRENT_DATE
ORDER BY r.entrada DESC;
```

### 3. Total de horas por funcionário (mês atual)

```sql
SELECT
  f.nome,
  SUM(r.total_horas) as total_horas,
  COUNT(*) as dias_trabalhados
FROM registros_ponto r
JOIN funcionarios f ON r.funcionario_id = f.id
WHERE r.total_horas IS NOT NULL
  AND DATE_TRUNC('month', r.data) = DATE_TRUNC('month', CURRENT_DATE)
GROUP BY f.nome
ORDER BY total_horas DESC;
```

### 4. Registros incompletos (sem saída)

```sql
SELECT
  f.nome,
  r.data,
  r.entrada
FROM registros_ponto r
JOIN funcionarios f ON r.funcionario_id = f.id
WHERE r.entrada IS NOT NULL
  AND r.saida IS NULL
ORDER BY r.data DESC, r.entrada DESC;
```

### 5. Funcionário que mais trabalhou (último mês)

```sql
SELECT
  f.nome,
  SUM(r.total_horas) as total_horas
FROM registros_ponto r
JOIN funcionarios f ON r.funcionario_id = f.id
WHERE r.total_horas IS NOT NULL
  AND r.data >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY f.nome
ORDER BY total_horas DESC
LIMIT 1;
```

### 6. Média de horas por dia

```sql
SELECT
  f.nome,
  ROUND(AVG(r.total_horas), 2) as media_horas_dia
FROM registros_ponto r
JOIN funcionarios f ON r.funcionario_id = f.id
WHERE r.total_horas IS NOT NULL
GROUP BY f.nome
ORDER BY media_horas_dia DESC;
```

### 7. Registros de um período específico

```sql
SELECT
  f.nome,
  r.data,
  r.entrada,
  r.saida,
  r.total_horas
FROM registros_ponto r
JOIN funcionarios f ON r.funcionario_id = f.id
WHERE r.data BETWEEN '2026-01-01' AND '2026-01-31'
  AND f.id = 'id-do-funcionario'
ORDER BY r.data DESC;
```

---

## Manutenção

### Backup do Banco

**Via Supabase Dashboard:**

1. Vá em Database > Backups
2. Clique em "Create backup"
3. Download quando necessário

**Via SQL (exportar dados):**

```sql
-- Exportar funcionários
COPY (SELECT * FROM funcionarios) TO '/tmp/funcionarios.csv' CSV HEADER;

-- Exportar registros
COPY (SELECT * FROM registros_ponto) TO '/tmp/registros.csv' CSV HEADER;
```

### Limpar dados antigos (opcional)

```sql
-- Deletar registros com mais de 2 anos
DELETE FROM registros_ponto
WHERE data < CURRENT_DATE - INTERVAL '2 years';

-- Desativar funcionários sem registros há 6 meses
UPDATE funcionarios f
SET ativo = false
WHERE NOT EXISTS (
  SELECT 1 FROM registros_ponto r
  WHERE r.funcionario_id = f.id
    AND r.data > CURRENT_DATE - INTERVAL '6 months'
);
```

---

## Monitoramento

### Verificar tamanho do banco

```sql
SELECT
  pg_size_pretty(pg_database_size(current_database())) as tamanho_total;
```

### Verificar tamanho das tabelas

```sql
SELECT
  table_name,
  pg_size_pretty(pg_total_relation_size(table_name::regclass)) as tamanho
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY pg_total_relation_size(table_name::regclass) DESC;
```

### Contagem de registros

```sql
SELECT
  'funcionarios' as tabela,
  COUNT(*) as total
FROM funcionarios

UNION ALL

SELECT
  'registros_ponto',
  COUNT(*)
FROM registros_ponto;
```

---

## Diagrama ER (Relacionamento de Entidades)

```
┌─────────────────────┐          ┌─────────────────────────┐
│   funcionarios      │          │   registros_ponto       │
├─────────────────────┤          ├─────────────────────────┤
│ id (PK)            │◄─────────┤ funcionario_id (FK)    │
│ nome                │          │ id (PK)                 │
│ pin                 │          │ data                    │
│ role                │          │ entrada                 │
│ ativo               │          │ saida                   │
│ created_at          │          │ total_horas             │
│ updated_at          │          │ created_at              │
└─────────────────────┘          │ updated_at              │
                                 └─────────────────────────┘
```

---

## Considerações de Segurança

1. **PINs em texto plano**: Atualmente os PINs são armazenados sem hash. Para produção, considere usar `bcrypt`:

```sql
-- Instalar extensão pgcrypto
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Ao inserir funcionário
INSERT INTO funcionarios (nome, pin, role)
VALUES ('João', crypt('1234', gen_salt('bf')), 'funcionario');

-- Ao verificar PIN
SELECT * FROM funcionarios
WHERE nome = 'João'
  AND pin = crypt('1234', pin);
```

2. **Auditoria**: Para rastrear mudanças, considere criar tabela de logs

3. **Backup**: Configure backups automáticos no Supabase

---

**Documentação atualizada em: 12/01/2026**
