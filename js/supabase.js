/* ==========================================
   BABY QUEST - CONNEXION SUPABASE
   ========================================== */

// Informations du projet Supabase
const SUPABASE_URL = "https://zfhmohvtxjmiafvdvbsv.supabase.co";

const SUPABASE_KEY = "sb_publishable_PvowHWJlbrOhYMKrAZZJZA_tV2Uuu9D";

// Création du client Supabase
const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

console.log("Baby Quest : connexion Supabase initialisée !");