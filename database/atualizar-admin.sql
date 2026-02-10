-- OPÇÃO 1: Criar novo admin (RECOMENDADO)
-- Vá para: Authentication → Users → Add user
-- Email: admsistemaponto@lippel.com
-- Password: pontolpp22
-- ✅ Auto Confirm User
-- Depois delete o usuário antigo (admin@bomdequeijo.com)

-- OPÇÃO 2: Resetar senha do usuário atual
-- 1. No painel Authentication → Users
-- 2. Clique no usuário admin@bomdequeijo.com
-- 3. Role até "Reset password"
-- 4. Clique "Send password recovery" OU defina nova senha manualmente

-- OPÇÃO 3: Via SQL (se as opções acima não funcionarem)
-- Primeiro, vamos tentar só atualizar o email
UPDATE auth.users 
SET 
  email = 'admsistemaponto@lippel.com',
  raw_user_meta_data = raw_user_meta_data || '{"email": "admsistemaponto@lippel.com"}'::jsonb,
  email_confirmed_at = NOW()
WHERE email = 'admin@bomdequeijo.com';

-- Para senha, use o painel do Supabase (mais seguro)
