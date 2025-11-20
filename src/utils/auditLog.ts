import { supabase } from "@/integrations/supabase/client";

interface LogParams {
  action: string;
  target_id?: string;
  target_type?: string;
  data_diff?: Record<string, any>;
}

export async function createAuditLog({
  action,
  target_id,
  target_type,
  data_diff,
}: LogParams) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error("No user found for audit log");
      return;
    }

    const { error } = await supabase.from("system_logs").insert({
      user_id_admin: user.id,
      action,
      target_id,
      target_type,
      data_diff,
    });

    if (error) {
      console.error("Error creating audit log:", error);
    }
  } catch (error) {
    console.error("Error in createAuditLog:", error);
  }
}
