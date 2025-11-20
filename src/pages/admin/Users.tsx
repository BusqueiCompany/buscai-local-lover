import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { ArrowLeft, MessageSquare, Ticket } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type UserRole = "FREE" | "VIP" | "PARCEIRO" | "SUPORTE" | "ADMINISTRADOR" | "ENTREGADOR";

interface UserProfile {
  id: string;
  email: string;
  nome_completo: string | null;
  is_active: boolean;
  role: UserRole;
}

interface SupportTicket {
  id: string;
  subject: string;
  status: string;
  created_at: string;
}

export default function Users() {
  const { isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [userTickets, setUserTickets] = useState<SupportTicket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(false);

  useEffect(() => {
    if (!loading && !isAdmin) {
      navigate("/");
      toast.error("Acesso negado");
    }
  }, [isAdmin, loading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  useEffect(() => {
    if (roleFilter === "all") {
      setFilteredUsers(users);
    } else {
      setFilteredUsers(users.filter(user => user.role === roleFilter));
    }
  }, [roleFilter, users]);

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("*");

      if (rolesError) throw rolesError;

      const userProfiles: UserProfile[] = profiles.map(profile => {
        const userRole = roles.find(r => r.user_id === profile.id);
        return {
          id: profile.id,
          email: profile.email,
          nome_completo: profile.nome_completo,
          is_active: profile.is_active ?? true,
          role: userRole?.role || "FREE"
        };
      });

      setUsers(userProfiles);
      setFilteredUsers(userProfiles);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Erro ao carregar usuários");
    } finally {
      setLoadingUsers(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: UserRole) => {
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

      toast.success("Nível do usuário atualizado");
      fetchUsers();
    } catch (error) {
      console.error("Error updating user role:", error);
      toast.error("Erro ao atualizar nível do usuário");
    }
  };

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ is_active: !currentStatus })
        .eq("id", userId);

      if (error) throw error;

      toast.success(
        !currentStatus ? "Usuário ativado" : "Usuário desativado"
      );
      fetchUsers();
    } catch (error) {
      console.error("Error toggling user status:", error);
      toast.error("Erro ao atualizar status do usuário");
    }
  };

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case "ADMINISTRADOR":
        return "bg-red-500 hover:bg-red-600";
      case "SUPORTE":
        return "bg-purple-500 hover:bg-purple-600";
      case "PARCEIRO":
        return "bg-blue-500 hover:bg-blue-600";
      case "VIP":
        return "bg-yellow-500 hover:bg-yellow-600";
      case "FREE":
        return "bg-gray-500 hover:bg-gray-600";
      default:
        return "bg-gray-500 hover:bg-gray-600";
    }
  };

  const handleViewUserTickets = async (userId: string) => {
    setSelectedUserId(userId);
    setLoadingTickets(true);
    try {
      const { data, error } = await supabase
        .from("support_tickets")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setUserTickets(data || []);
    } catch (error) {
      console.error("Error fetching tickets:", error);
      toast.error("Erro ao carregar tickets");
    } finally {
      setLoadingTickets(false);
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "aberto":
        return "Aberto";
      case "em_andamento":
        return "Em Andamento";
      case "resolvido":
        return "Resolvido";
      default:
        return status;
    }
  };

  if (loading || loadingUsers) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/admin/dashboard")}
            className="hover:bg-muted"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Gerenciar Usuários</h1>
            <p className="text-muted-foreground">Controlar níveis e permissões</p>
          </div>
        </div>

        <div className="mb-6">
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filtrar por nível" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os níveis</SelectItem>
              <SelectItem value="FREE">FREE</SelectItem>
              <SelectItem value="VIP">VIP</SelectItem>
              <SelectItem value="PARCEIRO">PARCEIRO</SelectItem>
              <SelectItem value="SUPORTE">SUPORTE</SelectItem>
              <SelectItem value="ADMINISTRADOR">ADMINISTRADOR</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-4">
          {filteredUsers.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">
                  Nenhum usuário encontrado
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredUsers.map((user) => (
              <Card key={user.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        {user.nome_completo || "Sem nome"}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge className={getRoleBadgeColor(user.role)}>
                        {user.role}
                      </Badge>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">
                          {user.is_active ? "Ativo" : "Inativo"}
                        </span>
                        <Switch
                          checked={user.is_active}
                          onCheckedChange={() => toggleUserStatus(user.id, user.is_active)}
                          disabled={user.email === "busqueisuporte@gmail.com"}
                        />
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 mb-4">
                    <span className="text-sm font-medium">Alterar nível:</span>
                    <Select
                      value={user.role}
                      onValueChange={(value) => updateUserRole(user.id, value as UserRole)}
                      disabled={user.email === "busqueisuporte@gmail.com"}
                    >
                      <SelectTrigger className="w-[200px]">
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
                    {user.email === "busqueisuporte@gmail.com" && (
                      <Badge className="bg-red-500">CONTA RAIZ</Badge>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewUserTickets(user.id)}
                    >
                      <Ticket className="h-4 w-4 mr-2" />
                      Ver Tickets e Chat
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <Dialog open={!!selectedUserId} onOpenChange={() => setSelectedUserId(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Tickets e Chat do Usuário</DialogTitle>
            </DialogHeader>
            
            {loadingTickets ? (
              <div className="flex items-center justify-center py-8">
                <p className="text-muted-foreground">Carregando tickets...</p>
              </div>
            ) : userTickets.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Este usuário não possui tickets</p>
              </div>
            ) : (
              <div className="space-y-4">
                {userTickets.map((ticket) => (
                  <Card key={ticket.id}>
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-medium">{ticket.subject}</p>
                          <p className="text-sm text-muted-foreground">
                            #{ticket.id.slice(0, 8)}
                          </p>
                        </div>
                        <Badge variant="outline">
                          {getStatusLabel(ticket.status)}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {new Date(ticket.created_at).toLocaleDateString("pt-BR")}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
