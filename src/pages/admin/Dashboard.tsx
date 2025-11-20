import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Users, Store, Package, Truck, ShoppingCart, TrendingUp } from "lucide-react";

export default function AdminDashboard() {
  const { isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalLojas: 0,
    totalProdutos: 0,
    totalPedidos: 0,
  });

  useEffect(() => {
    if (!loading && !isAdmin) {
      navigate("/");
      toast.error("Acesso negado");
    }
  }, [isAdmin, loading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchStats();
    }
  }, [isAdmin]);

  const fetchStats = async () => {
    try {
      const [usersCount, lojasCount, produtosCount, pedidosCount] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("lojas").select("*", { count: "exact", head: true }),
        supabase.from("produtos").select("*", { count: "exact", head: true }),
        supabase.from("pedidos").select("*", { count: "exact", head: true }),
      ]);

      setStats({
        totalUsers: usersCount.count || 0,
        totalLojas: lojasCount.count || 0,
        totalProdutos: produtosCount.count || 0,
        totalPedidos: pedidosCount.count || 0,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Dashboard</h2>
          <p className="text-muted-foreground">
            Visão geral do sistema PWA BUSQUEI
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Usuários</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">
                Usuários cadastrados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Lojas</CardTitle>
              <Store className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalLojas}</div>
              <p className="text-xs text-muted-foreground">
                Lojas no sistema
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Produtos</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalProdutos}</div>
              <p className="text-xs text-muted-foreground">
                Produtos cadastrados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Pedidos</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalPedidos}</div>
              <p className="text-xs text-muted-foreground">
                Pedidos realizados
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div
              className="p-4 border rounded-lg cursor-pointer hover:bg-muted transition-colors"
              onClick={() => navigate("/admin/seeds")}
            >
              <Users className="h-8 w-8 mb-2 text-primary" />
              <h3 className="font-semibold">Gerenciar Usuários</h3>
              <p className="text-sm text-muted-foreground">
                Ver e editar usuários
              </p>
            </div>

            <div
              className="p-4 border rounded-lg cursor-pointer hover:bg-muted transition-colors"
              onClick={() => navigate("/admin/lojas")}
            >
              <Store className="h-8 w-8 mb-2 text-primary" />
              <h3 className="font-semibold">Criar Nova Loja</h3>
              <p className="text-sm text-muted-foreground">
                Adicionar loja ao sistema
              </p>
            </div>

            <div
              className="p-4 border rounded-lg cursor-pointer hover:bg-muted transition-colors"
              onClick={() => navigate("/admin/importacoes")}
            >
              <TrendingUp className="h-8 w-8 mb-2 text-primary" />
              <h3 className="font-semibold">Importar Dados</h3>
              <p className="text-sm text-muted-foreground">
                Importar lojas e produtos
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
