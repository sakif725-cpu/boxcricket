// ==============================================================================
// UniBox League 2026 - Supabase Client Connector & Database Operations
// ==============================================================================

// 1. CONFIGURATION
// Replace the values below with your project credentials from:
// Supabase Dashboard -> Project Settings -> API
const SUPABASE_URL = 'https://mhlhzfzxvlshmbcwtvkt.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_HVAXt2IGvOtqZhruw2qY1g_Ttzirbuk';

// Clean base URL (strips any trailing /rest/v1 or slashes if accidentally present)
const cleanUrl = (SUPABASE_URL || '').replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');

// Check if actual credentials have been provided
const isConfigured = () => {
    return cleanUrl && 
           cleanUrl !== 'YOUR_SUPABASE_PROJECT_URL' &&
           SUPABASE_ANON_KEY && 
           SUPABASE_ANON_KEY !== 'YOUR_SUPABASE_ANON_KEY';
};

// 2. INITIALIZE CLIENT
let supabaseClient = null;
try {
    if (isConfigured() && window.supabase) {
        supabaseClient = window.supabase.createClient(cleanUrl, SUPABASE_ANON_KEY);
        console.log('⚡ Connected to Supabase Project:', cleanUrl);
    } else {
        console.info('ℹ️ Supabase credentials not yet configured in supabaseClient.js. Running in local session mode.');
    }
} catch (err) {
    console.warn('Supabase initialization error:', err);
}

