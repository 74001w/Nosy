const { createClient } = require('@supabase/supabase-js');

// This stays optional for the foundation phase: the app runs fully on
// mock data and demo logins even with no Supabase project connected yet.
// Once SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env,
// briefing history (Sprint 3 in the PRD) can start writing here.
let supabase = null;

function getSupabaseClient() {
  if (supabase) return supabase;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key || url.includes('YOUR-PROJECT-REF')) {
    return null;
  }

  supabase = createClient(url, key);
  return supabase;
}

module.exports = { getSupabaseClient };
