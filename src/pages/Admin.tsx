import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { ArrowLeft, Shield, Users, Filter } from "lucide-react";

type UserRole = "FREE" | "VIP" | "PARCEIRO" | "SUPORTE" | "ADMINISTRADOR";

interface UserProfile {
  id: string;
  email: string;
  nome_completo: string | null;
  is_active: boolean;
  role: UserRole;
}

const ADMIN_ROOT_EMAIL = "admin@busquei.com";

export default function Admin() {
  const { isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterRole, setFilterRole] = useState<string>("all");

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      navigate("/");
      toast.error("Acesso negado");
    }
  }, [isAdmin, authLoading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  useEffect(() => {
    if (filterRole === "all") {
      setFilteredUsers(users);
    } else {
      setFilteredUsers(users.filter((user) => user.role === filterRole));
    }
  }, [filterRole, users]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, email, nome_completo, is_active");

      if (profilesError) throw profilesError;

      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");

      if (rolesError) throw rolesError;

      const rolesMap = new Map(roles.map((r) => [r.user_id, r.role as UserRole]));

      const usersWithRoles = profiles.map((profile) => ({
        ...profile,
        role: rolesMap.get(profile.id) || "FREE",
      }));

      setUsers(usersWithRoles);
      setFilteredUsers(usersWithRoles);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Erro ao carregar usuários");
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: UserRole, userEmail: string) => {
    if (userEmail === ADMIN_ROOT_EMAIL) {
      toast.error("A conta raiz não pode ter seu nível alterado");
      return;
    }

    try {
      const { error: deleteError } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId);

      if (deleteError) throw deleteError;

      const { error: insertError } = await supabase
        .from("user_roles")
        .insert({ user_id: userId, role: newRole });

      if (insertError) throw insertError;

      toast.success("Nível atualizado com sucesso");
      fetchUsers();
    } catch (error) {
      console.error("Error updating role:", error);
      toast.error("Erro ao atualizar nível");
    }
  };

  const toggleUserStatus = async (userId: string, currentStatus: boolean, userEmail: string) => {
    if (userEmail === ADMIN_ROOT_EMAIL) {
      toast.error("A conta raiz não pode ser desativada");
      return;
    }

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ is_active: !currentStatus })
        .eq("id", userId);

      if (error) throw error;

      toast.success(
        !currentStatus ? "Conta ativada com sucesso" : "Conta desativada com sucesso"
      );
      fetchUsers();
    } catch (error) {
      console.error("Error toggling user status:", error);
      toast.error("Erro ao alterar status da conta");
    }
  };

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case "ADMINISTRADOR":
        return "bg-red-500";
      case "SUPORTE":
        return "bg-blue-500";
      case "PARCEIRO":
        return "bg-purple-500";
      case "VIP":
        return "bg-amber-500";
      case "FREE":
        return "bg-gray-500";
      default:
        return "bg-gray-500";
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-primary">
        <p className="text-foreground">Carregando...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-primary p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-primary" />
              <div>
                <CardTitle className="text-2xl">Painel do Administrador</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Gerencie usuários e permissões do sistema
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-muted-foreground" />
                <span className="font-semibold">{users.length} usuários</span>
              </div>
              <div className="flex items-center gap-2 ml-auto">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <Select value={filterRole} onValueChange={setFilterRole}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filtrar por nível" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="FREE">FREE</SelectItem>
                    <SelectItem value="VIP">VIP</SelectItem>
                    <SelectItem value="PARCEIRO">PARCEIRO</SelectItem>
                    <SelectItem value="SUPORTE">SUPORTE</SelectItem>
                    <SelectItem value="ADMINISTRADOR">ADMINISTRADOR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              {filteredUsers.map((user) => (
                <Card key={user.id} className="border-2">
                  <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">
                            {user.nome_completo || "Sem nome"}
                          </p>
                          {user.email === ADMIN_ROOT_EMAIL && (
                            <Badge variant="destructive" className="text-xs">
                              Conta Raiz
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                        <Badge className={getRoleBadgeColor(user.role)}>
                          {user.role}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">
                            {user.is_active ? "Ativa" : "Inativa"}
                          </span>
                          <Switch
                            checked={user.is_active}
                            onCheckedChange={() =>
                              toggleUserStatus(user.id, user.is_active, user.email)
                            }
                            disabled={user.email === ADMIN_ROOT_EMAIL}
                          />
                        </div>

                        <Select
                          value={user.role}
                          onValueChange={(value) =>
                            updateUserRole(user.id, value as UserRole, user.email)
                          }
                          disabled={user.email === ADMIN_ROOT_EMAIL}
                        >
                          <SelectTrigger className="w-[160px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="FREE">FREE</SelectItem>
                            <SelectItem value="VIP">VIP</SelectItem>
                            <SelectItem value="PARCEIRO">PARCEIRO</SelectItem>
                            <SelectItem value="SUPORTE">SUPORTE</SelectItem>
                            <SelectItem value="ADMINISTRADOR">ADMINISTRADOR</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {filteredUsers.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  Nenhum usuário encontrado com este filtro
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
