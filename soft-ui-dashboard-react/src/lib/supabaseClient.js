import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // eslint-disable-next-line no-console
  console.error(
    "Faltan REACT_APP_SUPABASE_URL o REACT_APP_SUPABASE_ANON_KEY. Revisa el archivo .env del frontend."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
