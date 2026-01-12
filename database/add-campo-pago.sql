-- Adicionar campo 'pago' na tabela registros_ponto
ALTER TABLE registros_ponto 
ADD COLUMN pago BOOLEAN DEFAULT false;

-- Adicionar campo 'data_pagamento' para registrar quando foi pago
ALTER TABLE registros_ponto 
ADD COLUMN data_pagamento TIMESTAMP WITH TIME ZONE;

-- Comentários
COMMENT ON COLUMN registros_ponto.pago IS 'Indica se o funcionário já recebeu o pagamento deste registro';
COMMENT ON COLUMN registros_ponto.data_pagamento IS 'Data e hora em que o pagamento foi marcado como realizado';
