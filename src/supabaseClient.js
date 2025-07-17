import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = 'https://cpcmgetogqmrhaydhrwv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNwY21nZXRvZ3FtcmhheWRocnd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE2MTc3MzAsImV4cCI6MjA2NzE5MzczMH0.M_i-JUz6fy92yyL-daR06ALbqMy4CYX_s33C_YetMjc';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
