import { createClient } from '@supabase/supabase-js';

// Read configuration from Vite import.meta.env or fallback process.env
const supabaseUrl = 
  import.meta.env?.VITE_SUPABASE_URL || 
  import.meta.env?.NEXT_PUBLIC_SUPABASE_URL || 
  '';

const supabaseAnonKey = 
  import.meta.env?.VITE_SUPABASE_ANON_KEY || 
  import.meta.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
  '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes('your-project-ref')
);

// Fallback dummy client for local development without credentials
let client = null;
if (isSupabaseConfigured) {
  client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce'
    }
  });
}

export const supabase = client;

// Helper to get allowed emails from env
export function getAllowedEmails() {
  const envVal = 
    import.meta.env?.VITE_ALLOWED_EMAILS || 
    import.meta.env?.ALLOWED_EMAILS || 
    '';
  if (!envVal) return [];
  return envVal.split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
}

export function isEmailAllowed(email) {
  const allowed = getAllowedEmails();
  if (allowed.length === 0) return true; // If not configured, allow all authenticated users
  if (!email) return false;
  return allowed.includes(email.toLowerCase().trim());
}

// Sign in with Google OAuth
export async function signInWithGoogle() {
  if (!isSupabaseConfigured) {
    // Mock authentication for preview / testing
    const mockUser = {
      id: 'mock-user-andi',
      email: 'andi@andinu.cc',
      user_metadata: { full_name: 'Andi' }
    };
    localStorage.setItem('andinu_mock_user', JSON.stringify(mockUser));
    window.location.href = '/';
    return { data: { user: mockUser }, error: null };
  }

  const redirectTo = `${window.location.origin}/auth/callback`;
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent'
      }
    }
  });

  return { data, error };
}

// Sign Out
export async function signOut() {
  localStorage.removeItem('andinu_mock_user');
  if (isSupabaseConfigured) {
    await supabase.auth.signOut();
  }
  window.location.href = '/login';
}

// Get current session/user
export async function getCurrentUser() {
  if (!isSupabaseConfigured) {
    const mock = localStorage.getItem('andinu_mock_user');
    return mock ? JSON.parse(mock) : null;
  }
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user || null;
}

// Listen for auth changes
export function onAuthStateChange(callback) {
  if (!isSupabaseConfigured) {
    const user = JSON.parse(localStorage.getItem('andinu_mock_user') || 'null');
    callback(user ? 'SIGNED_IN' : 'SIGNED_OUT', user ? { user } : null);
    return { data: { subscription: { unsubscribe: () => {} } } };
  }
  return supabase.auth.onAuthStateChange(callback);
}

// Household Helpers
export async function getActiveHousehold() {
  if (!isSupabaseConfigured) {
    return {
      id: 'mock-household-001',
      name: 'Andino & Núria (AndiNú)'
    };
  }

  try {
    // Call RPC get_or_create_initial_household
    const { data: householdId, error: rpcError } = await supabase.rpc('get_or_create_initial_household');
    if (!rpcError && householdId) {
      const { data: h } = await supabase
        .from('households')
        .select('*')
        .eq('id', householdId)
        .single();
      if (h) return h;
    }

    // Fallback: select first household the user is a member of
    const { data: memberships } = await supabase
      .from('household_members')
      .select('household_id, households(*)')
      .limit(1);

    if (memberships && memberships.length > 0 && memberships[0].households) {
      return memberships[0].households;
    }
  } catch (err) {
    console.warn('Error fetching active household:', err);
  }

  return { id: 'a0000000-0000-0000-0000-000000000001', name: 'Andino & Núria (AndiNú)' };
}

export async function inviteHouseholdMember(householdId, email, role = 'member') {
  if (!isSupabaseConfigured) {
    const list = JSON.parse(localStorage.getItem('andinu_mock_members') || '[]');
    list.push({ email, role, created_at: new Date().toISOString() });
    localStorage.setItem('andinu_mock_members', JSON.stringify(list));
    return { success: true };
  }

  const { data, error } = await supabase
    .from('household_members')
    .insert([
      { household_id: householdId, email: email.toLowerCase().trim(), role }
    ])
    .select();

  return { data, error };
}

export async function getHouseholdMembers(householdId) {
  if (!isSupabaseConfigured) {
    const list = JSON.parse(localStorage.getItem('andinu_mock_members') || '[]');
    return [
      { email: 'andi@andinu.cc', role: 'owner', user_id: 'mock-andi' },
      ...list
    ];
  }

  const { data, error } = await supabase
    .from('household_members')
    .select('*')
    .eq('household_id', householdId);

  return data || [];
}

