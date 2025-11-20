import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { ArrowLeft, Eye, Clock, MapPin, AlertCircle } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface Pedido {
  id: string;
  cliente_id: string;
  entregador_id: string;
  loja_nome: string;
  status: string;
  tempo_extra_minutos: number;
  valor_tempo_extra: number;
  movimento_loja: string | null;
  criado_em: string;
  aceita_ajuste: boolean | null;
}

interface PedidoLog {
  id: string;
  acao: string;
  detalhe: string;
  timestamp: string;
}

interface Parametros {
  id?: string;
  taxa_por_minuto: number;
  minutos_gratis: number;
  distancia_max_checkin: number;
  timeout_aceite: number;
}

export default function GerenciarPedidos() {
  const { isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loadingPedidos, setLoadingPedidos] = useState(true);
  const [selectedPedido, setSelectedPedido] = useState<Pedido | null>(null);
  const [logs, setLogs] = useState<PedidoLog[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [parametros, setParametros] = useState<Parametros | null>(null);
  const [editandoParametros, setEditandoParametros] = useState(false);

  useEffect(() => {
    if (!loading && !isAdmin) {
      navigate("/");
      toast.error("Acesso negado");
    }
  }, [isAdmin, loading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchPedidos();
      fetchParametros();
    }
  }, [isAdmin]);

  const fetchPedidos = async () => {
    try {
      setLoadingPedidos(true);
      const { data, error } = await supabase
        .from("pedidos")
        .select("*")
        .order("criado_em", { ascending: false });

      if (error) throw error;
      setPedidos(data || []);
    } catch (error) {
      toast.error("Erro ao carregar pedidos");
    } finally {
      setLoadingPedidos(false);
    }
  };

  const fetchParametros = async () => {
    try {
      const { data, error } = await supabase
        .from("parametros_sistema")
        .select("*")
        .limit(1)
        .single();

      if (error) throw error;
      setParametros(data);
    } catch (error) {
      console.error("Erro ao buscar parâmetros:", error);
    }
  };

  const fetchLogs = async (pedidoId: string) => {
    try {
      const { data, error } = await supabase
        .from("pedido_logs")
        .select("*")
        .eq("pedido_id", pedidoId)
        .order("timestamp", { ascending: false });

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      toast.error("Erro ao carregar logs");
    }
  };

  const handleVerDetalhes = async (pedido: Pedido) => {
    setSelectedPedido(pedido);
    await fetchLogs(pedido.id);
    setIsDialogOpen(true);
  };

  const handleSalvarParametros = async () => {
    if (!parametros || !parametros.id) return;

    try {
      const { error } = await supabase
        .from("parametros_sistema")
        .update({
          taxa_por_minuto: parametros.taxa_por_minuto,
          minutos_gratis: parametros.minutos_gratis,
          distancia_max_checkin: parametros.distancia_max_checkin,
          timeout_aceite: parametros.timeout_aceite
        })
        .eq("id", parametros.id);

      if (error) throw error;
      toast.success("Parâmetros atualizados com sucesso");
      setEditandoParametros(false);
    } catch (error) {
      toast.error("Erro ao atualizar parâmetros");
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      atribuido: { label: "Atribuído", variant: "secondary" },
      indo: { label: "Indo", variant: "default" },
      chegou_loja: { label: "Na loja", variant: "default" },
      coletando: { label: "Coletando", variant: "default" },
      fila: { label: "Na fila", variant: "outline" },
      a_caminho: { label: "A caminho", variant: "default" },
      concluido: { label: "Concluído", variant: "outline" },
      cancelado: { label: "Cancelado", variant: "destructive" },
    };
    
    const statusInfo = statusMap[status] || { label: status, variant: "secondary" };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  const getMovimentoBadge = (movimento: string | null) => {
    if (!movimento) return null;
    
    const cores = {
      verde: "bg-green-500 text-white",
      amarelo: "bg-yellow-500 text-white",
      vermelho: "bg-red-500 text-white"
    };
    
    return (
      <Badge className={cores[movimento as keyof typeof cores] || ""}>
        {movimento.toUpperCase()}
      </Badge>
    );
  };

  if (loading || loadingPedidos) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="bg-gradient-to-r from-red-500 to-red-700 text-white p-4 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/admin")}
            className="text-white hover:bg-white/20"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">Gerenciar Pedidos</h1>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Parâmetros do Sistema */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Parâmetros do Sistema</span>
              {!editandoParametros && (
                <Button onClick={() => setEditandoParametros(true)} size="sm">
                  Editar
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {parametros && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <Label>Taxa por minuto (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={parametros.taxa_por_minuto}
                    onChange={(e) => setParametros({ ...parametros, taxa_por_minuto: parseFloat(e.target.value) })}
                    disabled={!editandoParametros}
                  />
                </div>
                <div>
                  <Label>Minutos grátis</Label>
                  <Input
                    type="number"
                    value={parametros.minutos_gratis}
                    onChange={(e) => setParametros({ ...parametros, minutos_gratis: parseInt(e.target.value) })}
                    disabled={!editandoParametros}
                  />
                </div>
                <div>
                  <Label>Distância máx check-in (m)</Label>
                  <Input
                    type="number"
                    value={parametros.distancia_max_checkin}
                    onChange={(e) => setParametros({ ...parametros, distancia_max_checkin: parseInt(e.target.value) })}
                    disabled={!editandoParametros}
                  />
                </div>
                <div>
                  <Label>Timeout aceite (s)</Label>
                  <Input
                    type="number"
                    value={parametros.timeout_aceite}
                    onChange={(e) => setParametros({ ...parametros, timeout_aceite: parseInt(e.target.value) })}
                    disabled={!editandoParametros}
                  />
                </div>
              </div>
            )}
            {editandoParametros && (
              <div className="flex gap-2 mt-4">
                <Button onClick={handleSalvarParametros}>Salvar</Button>
                <Button variant="outline" onClick={() => {
                  setEditandoParametros(false);
                  fetchParametros();
                }}>
                  Cancelar
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Lista de Pedidos */}
        <Card>
          <CardHeader>
            <CardTitle>Pedidos ({pedidos.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Loja</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Movimento</TableHead>
                    <TableHead>Tempo Extra</TableHead>
                    <TableHead>Valor Extra</TableHead>
                    <TableHead>Aceite</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pedidos.map((pedido) => (
                    <TableRow key={pedido.id}>
                      <TableCell className="font-mono text-xs">
                        {pedido.id.substring(0, 8)}...
                      </TableCell>
                      <TableCell>{pedido.loja_nome}</TableCell>
                      <TableCell>{getStatusBadge(pedido.status)}</TableCell>
                      <TableCell>{getMovimentoBadge(pedido.movimento_loja)}</TableCell>
                      <TableCell>
                        {pedido.tempo_extra_minutos > 0 && (
                          <div className="flex items-center gap-1 text-sm">
                            <Clock className="h-3 w-3" />
                            {pedido.tempo_extra_minutos} min
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {pedido.valor_tempo_extra > 0 && (
                          <span className="text-sm font-semibold text-destructive">
                            R$ {pedido.valor_tempo_extra.toFixed(2)}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {pedido.aceita_ajuste === true && (
                          <Badge variant="outline" className="bg-green-100 text-green-800">
                            Aceito
                          </Badge>
                        )}
                        {pedido.aceita_ajuste === false && (
                          <Badge variant="destructive">Recusado</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-xs">
                        {new Date(pedido.criado_em).toLocaleString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleVerDetalhes(pedido)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Dialog de Detalhes */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Pedido</DialogTitle>
          </DialogHeader>
          
          {selectedPedido && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>ID:</strong> {selectedPedido.id}
                </div>
                <div>
                  <strong>Loja:</strong> {selectedPedido.loja_nome}
                </div>
                <div>
                  <strong>Status:</strong> {getStatusBadge(selectedPedido.status)}
                </div>
                <div>
                  <strong>Movimento:</strong> {getMovimentoBadge(selectedPedido.movimento_loja)}
                </div>
                <div>
                  <strong>Tempo Extra:</strong> {selectedPedido.tempo_extra_minutos} min
                </div>
                <div>
                  <strong>Valor Extra:</strong> R$ {selectedPedido.valor_tempo_extra.toFixed(2)}
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-2">Histórico de Ações</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {logs.map((log) => (
                    <div key={log.id} className="bg-muted p-3 rounded-md text-sm">
                      <div className="flex items-start justify-between">
                        <span className="font-medium">{log.acao}</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(log.timestamp).toLocaleString('pt-BR')}
                        </span>
                      </div>
                      {log.detalhe && (
                        <div className="text-muted-foreground mt-1">{log.detalhe}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
