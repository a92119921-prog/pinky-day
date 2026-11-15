
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Pinky Day Supabase 設定尚未完成');
}

export const supabase = createClient(
  supabaseUrl,
  supabaseKey
);
