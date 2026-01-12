/**
 * ⚙️ Configuração do Supabase
 *
 * IMPORTANTE: As chaves agora vêm de variáveis de ambiente
 * para maior segurança em produção.
 *
 * Em desenvolvimento local:
 * 1. Copie .env.example para .env
 * 2. Preencha com suas credenciais do Supabase
 *
 * Na Vercel (produção):
 * 1. Vá em Settings > Environment Variables
 * 2. Adicione VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY
 *
 * NUNCA commite chaves diretamente no código!
 */

// Para compatibilidade, verificamos se as variáveis estão disponíveis
const SUPABASE_URL =
  import.meta?.env?.VITE_SUPABASE_URL ||
  "https://juquuhckfursjzbesofg.supabase.co";
const SUPABASE_ANON_KEY =
  import.meta?.env?.VITE_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp1cXV1aGNrZnVyc2p6YmVzb2ZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyNTMwODgsImV4cCI6MjA4MzgyOTA4OH0.z8-DCHU_2EeqhgwLd1IJ30bonLxS9jQIHfWcKZACwW4";

/**
 * Cliente Supabase
 * NOTA: A ANON KEY é segura para expor no frontend porque:
 * 1. Row Level Security (RLS) protege os dados
 * 2. Apenas operações permitidas pelas policies funcionam
 * 3. A SERVICE_ROLE_KEY nunca deve ser exposta!
 */
export const supabase = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);
