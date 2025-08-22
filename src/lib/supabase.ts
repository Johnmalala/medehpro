import { createClient } from '@supabase/supabase-js'

// IMPORTANT: The keys are temporarily hardcoded here to allow the initial Netlify deployment.
// Once the site is live, these should be replaced with Netlify environment variables for security.
const supabaseUrl = 'https://rowwngsakanqlabltzgv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJvd3duZ3Nha2FucWxhYmx0emd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4Njg3MzcsImV4cCI6MjA3MTQ0NDczN30.crekFV0dIUkQagDEkRfaHUU14PQlfQWPLMT75DSbLTE';


if (!supabaseUrl || !supabaseAnonKey) {
  // This check is kept for future-proofing when we switch back to env variables.
  throw new Error('Supabase URL and Anon Key must be defined.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