// 3. DATABASE HELPER METHODS
const UniBoxDb = {
    isReady: () => isConfigured() && supabaseClient !== null,

    // Cryptographic Password Hashing (Salted SHA-256 via native Web Crypto API)
    hashPassword: async (password) => {
        if (!password) return '';
        try {
            const salt = 'unibox_league_2026_salt_';
            const encoder = new TextEncoder();
            const data = encoder.encode(salt + password);
            const hashBuffer = await crypto.subtle.digest('SHA-256', data);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        } catch (err) {
            console.error('Hashing failed:', err);
            return password; // Fallback
        }
    },

    // Insert a new player registration
    savePlayer: async (playerData) => {
        if (!UniBoxDb.isReady()) {
            // Local fallback (saves to browser localStorage so data persists across refreshes)
            const localPlayers = JSON.parse(localStorage.getItem('unibox_players') || '[]');
            const existingIdx = localPlayers.findIndex(p => p.email === playerData.email || p.enrollment_no === playerData.enrollment_no);
            if (existingIdx >= 0) {
                localPlayers[existingIdx] = { ...localPlayers[existingIdx], ...playerData };
            } else {
                localPlayers.push({ ...playerData, id: 'local_' + Date.now(), created_at: new Date().toISOString(), status: 'Registered' });
            }
            localStorage.setItem('unibox_players', JSON.stringify(localPlayers));
            return { data: playerData, error: null, source: 'localStorage' };
        }

        try {
            const payload = {
                full_name: playerData.name,
                enrollment_no: playerData.enrollment_no,
                department: playerData.department,
                email: playerData.email,
                gender: playerData.gender,
                player_role: playerData.player_role,
                certificate_name: playerData.certificate_name || playerData.certificate || null,
                certificate_data: playerData.certificate_data || null,
                photo_data: playerData.photo_data || null,
                password_hash: playerData.password_hash || null,
                status: 'Registered'
            };

            let { data, error } = await supabaseClient
                .from('players')
                .upsert([payload], { onConflict: 'email' })
                .select();

            // Resilient fallback if schema column missing in Supabase (certificate_data or password_hash)
            if (error && error.code === '42703') {
                if (error.message?.includes('certificate_data')) {
                    console.warn("⚠️ 'certificate_data' column missing in Supabase. Run: 'alter table public.players add column if not exists certificate_data text;'");
                    delete payload.certificate_data;
                }
                if (error.message?.includes('password_hash')) {
                    delete payload.password_hash;
                }
                const retry = await supabaseClient
                    .from('players')
                    .upsert([payload], { onConflict: 'email' })
                    .select();
                data = retry.data;
                error = retry.error;
            }

            if (error) throw error;
            return { data: data?.[0] || payload, error: null, source: 'supabase' };
        } catch (error) {
            console.error('Failed to save player to Supabase:', error);
            return { data: null, error, source: 'supabase' };
        }
    },

    // Fetch player profile by email (used on login)
    getPlayerByEmail: async (email) => {
        if (!UniBoxDb.isReady()) {
            const localPlayers = JSON.parse(localStorage.getItem('unibox_players') || '[]');
            const player = localPlayers.find(p => p.email.toLowerCase() === email.toLowerCase());
            return { data: player || null, error: null, source: 'localStorage' };
        }

        try {
            const { data, error } = await supabaseClient
                .from('players')
                .select('*')
                .eq('email', email)
                .maybeSingle();

            if (error) throw error;
            return { data, error: null, source: 'supabase' };
        } catch (error) {
            console.error('Failed to fetch player from Supabase:', error);
            return { data: null, error, source: 'supabase' };
        }
    },

    // Fetch all registered players (used by the Admin Panel)
    getAllPlayers: async () => {
        if (!UniBoxDb.isReady()) {
            const localPlayers = JSON.parse(localStorage.getItem('unibox_players') || '[]');
            return { data: localPlayers, error: null, source: 'localStorage' };
        }

        try {
            const { data, error } = await supabaseClient
                .from('players')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return { data: data || [], error: null, source: 'supabase' };
        } catch (error) {
            console.error('Failed to fetch all players from Supabase:', error);
            return { data: [], error, source: 'supabase' };
        }
    },

    // Update player accreditation status (used by the Admin Panel)
    updatePlayerStatus: async (playerIdOrEmail, newStatus) => {
        if (!UniBoxDb.isReady()) {
            const localPlayers = JSON.parse(localStorage.getItem('unibox_players') || '[]');
            const idx = localPlayers.findIndex(p => p.id === playerIdOrEmail || p.email === playerIdOrEmail);
            if (idx >= 0) {
                localPlayers[idx].status = newStatus;
                localStorage.setItem('unibox_players', JSON.stringify(localPlayers));
            }
            return { success: true, source: 'localStorage' };
        }

        try {
            const query = typeof playerIdOrEmail === 'string' && playerIdOrEmail.includes('@')
                ? supabaseClient.from('players').update({ status: newStatus }).eq('email', playerIdOrEmail)
                : supabaseClient.from('players').update({ status: newStatus }).eq('id', playerIdOrEmail);

            const { data, error } = await query.select();
            if (error) throw error;
            return { data, error: null, source: 'supabase' };
        } catch (error) {
            console.error('Failed to update player status in Supabase:', error);
            return { data: null, error, source: 'supabase' };
        }
    },

    // Update player photo
    updatePlayerPhoto: async (email, photoData) => {
        if (!UniBoxDb.isReady()) {
            const localPlayers = JSON.parse(localStorage.getItem('unibox_players') || '[]');
            const idx = localPlayers.find(p => p.email === email);
            if (idx) {
                idx.photo_data = photoData;
                localStorage.setItem('unibox_players', JSON.stringify(localPlayers));
            }
            return { success: true, source: 'localStorage' };
        }

        try {
            const { data, error } = await supabaseClient
                .from('players')
                .update({ photo_data: photoData })
                .eq('email', email)
                .select();

            if (error) throw error;
            return { data, error: null, source: 'supabase' };
        } catch (error) {
            console.error('Failed to update player photo in Supabase:', error);
            return { data: null, error, source: 'supabase' };
        }
    },

    // Delete player registration (used by Admin Panel)
    deletePlayer: async (playerIdOrEmail) => {
        if (!UniBoxDb.isReady()) {
            let localPlayers = JSON.parse(localStorage.getItem('unibox_players') || '[]');
            localPlayers = localPlayers.filter(p => p.id !== playerIdOrEmail && p.email !== playerIdOrEmail);
            localStorage.setItem('unibox_players', JSON.stringify(localPlayers));
            return { success: true, source: 'localStorage' };
        }

        try {
            const query = typeof playerIdOrEmail === 'string' && playerIdOrEmail.includes('@')
                ? supabaseClient.from('players').delete().eq('email', playerIdOrEmail).select()
                : supabaseClient.from('players').delete().eq('id', playerIdOrEmail).select();

            const { data, error } = await query;
            if (error) throw error;
            if (data && data.length === 0) {
                console.warn("⚠️ Player was not deleted from Supabase. Ensure DELETE policy is created: create policy \"Allow public player delete\" on public.players for delete using (true);");
            }
            return { success: true, error: null, source: 'supabase' };
        } catch (error) {
            console.error('Failed to delete player from Supabase:', error);
            return { success: false, error, source: 'supabase' };
        }
    },

    // Admin Coordinator Authentication (Username/Email + Password)
    adminLogin: async (identifier, password) => {
        const inputHash = await UniBoxDb.hashPassword(password);
        const trimmed = (identifier || '').trim();

        // Check against Supabase if connected
        if (UniBoxDb.isReady()) {
            try {
                const isEmail = trimmed.includes('@');
                const query = isEmail
                    ? supabaseClient.from('admins').select('*').eq('email', trimmed).maybeSingle()
                    : supabaseClient.from('admins').select('*').eq('username', trimmed).maybeSingle();

                const { data, error } = await query;
                if (!error && data) {
                    if (data.password_hash === inputHash) {
                        return { success: true, admin: data, error: null, source: 'supabase' };
                    } else {
                        return { success: false, error: 'Incorrect coordinator password.', source: 'supabase' };
                    }
                }
            } catch (err) {
                console.warn('Supabase admin lookup failed, falling back:', err);
            }
        }

        // Built-in Default Coordinator Credential Fallback (admin / admin2026)
        const defaultHash = '819ad992a50989f76e1e5fe6d2167e370dabae02fb8ac8b0add58c6a23134f23';
        if ((trimmed.toLowerCase() === 'admin' || trimmed.toLowerCase() === 'admin@unibox.com') && inputHash === defaultHash) {
            return {
                success: true,
                admin: { username: 'admin', email: 'admin@unibox.com', role: 'Lead Coordinator' },
                error: null,
                source: 'default'
            };
        }

        return { success: false, error: 'Invalid coordinator username or password.', source: 'auth' };
    }
};

// Export to window for global browser access
window.UniBoxDb = UniBoxDb;

