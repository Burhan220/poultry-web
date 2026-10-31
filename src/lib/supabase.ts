import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://spirpqbkxwpuqiomcwii.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNwaXJwcWJreHdwdXFpb21jd2lpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE0MTY0MjUsImV4cCI6MjEwNjk5MjQyNX0.N5TduwpRu4O5IcGvIb7yTMuTf1BDCpsruuI9rnPPEaE';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
