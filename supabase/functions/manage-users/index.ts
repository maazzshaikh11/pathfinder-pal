import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify the caller is a TPO using their JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // User-scoped client to verify role
    const userClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid session' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check caller is TPO
    const { data: roleData } = await userClient.rpc('get_user_role', { _user_id: user.id });
    if (roleData !== 'tpo') {
      return new Response(JSON.stringify({ error: 'Forbidden: TPO access only' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Service role client for admin operations
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const url = new URL(req.url);
    const action = url.searchParams.get('action') || 'list';

    // ── LIST all users ──────────────────────────────────────────────
    if (action === 'list') {
      const { data: authUsers, error: listError } = await adminClient.auth.admin.listUsers();
      if (listError) throw listError;

      const { data: roles } = await adminClient
        .from('user_roles')
        .select('user_id, role');

      const roleMap = new Map((roles || []).map((r: { user_id: string; role: string }) => [r.user_id, r.role]));

      const users = authUsers.users.map((u) => ({
        id: u.id,
        email: u.email,
        role: roleMap.get(u.id) ?? 'student',
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at,
        email_confirmed: !!u.email_confirmed_at,
      }));

      return new Response(JSON.stringify({ users }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── SET ROLE ────────────────────────────────────────────────────
    if (action === 'set-role' && req.method === 'POST') {
      const body = await req.json();
      const { targetUserId, newRole } = body;

      if (!targetUserId || !['student', 'tpo'].includes(newRole)) {
        return new Response(JSON.stringify({ error: 'Invalid parameters' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Prevent TPO from demoting themselves
      if (targetUserId === user.id && newRole === 'student') {
        return new Response(JSON.stringify({ error: 'You cannot demote yourself.' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { error: updateError } = await adminClient
        .from('user_roles')
        .update({ role: newRole })
        .eq('user_id', targetUserId);

      if (updateError) throw updateError;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('manage-users error:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
