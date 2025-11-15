import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { ArrowLeft, Edit } from "lucide-react";

type UserRole = "FREE" | "VIP" | "PARCEIRO" | "SUPORTE" | "ADMINISTRADOR";

interface UserProfile {
  id: string;
  email: string;
  nome_completo: string | null;
  telefone: string | null;
  cpf: string | null;
  data_nascimento: string | null;
  endereco: string | null;
  numero: string | null;
  bairro: string | null;
  referencia: string | null;
  sexo: string | null;
  is_active: boolean;
  role: UserRole;
}

export default function Seeds() {
  const { isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

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
          telefone: profile.telefone,
          cpf: profile.cpf,
          data_nascimento: profile.data_nascimento,
          endereco: profile.endereco,
          numero: profile.numero,
          bairro: profile.bairro,
          referencia: profile.referencia,
          sexo: profile.sexo,
          is_active: profile.is_active ?? true,
          role: userRole?.role || "FREE"
        };
      });

      setUsers(userProfiles);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Erro ao carregar usuários");
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleEdit = (user: UserProfile) => {
    setEditingUser({ ...user });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!editingUser) return;

    try {
      // Update profile
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          nome_completo: editingUser.nome_completo,
          telefone: editingUser.telefone,
          cpf: editingUser.cpf,
          data_nascimento: editingUser.data_nascimento,
          endereco: editingUser.endereco,
          numero: editingUser.numero,
          bairro: editingUser.bairro,
          referencia: editingUser.referencia,
          sexo: editingUser.sexo,
          is_active: editingUser.is_active,
        })
        .eq("id", editingUser.id);

      if (profileError) throw profileError;

      // Update role if changed
      const originalUser = users.find(u => u.id === editingUser.id);
      if (originalUser && originalUser.role !== editingUser.role) {
        const { error: deleteError } = await supabase
          .from("user_roles")
          .delete()
          .eq("user_id", editingUser.id);

        if (deleteError) throw deleteError;

        const { error: insertError } = await supabase
          .from("user_roles")
          .insert({ user_id: editingUser.id, role: editingUser.role });

        if (insertError) throw insertError;
      }

      toast.success("Usuário atualizado com sucesso");
      setIsDialogOpen(false);
      fetchUsers();
    } catch (error) {
      console.error("Error updating user:", error);
      toast.error("Erro ao atualizar usuário");
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

  const isRootAccount = (email: string) => email === "busqueisuporte@gmail.com";

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
            <h1 className="text-3xl font-bold text-foreground">Seeds - Gerenciamento Completo</h1>
            <p className="text-muted-foreground">Visualizar e editar dados completos dos usuários</p>
          </div>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome Completo</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>CPF</TableHead>
                <TableHead>Nível</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.nome_completo || "-"}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.telefone || "-"}</TableCell>
                  <TableCell>{user.cpf || "-"}</TableCell>
                  <TableCell>
                    <Badge className={getRoleBadgeColor(user.role)}>
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.is_active ? "default" : "secondary"}>
                      {user.is_active ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(user)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                Editar Usuário
                {editingUser && isRootAccount(editingUser.email) && (
                  <Badge className="ml-2 bg-red-500">CONTA RAIZ</Badge>
                )}
              </DialogTitle>
            </DialogHeader>
            
            {editingUser && (
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="nome_completo">Nome Completo</Label>
                  <Input
                    id="nome_completo"
                    value={editingUser.nome_completo || ""}
                    onChange={(e) => setEditingUser({ ...editingUser, nome_completo: e.target.value })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    value={editingUser.email}
                    disabled
                    className="bg-muted"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="telefone">Telefone</Label>
                    <Input
                      id="telefone"
                      value={editingUser.telefone || ""}
                      onChange={(e) => setEditingUser({ ...editingUser, telefone: e.target.value })}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="cpf">CPF</Label>
                    <Input
                      id="cpf"
                      value={editingUser.cpf || ""}
                      onChange={(e) => setEditingUser({ ...editingUser, cpf: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="data_nascimento">Data de Nascimento</Label>
                  <Input
                    id="data_nascimento"
                    type="date"
                    value={editingUser.data_nascimento || ""}
                    onChange={(e) => setEditingUser({ ...editingUser, data_nascimento: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="grid gap-2 col-span-2">
                    <Label htmlFor="endereco">Endereço</Label>
                    <Input
                      id="endereco"
                      value={editingUser.endereco || ""}
                      onChange={(e) => setEditingUser({ ...editingUser, endereco: e.target.value })}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="numero">Número</Label>
                    <Input
                      id="numero"
                      value={editingUser.numero || ""}
                      onChange={(e) => setEditingUser({ ...editingUser, numero: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="bairro">Bairro</Label>
                    <Input
                      id="bairro"
                      value={editingUser.bairro || ""}
                      onChange={(e) => setEditingUser({ ...editingUser, bairro: e.target.value })}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="referencia">Referência</Label>
                    <Input
                      id="referencia"
                      value={editingUser.referencia || ""}
                      onChange={(e) => setEditingUser({ ...editingUser, referencia: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="sexo">Sexo</Label>
                  <Select
                    value={editingUser.sexo || ""}
                    onValueChange={(value) => setEditingUser({ ...editingUser, sexo: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Masculino">Masculino</SelectItem>
                      <SelectItem value="Feminino">Feminino</SelectItem>
                      <SelectItem value="Outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="role">Nível</Label>
                  <Select
                    value={editingUser.role}
                    onValueChange={(value) => setEditingUser({ ...editingUser, role: value as UserRole })}
                    disabled={isRootAccount(editingUser.email)}
                  >
                    <SelectTrigger>
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

                <div className="flex items-center justify-between">
                  <Label htmlFor="is_active">Status Ativo</Label>
                  <Switch
                    id="is_active"
                    checked={editingUser.is_active}
                    onCheckedChange={(checked) => setEditingUser({ ...editingUser, is_active: checked })}
                    disabled={isRootAccount(editingUser.email)}
                  />
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave}>Salvar Alterações</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
