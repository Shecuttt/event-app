import type { Database } from "@/types/database.types";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY || "";

const supabase = createClient<Database>(supabaseUrl, supabaseKey);

export default supabase;
