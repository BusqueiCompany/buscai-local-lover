import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    // Check if admin already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const adminExists = existingUsers?.users.find(
      (user) => user.email === 'busqueisuporte@gmail.com'
    );

    if (adminExists) {
      return new Response(
        JSON.stringify({ message: 'Admin user already exists', userId: adminExists.id }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Create admin user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: 'busqueisuporte@gmail.com',
      password: 'admin001',
      email_confirm: true,
      user_metadata: {
        nome_completo: 'Administrador',
      },
    });

    if (authError) {
      console.error('Error creating admin user:', authError);
      throw authError;
    }

    console.log('Admin user created:', authData.user.id);

    // Create profile
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: authData.user.id,
        email: 'busqueisuporte@gmail.com',
        nome_completo: 'Administrador',
        is_active: true,
      });

    if (profileError) {
      console.error('Error creating profile:', profileError);
    }

    // Delete any existing roles for this user
    const { error: deleteError } = await supabaseAdmin
      .from('user_roles')
      .delete()
      .eq('user_id', authData.user.id);

    if (deleteError) {
      console.error('Error deleting existing roles:', deleteError);
    }

    // Create admin role
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .insert({
        user_id: authData.user.id,
        role: 'ADMINISTRADOR',
      });

    if (roleError) {
      console.error('Error creating admin role:', roleError);
      throw roleError;
    }

    console.log('Admin role created successfully');

    return new Response(
      JSON.stringify({ 
        message: 'Admin user created successfully',
        userId: authData.user.id,
        email: 'busqueisuporte@gmail.com',
        password: 'admin001'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('Error in create-admin function:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message || 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
})
