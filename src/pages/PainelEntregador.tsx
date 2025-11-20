import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { 
  MapPin, 
  Package, 
  Clock, 
  Camera, 
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Truck,
  Users,
  FileText
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface Pedido {
  id: string;
  cliente_id: string;
  loja_nome: string;
  loja_lat: number | null;
  loja_lng: number | null;
  itens: any;
  status: string;
  checkin_loja: string | null;
  inicio_coleta: string | null;
  inicio_fila: string | null;
  tempo_extra_minutos: number;
  taxa_por_minuto: number;
  valor_tempo_extra: number;
  fotos: any;
  movimento_loja: string | null;
  nota_fiscal_url: string | null;
  obs_entregador: string | null;
}

interface Parametros {
  taxa_por_minuto: number;
  minutos_gratis: number;
  distancia_max_checkin: number;
  timeout_aceite: number;
}

export default function PainelEntregador() {
  const { user, userRole, loading } = useAuth();
  const navigate = useNavigate();
  const [pedidoAtual, setPedidoAtual] = useState<Pedido | null>(null);
  const [parametros, setParametros] = useState<Parametros | null>(null);
  const [timerSegundos, setTimerSegundos] = useState(0);
  const [loadingAction, setLoadingAction] = useState(false);
  const [gpsAtivo, setGpsAtivo] = useState(false);
  const [localizacao, setLocalizacao] = useState<{ lat: number; lng: number } | null>(null);
  const [obsEntregador, setObsEntregador] = useState("");
  const [uploadingFoto, setUploadingFoto] = useState(false);
  
  // Novos estados para GPS
  const [permissaoGPS, setPermissaoGPS] = useState<'nao_solicitada' | 'solicitando' | 'concedida' | 'negada'>('nao_solicitada');
  const [precisaoGPS, setPrecisaoGPS] = useState<number>(0);
  const [watchId, setWatchId] = useState<number | null>(null);
  const [tentativasReconexao, setTentativasReconexao] = useState(0);

  useEffect(() => {
    if (!loading && userRole !== "ENTREGADOR") {
      navigate("/");
      toast.error("Acesso negado - apenas entregadores");
    }
  }, [userRole, loading, navigate]);

  useEffect(() => {
    if (userRole === "ENTREGADOR" && user) {
      fetchPedidoAtual();
      fetchParametros();
    }
  }, [userRole, user]);

  useEffect(() => {
    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [watchId]);

  useEffect(() => {
    if (pedidoAtual?.inicio_coleta && pedidoAtual.status === 'coletando') {
      const interval = setInterval(() => {
        calcularTempoExtra();
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [pedidoAtual]);

  const solicitarPermissaoGPS = async () => {
    if (!("geolocation" in navigator)) {
      toast.error("Seu dispositivo não suporta GPS");
      return;
    }

    setPermissaoGPS('solicitando');
    
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        });
      });
      
      iniciarMonitoramentoContinuo();
      setPermissaoGPS('concedida');
      toast.success("GPS ativado com sucesso!");
      
    } catch (error: any) {
      setPermissaoGPS('negada');
      if (error.code === 1) {
        toast.error("Permissão GPS negada. Por favor, ative nas configurações do navegador.");
      } else if (error.code === 2) {
        toast.error("GPS indisponível. Verifique se a localização está ativada no dispositivo.");
      } else {
        toast.error("Erro ao obter localização. Tente novamente.");
      }
    }
  };

  const iniciarMonitoramentoContinuo = () => {
    if (!("geolocation" in navigator)) return;
    
    const id = navigator.geolocation.watchPosition(
      (position) => {
        setGpsAtivo(true);
        setPermissaoGPS('concedida');
        setLocalizacao({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setPrecisaoGPS(Math.round(position.coords.accuracy));
        setTentativasReconexao(0);
        
        if (position.coords.accuracy > 50) {
          toast.warning(`GPS com precisão baixa: ${Math.round(position.coords.accuracy)}m`, {
            duration: 3000
          });
        }
      },
      (error) => {
        setGpsAtivo(false);
        console.error("Erro GPS:", error);
        
        if (tentativasReconexao < 3) {
          setTimeout(() => {
            setTentativasReconexao(prev => prev + 1);
            toast.info(`Tentando reconectar GPS... (${tentativasReconexao + 1}/3)`);
            iniciarMonitoramentoContinuo();
          }, 5000);
        } else {
          toast.error("GPS desativado - ative para continuar");
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      }
    );
    
    setWatchId(id);
  };

  const iniciarMonitoramentoGPS = () => {
    if (permissaoGPS === 'nao_solicitada') {
      return;
    }
    iniciarMonitoramentoContinuo();
  };

  const fetchPedidoAtual = async () => {
    try {
      const { data, error } = await supabase
        .from("pedidos")
        .select("*")
        .eq("entregador_id", user?.id)
        .in("status", ["atribuido", "indo", "chegou_loja", "coletando", "fila", "a_caminho"])
        .order("criado_em", { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== "PGRST116") throw error;
      setPedidoAtual(data);
      if (data?.obs_entregador) setObsEntregador(data.obs_entregador);
    } catch (error) {
      console.error("Erro ao buscar pedido:", error);
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

  const calcularTempoExtra = () => {
    if (!pedidoAtual?.inicio_coleta || !parametros) return;
    
    const inicioColeta = new Date(pedidoAtual.inicio_coleta).getTime();
    const agora = Date.now();
    const segundosDecorridos = Math.floor((agora - inicioColeta) / 1000);
    setTimerSegundos(segundosDecorridos);

    const minutosGratis = parametros.minutos_gratis * 60;
    if (segundosDecorridos > minutosGratis) {
      const segundosExtras = segundosDecorridos - minutosGratis;
      const minutosExtras = Math.ceil(segundosExtras / 60);
      const valorExtra = minutosExtras * parametros.taxa_por_minuto;
      
      atualizarTempoExtra(minutosExtras, valorExtra);
    }
  };

  const atualizarTempoExtra = async (minutos: number, valor: number) => {
    if (!pedidoAtual) return;
    
    try {
      await supabase
        .from("pedidos")
        .update({
          tempo_extra_minutos: minutos,
          valor_tempo_extra: valor
        })
        .eq("id", pedidoAtual.id);
    } catch (error) {
      console.error("Erro ao atualizar tempo extra:", error);
    }
  };

  const registrarLog = async (acao: string, detalhe: string = "") => {
    if (!pedidoAtual) return;
    
    try {
      await supabase
        .from("pedido_logs")
        .insert({
          pedido_id: pedidoAtual.id,
          acao,
          usuario_id: user?.id,
          detalhe
        });
    } catch (error) {
      console.error("Erro ao registrar log:", error);
    }
  };

  const calcularDistancia = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371e3;
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lng2 - lng1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) *
      Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  const handleIndoParaLoja = async () => {
    if (!pedidoAtual) return;
    
    setLoadingAction(true);
    try {
      await supabase
        .from("pedidos")
        .update({ status: "indo" })
        .eq("id", pedidoAtual.id);
      
      await registrarLog("indo_loja", "Entregador iniciou deslocamento para a loja");
      toast.success("Status atualizado: Indo para a loja");
      await fetchPedidoAtual();
    } catch (error) {
      toast.error("Erro ao atualizar status");
    } finally {
      setLoadingAction(false);
    }
  };

  const handleChegueiNaLoja = async () => {
    if (!pedidoAtual || !localizacao || !parametros) return;
    
    if (!gpsAtivo) {
      toast.error("GPS inativo. Por favor, ative a localização.");
      return;
    }
    
    if (!pedidoAtual.loja_lat || !pedidoAtual.loja_lng) {
      toast.error("Coordenadas da loja não disponíveis");
      return;
    }

    const distancia = calcularDistancia(
      localizacao.lat,
      localizacao.lng,
      pedidoAtual.loja_lat,
      pedidoAtual.loja_lng
    );

    if (distancia > parametros.distancia_max_checkin) {
      toast.error(`Você está a ${Math.round(distancia)}m da loja. Aproxime-se mais (máx ${parametros.distancia_max_checkin}m)`);
      return;
    }

    setLoadingAction(true);
    try {
      await supabase
        .from("pedidos")
        .update({ 
          status: "chegou_loja",
          checkin_loja: new Date().toISOString()
        })
        .eq("id", pedidoAtual.id);
      
      const gpsData = {
        lat: localizacao.lat,
        lng: localizacao.lng,
        precisao_metros: precisaoGPS,
        distancia_loja_metros: Math.round(distancia),
        timestamp: new Date().toISOString()
      };
      
      await registrarLog("chegada_loja", JSON.stringify(gpsData));
      toast.success("Check-in realizado com sucesso!");
      await fetchPedidoAtual();
    } catch (error) {
      toast.error("Erro ao fazer check-in");
    } finally {
      setLoadingAction(false);
    }
  };

  const handleIniciarColeta = async () => {
    if (!pedidoAtual || !parametros) return;
    
    setLoadingAction(true);
    try {
      await supabase
        .from("pedidos")
        .update({ 
          status: "coletando",
          inicio_coleta: new Date().toISOString()
        })
        .eq("id", pedidoAtual.id);
      
      await registrarLog("inicio_coleta", `Timer iniciado - ${parametros.minutos_gratis} min grátis, depois R$ ${parametros.taxa_por_minuto}/min`);
      toast.success(`Timer iniciado! ${parametros.minutos_gratis} min grátis`);
      await fetchPedidoAtual();
    } catch (error) {
      toast.error("Erro ao iniciar coleta");
    } finally {
      setLoadingAction(false);
    }
  };

  const handleEstouNaFila = async () => {
    if (!pedidoAtual) return;
    
    setLoadingAction(true);
    try {
      await supabase
        .from("pedidos")
        .update({ 
          status: "fila",
          inicio_fila: new Date().toISOString()
        })
        .eq("id", pedidoAtual.id);
      
      await registrarLog("entrada_fila", "Entregador marcou entrada na fila");
      toast.success("Marcado como 'na fila'");
      await fetchPedidoAtual();
    } catch (error) {
      toast.error("Erro ao atualizar status");
    } finally {
      setLoadingAction(false);
    }
  };

  const handleACaminhoCliente = async () => {
    if (!pedidoAtual) return;
    
    setLoadingAction(true);
    try {
      await supabase
        .from("pedidos")
        .update({ 
          status: "a_caminho",
          saida_loja: new Date().toISOString()
        })
        .eq("id", pedidoAtual.id);
      
      await registrarLog("saida_loja", "Entregador saiu da loja com pedido");
      toast.success("A caminho do cliente!");
      await fetchPedidoAtual();
    } catch (error) {
      toast.error("Erro ao atualizar status");
    } finally {
      setLoadingAction(false);
    }
  };

  const handleFinalizarPedido = async () => {
    if (!pedidoAtual) return;
    
    if (!window.confirm("Confirmar finalização do pedido?")) return;
    
    setLoadingAction(true);
    try {
      await supabase
        .from("pedidos")
        .update({ 
          status: "concluido",
          chegada_cliente: new Date().toISOString()
        })
        .eq("id", pedidoAtual.id);
      
      await registrarLog("pedido_concluido", "Pedido finalizado com sucesso");
      toast.success("Pedido concluído!");
      setPedidoAtual(null);
      await fetchPedidoAtual();
    } catch (error) {
      toast.error("Erro ao finalizar pedido");
    } finally {
      setLoadingAction(false);
    }
  };

  const handleMovimento = async (cor: string) => {
    if (!pedidoAtual) return;
    
    setLoadingAction(true);
    try {
      await supabase
        .from("pedidos")
        .update({ movimento_loja: cor })
        .eq("id", pedidoAtual.id);
      
      await registrarLog("movimento_loja", `Movimento marcado como ${cor}`);
      
      if (cor === "vermelho") {
        toast.warning("Loja LOTADA reportada - cliente e suporte notificados");
      } else {
        toast.success(`Movimento: ${cor}`);
      }
      
      await fetchPedidoAtual();
    } catch (error) {
      toast.error("Erro ao atualizar movimento");
    } finally {
      setLoadingAction(false);
    }
  };

  const handleUploadFoto = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0 || !pedidoAtual || !user) return;
    
    const file = event.target.files[0];
    const fotosAtuais = pedidoAtual.fotos || [];
    
    if (fotosAtuais.length >= 2) {
      toast.error("Máximo de 2 fotos permitidas");
      return;
    }

    setUploadingFoto(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${pedidoAtual.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('pedidos')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('pedidos')
        .getPublicUrl(fileName);

      const novasFotos = [...fotosAtuais, publicUrl];
      
      await supabase
        .from("pedidos")
        .update({ fotos: novasFotos })
        .eq("id", pedidoAtual.id);

      await registrarLog("upload_foto", `Foto ${novasFotos.length} enviada`);
      toast.success("Foto enviada com sucesso!");
      await fetchPedidoAtual();
    } catch (error) {
      toast.error("Erro ao fazer upload da foto");
    } finally {
      setUploadingFoto(false);
    }
  };

  const handleSalvarObs = async () => {
    if (!pedidoAtual) return;
    
    try {
      await supabase
        .from("pedidos")
        .update({ obs_entregador: obsEntregador })
        .eq("id", pedidoAtual.id);
      
      await registrarLog("observacao", obsEntregador);
      toast.success("Observação salva");
    } catch (error) {
      toast.error("Erro ao salvar observação");
    }
  };

  const formatarTempo = (segundos: number) => {
    const mins = Math.floor(segundos / 60);
    const secs = segundos % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getNomeUsuario = () => {
    return user?.email?.split('@')[0] || "Entregador";
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      atribuido: { label: "Atribuído", variant: "secondary" },
      indo: { label: "Indo para loja", variant: "default" },
      chegou_loja: { label: "Na loja", variant: "default" },
      coletando: { label: "Coletando", variant: "default" },
      fila: { label: "Na fila", variant: "outline" },
      a_caminho: { label: "A caminho", variant: "default" },
      concluido: { label: "Concluído", variant: "outline" },
    };
    
    const statusInfo = statusMap[status] || { label: status, variant: "secondary" };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground p-4 shadow-lg">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
            className="text-primary-foreground hover:bg-primary-foreground/20"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 border-2 border-primary-foreground/30">
                <AvatarFallback className="bg-primary-foreground/20 text-primary-foreground font-semibold">
                  {getNomeUsuario().charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="text-left">
                <div className="font-semibold text-sm">{getNomeUsuario()}</div>
              </div>
            </div>
            <Badge 
              variant={gpsAtivo ? "default" : "destructive"} 
              className={`mt-2 ${gpsAtivo ? "animate-pulse bg-green-500" : "bg-red-500"}`}
            >
              <MapPin className="w-3 h-3 mr-1" />
              {gpsAtivo ? `GPS ATIVO (±${precisaoGPS}m)` : "GPS INATIVO"}
            </Badge>
          </div>
          
          <div className="w-10" />
        </div>
      </div>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {permissaoGPS === 'nao_solicitada' && (
          <Card className="border-2 border-primary shadow-lg p-6 text-center bg-card">
            <MapPin className="w-16 h-16 mx-auto mb-4 text-primary animate-bounce" />
            <h3 className="text-xl font-bold mb-2">
              Precisamos da sua localização em tempo real
            </h3>
            <p className="text-muted-foreground mb-4">
              Para garantir que você está realmente nas lojas e validar suas entregas,
              precisamos acessar sua localização continuamente durante o pedido.
            </p>
            <Button 
              size="lg" 
              onClick={solicitarPermissaoGPS}
              className="w-full"
            >
              <MapPin className="mr-2" />
              Ativar Localização
            </Button>
          </Card>
        )}

        {permissaoGPS === 'solicitando' && (
          <Card className="border-2 border-primary shadow-lg p-6 text-center bg-card">
            <MapPin className="w-16 h-16 mx-auto mb-4 text-primary animate-spin" />
            <h3 className="text-xl font-bold mb-2">
              Solicitando permissão GPS...
            </h3>
            <p className="text-muted-foreground">
              Por favor, aceite a permissão no navegador
            </p>
          </Card>
        )}

        {permissaoGPS === 'negada' && (
          <Card className="border-2 border-destructive shadow-lg p-6 bg-card">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-destructive" />
            <h3 className="text-lg font-bold mb-2 text-center">
              Permissão GPS Negada
            </h3>
            <p className="text-muted-foreground mb-4 text-sm">
              Para usar o painel do entregador, você precisa permitir o acesso à localização.
            </p>
            <div className="space-y-2 mb-4 text-sm">
              <p className="font-semibold">Como ativar:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li><strong>Android Chrome:</strong> Configurações → Apps → Chrome → Permissões → Localização</li>
                <li><strong>iPhone Safari:</strong> Ajustes → Safari → Localização → Permitir</li>
                <li><strong>Desktop:</strong> Clique no ícone de cadeado na barra de endereço → Permissões → Localização</li>
              </ul>
            </div>
            <Button 
              onClick={solicitarPermissaoGPS}
              className="w-full"
            >
              Tentar Novamente
            </Button>
          </Card>
        )}

        {!pedidoAtual && permissaoGPS === 'concedida' ? (
          <Card className="p-8 text-center">
            <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">Nenhum pedido ativo</h2>
            <p className="text-sm text-muted-foreground">
              Aguarde a atribuição de um novo pedido
            </p>
          </Card>
        ) : null}

        {pedidoAtual && permissaoGPS === 'concedida' && (
          <>
            {/* Card do Pedido */}
            <Card className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Pedido Atual</h2>
                {getStatusBadge(pedidoAtual.status)}
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-primary mt-0.5" />
                  <div>
                    <div className="font-medium">{pedidoAtual.loja_nome}</div>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Package className="h-4 w-4 text-primary mt-0.5" />
                  <div>
                    <div className="font-medium">Itens ({pedidoAtual.itens?.length || 0})</div>
                  </div>
                </div>

                {pedidoAtual.inicio_coleta && parametros && (
                  <div className="flex items-start gap-2">
                    <Clock className="h-4 w-4 text-primary mt-0.5" />
                    <div className="flex-1">
                      <div className="font-medium">Timer: {formatarTempo(timerSegundos)}</div>
                      {timerSegundos > (parametros.minutos_gratis * 60) && (
                        <div className="text-xs text-destructive font-semibold">
                          Tempo extra: {pedidoAtual.tempo_extra_minutos} min = R$ {pedidoAtual.valor_tempo_extra.toFixed(2)}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Botões de Ação Sequenciais */}
            <Card className="p-4 space-y-3">
              <h3 className="font-semibold mb-2">Ações</h3>

              {pedidoAtual.status === "atribuido" && (
                <Button 
                  className="w-full" 
                  onClick={handleIndoParaLoja}
                  disabled={loadingAction || !gpsAtivo}
                >
                  {!gpsAtivo && <AlertCircle className="mr-2 h-4 w-4" />}
                  <Truck className="mr-2 h-4 w-4" />
                  Indo para a loja
                </Button>
              )}
              {!gpsAtivo && pedidoAtual.status === "atribuido" && (
                <p className="text-sm text-destructive text-center">
                  ⚠️ Ative o GPS para continuar
                </p>
              )}

              {pedidoAtual.status === "indo" && (
                <>
                  <Button 
                    className="w-full" 
                    onClick={handleChegueiNaLoja}
                    disabled={loadingAction || !gpsAtivo}
                  >
                    {!gpsAtivo && <AlertCircle className="mr-2 h-4 w-4" />}
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Cheguei na loja
                  </Button>
                  {!gpsAtivo && (
                    <p className="text-sm text-destructive text-center">
                      ⚠️ Ative o GPS para continuar
                    </p>
                  )}
                </>
              )}

              {pedidoAtual.status === "chegou_loja" && (
                <Button 
                  className="w-full" 
                  onClick={handleIniciarColeta}
                  disabled={loadingAction}
                >
                  <Clock className="mr-2 h-4 w-4" />
                  Iniciar coleta (Timer 10 min)
                </Button>
              )}

              {pedidoAtual.status === "coletando" && (
                <Button 
                  className="w-full" 
                  onClick={handleEstouNaFila}
                  disabled={loadingAction}
                >
                  <Users className="mr-2 h-4 w-4" />
                  Estou na fila
                </Button>
              )}

              {pedidoAtual.status === "fila" && (
                <Button 
                  className="w-full" 
                  onClick={handleACaminhoCliente}
                  disabled={loadingAction}
                >
                  <Truck className="mr-2 h-4 w-4" />
                  A caminho do cliente
                </Button>
              )}

              {pedidoAtual.status === "a_caminho" && (
                <Button 
                  className="w-full" 
                  onClick={handleFinalizarPedido}
                  disabled={loadingAction}
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Finalizar pedido
                </Button>
              )}
            </Card>

            {/* Indicador de Movimento */}
            {pedidoAtual.status !== "atribuido" && pedidoAtual.status !== "concluido" && (
              <Card className="p-4 space-y-3">
                <h3 className="font-semibold">Movimento da Loja</h3>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    variant={pedidoAtual.movimento_loja === "verde" ? "default" : "outline"}
                    className="bg-green-500 hover:bg-green-600 text-white"
                    onClick={() => handleMovimento("verde")}
                    disabled={loadingAction}
                  >
                    Verde
                  </Button>
                  <Button
                    variant={pedidoAtual.movimento_loja === "amarelo" ? "default" : "outline"}
                    className="bg-yellow-500 hover:bg-yellow-600 text-white"
                    onClick={() => handleMovimento("amarelo")}
                    disabled={loadingAction}
                  >
                    Amarelo
                  </Button>
                  <Button
                    variant={pedidoAtual.movimento_loja === "vermelho" ? "default" : "outline"}
                    className="bg-red-500 hover:bg-red-600 text-white"
                    onClick={() => handleMovimento("vermelho")}
                    disabled={loadingAction}
                  >
                    Vermelho
                  </Button>
                </div>
              </Card>
            )}

            {/* Upload de Fotos */}
            <Card className="p-4 space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Camera className="h-4 w-4" />
                Fotos ({pedidoAtual.fotos?.length || 0}/2)
              </h3>
              
              {(pedidoAtual.fotos?.length || 0) < 2 && (
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleUploadFoto}
                    disabled={uploadingFoto}
                    className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                  />
                </div>
              )}

              {pedidoAtual.fotos && pedidoAtual.fotos.length > 0 && (
                <div className="grid grid-cols-2 gap-2">
                  {pedidoAtual.fotos.map((url, idx) => (
                    <img
                      key={idx}
                      src={url}
                      alt={`Foto ${idx + 1}`}
                      className="w-full h-32 object-cover rounded-md border"
                    />
                  ))}
                </div>
              )}
            </Card>

            {/* Observações */}
            <Card className="p-4 space-y-3">
              <Label htmlFor="obs" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Observações
              </Label>
              <Textarea
                id="obs"
                value={obsEntregador}
                onChange={(e) => setObsEntregador(e.target.value)}
                placeholder="Adicione observações sobre o pedido..."
                rows={3}
              />
              <Button
                size="sm"
                onClick={handleSalvarObs}
                className="w-full"
              >
                Salvar observação
              </Button>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}
