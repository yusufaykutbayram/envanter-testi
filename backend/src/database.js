import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'placeholder-key';

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
  console.error('CRITICAL: SUPABASE_URL or SUPABASE_ANON_KEY is missing in .env file!');
}

const supabase = createClient(supabaseUrl, supabaseKey);

// SQLite API'sine benzer bir yapı sunmak için (uyumluluk açısından)
// Ancak Supabase asenkron çalıştığı için kodların içinde await kullanmamız gerekecek.
export default supabase;
