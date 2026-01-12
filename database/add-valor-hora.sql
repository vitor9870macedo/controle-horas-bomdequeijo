-- Adicionar campo valor_hora na tabela funcionarios
ALTER TABLE funcionarios 
ADD COLUMN valor_hora NUMERIC(10,2) DEFAULT 0;

-- Atualizar funcionários existentes com um valor padrão (R$ 15,00/hora)
UPDATE funcionarios 
SET valor_hora = 15.00 
WHERE valor_hora IS NULL OR valor_hora = 0;

-- Comentário: valor_hora armazena quanto o funcionário recebe por hora trabalhada
COMMENT ON COLUMN funcionarios.valor_hora IS 'Valor em reais que o funcionário recebe por hora trabalhada';
