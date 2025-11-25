import { useAuth } from "@/contexts/AuthContext";

export type UserRole = "FREE" | "VIP" | "PARCEIRO" | "ENTREGADOR" | "SUPORTE" | "ADMINISTRADOR";

export const useRole = () => {
  const { userRole, isAdmin, loading } = useAuth();

  const can = (permission: string): boolean => {
    const role = userRole as UserRole;
    
    // Admin pode tudo
    if (role === "ADMINISTRADOR") return true;

    // Mapeamento de permissões por role
    const permissions: Record<UserRole, string[]> = {
      ADMINISTRADOR: ["*"], // todas
      SUPORTE: [
        "view_users",
        "view_tickets",
        "create_ticket",
        "edit_ticket",
        "view_logs",
        "view_orders",
      ],
      ENTREGADOR: [
        "view_own_orders",
        "update_own_orders",
        "upload_receipt",
        "view_own_profile",
      ],
      PARCEIRO: [
        "view_stores",
        "view_products",
        "view_own_profile",
      ],
      VIP: [
        "view_products",
        "view_stores",
        "priority_support",
        "view_own_profile",
      ],
      FREE: [
        "view_products",
        "view_stores",
        "view_own_profile",
      ],
    };

    const rolePermissions = permissions[role] || [];
    return rolePermissions.includes("*") || rolePermissions.includes(permission);
  };

  return {
    role: userRole as UserRole,
    isAdmin,
    loading,
    can,
  };
};
