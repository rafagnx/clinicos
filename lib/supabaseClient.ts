import { createClient } from '@supabase/supabase-js';

// Hardcoded fallback keys for Vercel/Production stability
// Ideally these should be in Vercel Environment Variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://yhfjhovhemgcamigimaj.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InloZmpob3ZoZW1nY2FtaWdpbWFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwNzE1NzAsImV4cCI6MjA4NDY0NzU3MH0.6a8aSDM12eQwTRZES5r_hqFDGq2akKt9yMOys3QzodQ";

if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Supabase URL or Anon Key missing! Check .env");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
