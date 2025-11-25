import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminLayoutWithSidebar } from "@/components/admin/AdminLayoutWithSidebar";
import { useRole } from "@/hooks/useRole";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Package, TrendingUp, Users, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface KPIs {
  pedidosHoje: number;
  entregadoresOnline: number;
  produtosToReview: number;
  importErrors: number;
}

export default function DashboardNew() {
  const navigate = useNavigate();
  const { isAdmin, loading } = useRole();
  const [kpis, setKpis] = useState<KPIs>({
    pedidosHoje: 0,
    entregadoresOnline: 0,
    produtosToReview: 0,
    importErrors: 0,
  });
  const [loadingKpis, setLoadingKpis] = useState(true);

  useEffect(() => {
    if (loading) return;

    if (!isAdmin) {
      navigate("/");
      return;
    }

    fetchKPIs();
  }, [isAdmin, loading, navigate]);

  const fetchKPIs = async () => {
    try {
      setLoadingKpis(true);

      // Pedidos de hoje
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { count: pedidosCount } = await supabase
        .from("pedidos")
        .select("*", { count: "exact", head: true })
        .gte("criado_em", today.toISOString());

      // Entregadores ativos (considerando pedidos em andamento)
      const { data: entregadoresData } = await supabase
        .from("pedidos")
        .select("entregador_id")
        .in("status", ["atribuido", "coletando", "em_transito"])
        .not("entregador_id", "is", null);

      const uniqueEntregadores = new Set(
        entregadoresData?.map((p) => p.entregador_id) || []
      ).size;

      // Produtos sem revisão (placeholder - ajustar conforme necessário)
      const produtosToReview = 0;

      // Erros de importação (últimos 7 dias)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const { count: errorsCount } = await supabase
        .from("system_logs")
        .select("*", { count: "exact", head: true })
        .eq("action", "import_error")
        .gte("timestamp", sevenDaysAgo.toISOString());

      setKpis({
        pedidosHoje: pedidosCount || 0,
        entregadoresOnline: uniqueEntregadores,
        produtosToReview,
        importErrors: errorsCount || 0,
      });
    } catch (error) {
      console.error("Erro ao carregar KPIs:", error);
      toast.error("Erro ao carregar dados do dashboard");
    } finally {
      setLoadingKpis(false);
    }
  };

  if (loading) {
    return (
      <AdminLayoutWithSidebar>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </AdminLayoutWithSidebar>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <AdminLayoutWithSidebar>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Visão geral das operações do sistema
          </p>
        </div>

        {loadingKpis ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pedidos Hoje</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpis.pedidosHoje}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Pedidos criados nas últimas 24h
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Entregadores Online
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpis.entregadoresOnline}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Entregadores com pedidos ativos
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Produtos a Revisar
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpis.produtosToReview}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Produtos aguardando validação
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Erros de Importação
                </CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpis.importErrors}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Erros nos últimos 7 dias
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Atividades Recentes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Nenhuma atividade recente registrada.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Alertas do Sistema</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Nenhum alerta no momento.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayoutWithSidebar>
  );
}
