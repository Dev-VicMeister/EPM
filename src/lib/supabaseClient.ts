import { createClient } from '@supabase/supabase-js';

// Directly using your keys (for testing only — in production use .env)
const supabaseUrl = "https://npmdkxmehygdbogxbdoy.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5wbWRreG1laHlnZGJvZ3hiZG95Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ2Nzc5NzMsImV4cCI6MjA3MDI1Mzk3M30.1nxXNflteguSJCotatQaxvQKYoSGgOeFGFH_RiU_S6A";

// Create a single Supabase client for the whole app
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
