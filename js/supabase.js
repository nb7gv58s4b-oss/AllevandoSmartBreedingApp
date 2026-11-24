
const { createClient } = supabase;

window.supabaseClient = createClient(
    window.ALLEVANDO_CONFIG.SUPABASE_URL,
    window.ALLEVANDO_CONFIG.SUPABASE_ANON_KEY
);

console.log("ALLEVANDO: connessione Supabase inizializzata");
