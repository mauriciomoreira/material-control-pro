import { createClient } from '@supabase/supabase-js';

// Link do seu projeto no Supabase
const supabaseUrl = 'https://fyfovrkgfqvagasndxus.supabase.co'; 

// Chave pública (anon/public) do seu projeto
const supabaseKey = 'sb_publishable__RADabblyzpygEaKyFcRag_wdKo3xto';

export const supabase = createClient(supabaseUrl, supabaseKey);