import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { 
  Truck, 
  Eye, 
  MapPin, 
  Clock, 
  Package, 
  Search,
  Filter,
  Activity,
  User,
  Phone,
  Mail
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Entregador {
  id: string;
  email: string;
  nome_completo: string | null;
  telefone: string | null;
  is_active: boolean;
  pedidoAtual?: {
    id: string;
    status: string;
    loja_nome: string;
    inicio_coleta: string | null;
    tempo_extra_minutos: number;
    itens: any;
  } | null;
}

export default function Entregadores() {
  const { isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [entregadores, setEntregadores] = useState<Entregador[]>([]);
  const [filteredEntregadores, setFilteredEntregadores] = useState<Entregador[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("todos");

  useEffect(() => {
    if (!loading && !isAdmin) {
      navigate("/");
      toast.error("Acesso negado");
    }
  }, [isAdmin, loading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchEntregadores();
      
      // Setup realtime subscription for pedidos
      const channel = supabase
        .channel('entregadores-updates')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'pedidos'
          },
          () => {
            fetchEntregadores();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [isAdmin]);

  useEffect(() => {
    filterEntregadores();
  }, [searchTerm, statusFilter, entregadores]);

  const fetchEntregadores = async () => {
    try {
      setLoadingData(true);

      // Buscar IDs dos entregadores
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

      // Buscar perfis dos entregadores
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .in("id", entregadorIds);

      if (profilesError) throw profilesError;

      // Buscar pedidos ativos de cada entregador
      const { data: pedidos, error: pedidosError } = await supabase
        .from("pedidos")
        .select("*")
        .in("entregador_id", entregadorIds)
        .in("status", ["atribuido", "indo", "chegou_loja", "coletando", "fila", "a_caminho"]);

      if (pedidosError) throw pedidosError;

      // Combinar dados
      const entregadoresComPedidos = profiles?.map(profile => {
        const pedidoAtual = pedidos?.find(p => p.entregador_id === profile.id);
        return {
          ...profile,
          pedidoAtual: pedidoAtual || null
        };
      }) || [];

      setEntregadores(entregadoresComPedidos);
    } catch (error) {
      console.error("Error fetching entregadores:", error);
      toast.error("Erro ao carregar entregadores");
    } finally {
      setLoadingData(false);
    }
  };

  const filterEntregadores = () => {
    let filtered = entregadores;

    // Filtro de busca
    if (searchTerm) {
      filtered = filtered.filter(e => 
        e.nome_completo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.telefone?.includes(searchTerm)
      );
    }

    // Filtro de status
    if (statusFilter !== "todos") {
      if (statusFilter === "ativos") {
        filtered = filtered.filter(e => e.is_active);
      } else if (statusFilter === "inativos") {
        filtered = filtered.filter(e => !e.is_active);
      } else if (statusFilter === "ocupados") {
        filtered = filtered.filter(e => e.pedidoAtual !== null);
      } else if (statusFilter === "disponiveis") {
        filtered = filtered.filter(e => e.pedidoAtual === null && e.is_active);
      }
    }

    setFilteredEntregadores(filtered);
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      atribuido: { label: "Atribuído", variant: "secondary" },
      indo: { label: "Indo", variant: "default" },
      chegou_loja: { label: "Na loja", variant: "default" },
      coletando: { label: "Coletando", variant: "default" },
      fila: { label: "Na fila", variant: "outline" },
      a_caminho: { label: "A caminho", variant: "default" },
    };
    
    const statusInfo = statusMap[status] || { label: status, variant: "secondary" };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  const calcularTempoColeta = (inicioColeta: string | null) => {
    if (!inicioColeta) return "N/A";
    const inicio = new Date(inicioColeta).getTime();
    const agora = Date.now();
    const minutos = Math.floor((agora - inicio) / 60000);
    return `${minutos} min`;
  };

  const getEntregadorStatus = (entregador: Entregador) => {
    if (!entregador.is_active) {
      return { label: "Inativo", color: "bg-gray-500" };
    }
    if (entregador.pedidoAtual) {
      return { label: "Ocupado", color: "bg-yellow-500" };
    }
    return { label: "Disponível", color: "bg-green-500" };
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

  const stats = {
    total: entregadores.length,
    ativos: entregadores.filter(e => e.is_active).length,
    ocupados: entregadores.filter(e => e.pedidoAtual !== null).length,
    disponiveis: entregadores.filter(e => e.pedidoAtual === null && e.is_active).length,
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-3xl font-bold text-foreground">Entregadores Ativos</h2>
          <p className="text-muted-foreground">
            Monitore os entregadores em tempo real
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Truck className="h-5 w-5 text-primary" />
                <span className="text-2xl font-bold">{stats.total}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Ativos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-green-500" />
                <span className="text-2xl font-bold">{stats.ativos}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Ocupados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-yellow-500" />
                <span className="text-2xl font-bold">{stats.ocupados}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Disponíveis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Truck className="h-5 w-5 text-blue-500" />
                <span className="text-2xl font-bold">{stats.disponiveis}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, email ou telefone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="ativos">Ativos</SelectItem>
              <SelectItem value="inativos">Inativos</SelectItem>
              <SelectItem value="ocupados">Ocupados</SelectItem>
              <SelectItem value="disponiveis">Disponíveis</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Entregadores List */}
        {filteredEntregadores.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Truck className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">
                {searchTerm || statusFilter !== "todos" 
                  ? "Nenhum entregador encontrado com os filtros aplicados."
                  : "Nenhum entregador cadastrado ainda."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredEntregadores.map((entregador) => {
              const status = getEntregadorStatus(entregador);
              return (
                <Card key={entregador.id} className="relative">
                  <div className={`absolute top-2 right-2 w-3 h-3 rounded-full ${status.color} animate-pulse`} />
                  
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <User className="h-5 w-5 text-primary" />
                          {entregador.nome_completo || "Sem nome"}
                        </CardTitle>
                        <Badge className="mt-1" variant={entregador.is_active ? "default" : "secondary"}>
                          {status.label}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    {/* Informações de contato */}
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="h-4 w-4" />
                        <span className="truncate">{entregador.email}</span>
                      </div>
                      {entregador.telefone && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="h-4 w-4" />
                          <span>{entregador.telefone}</span>
                        </div>
                      )}
                    </div>

                    {/* Pedido Atual */}
                    {entregador.pedidoAtual && (
                      <div className="border-t pt-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Pedido Atual:</span>
                          {getStatusBadge(entregador.pedidoAtual.status)}
                        </div>
                        <div className="space-y-1 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-3 w-3" />
                            <span className="truncate">{entregador.pedidoAtual.loja_nome}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Package className="h-3 w-3" />
                            <span>{entregador.pedidoAtual.itens?.length || 0} itens</span>
                          </div>
                          {entregador.pedidoAtual.inicio_coleta && (
                            <div className="flex items-center gap-2">
                              <Clock className="h-3 w-3" />
                              <span>Tempo: {calcularTempoColeta(entregador.pedidoAtual.inicio_coleta)}</span>
                            </div>
                          )}
                          {entregador.pedidoAtual.tempo_extra_minutos > 0 && (
                            <div className="text-xs text-destructive font-semibold">
                              ⚠️ Tempo extra: {entregador.pedidoAtual.tempo_extra_minutos} min
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
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
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
