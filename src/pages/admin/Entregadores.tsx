import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Truck, Eye, MapPin } from "lucide-react";

interface Entregador {
  id: string;
  email: string;
  nome_completo: string | null;
  telefone: string | null;
  is_active: boolean;
}

export default function Entregadores() {
  const { isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [entregadores, setEntregadores] = useState<Entregador[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!loading && !isAdmin) {
      navigate("/");
      toast.error("Acesso negado");
    }
  }, [isAdmin, loading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchEntregadores();
    }
  }, [isAdmin]);

  const fetchEntregadores = async () => {
    try {
      setLoadingData(true);

      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "ENTREGADOR");

      if (rolesError) throw rolesError;

      const entregadorIds = roles.map((r) => r.user_id);

      if (entregadorIds.length === 0) {
        setEntregadores([]);
        return;
      }

      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .in("id", entregadorIds);

      if (profilesError) throw profilesError;

      setEntregadores(profiles || []);
    } catch (error) {
      console.error("Error fetching entregadores:", error);
      toast.error("Erro ao carregar entregadores");
    } finally {
      setLoadingData(false);
    }
  };

  if (loading || loadingData) {
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
          <h2 className="text-3xl font-bold text-foreground">Entregadores</h2>
          <p className="text-muted-foreground">
            Gerencie os entregadores cadastrados no sistema
          </p>
        </div>

        {entregadores.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Truck className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">
                Nenhum entregador cadastrado ainda.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {entregadores.map((entregador) => (
              <Card key={entregador.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">
                      {entregador.nome_completo || "Sem nome"}
                    </CardTitle>
                    <Badge variant={entregador.is_active ? "default" : "secondary"}>
                      {entregador.is_active ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Email: {entregador.email}
                  </p>
                  {entregador.telefone && (
                    <p className="text-sm text-muted-foreground">
                      Tel: {entregador.telefone}
                    </p>
                  )}
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => navigate("/entregador")}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Ver Painel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
