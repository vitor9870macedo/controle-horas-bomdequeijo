/**
 * ⚙️ Configuração do Supabase
 * 
 * O Supabase é o BACKEND COMPLETO deste sistema:
 * - PostgreSQL (banco de dados)
 * - API REST (gerada automaticamente)
 * - Authentication (login/senha)
 * - Row Level Security (proteção de dados)
 * 
 * NÃO há servidor Node.js/Express!
 * O frontend faz chamadas HTTP direto para a API do Supabase.
 * 
 * INSTRUÇÕES:
 * 1. Crie conta em https://supabase.com
 * 2. Crie um novo projeto
 * 3. Vá em Settings > API
 * 4. Copie a "Project URL" e a "anon/public key"
 * 5. Cole os valores abaixo (substitua as strings)
 */

const SUPABASE_URL = "SUA_URL_DO_SUPABASE";           // Ex: https://xxxx.supabase.co
const SUPABASE_ANON_KEY = "SUA_CHAVE_ANONIMA_DO_SUPABASE"; // Ex: eyJhbGc...

/**
 * Cliente Supabase
 * Este objeto é usado em app.js e admin.js para fazer requisições
export const supabase = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);
