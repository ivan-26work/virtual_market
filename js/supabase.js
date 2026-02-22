// supabase.js - Configuration Supabase globale
// À inclure UNE SEULE fois après le CDN Supabase

// Configuration
const SUPABASE_URL = 'https://vpgzcakjnbsttmmzpvar.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZwZ3pjYWtqbmJzdHRtbXpwdmFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2ODM3NTUsImV4cCI6MjA4NzI1OTc1NX0.9s9VN5B9IxFuxxCrSCRb3f4kaUGRMUGR6fHpglQXioQ';

// Création du client Supabase global
window.supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
console.log('✅ Supabase client initialisé');