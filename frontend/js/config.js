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

const SUPABASE_URL = "https://juquuhckfursjzbesofg.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp1cXV1aGNrZnVyc2p6YmVzb2ZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyNTMwODgsImV4cCI6MjA4MzgyOTA4OH0.z8-DCHU_2EeqhgwLd1IJ30bonLxS9jQIHfWcKZACwW4";

/**

 * Este objeto é usado em app.js e admin.js para fazer requisições
 */
export const supabase = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
);
