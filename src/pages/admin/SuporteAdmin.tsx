import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MessageSquare, Ticket, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { logAdminAction } from "@/utils/auditLog";

interface SupportTicket {
  id: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  created_at: string;
  resolved_at: string | null;
  user_id: string;
}

interface TicketMessage {
  id: string;
  message: string;
  is_admin: boolean;
  created_at: string;
  user_id: string;
}

interface PartnershipRequest {
  id: string;
  nome: string;
  telefone: string;
  nome_comercio: string;
  endereco: string;
  status: string;
  created_at: string;
  user_id: string;
}

interface DeliveryRequest {
  id: string;
  nome: string;
  telefone: string;
  email: string;
  cpf: string;
  tem_cnh: boolean;
  tipo_veiculo: string;
  status: string;
  created_at: string;
  user_id: string;
}

export default function SuporteAdmin() {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [partnerships, setPartnerships] = useState<PartnershipRequest[]>([]);
  const [deliveries, setDeliveries] = useState<DeliveryRequest[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [ticketMessages, setTicketMessages] = useState<TicketMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }

    if (!isAdmin) {
      navigate("/");
      toast.error("Acesso negado");
      return;
    }

    fetchData();
    subscribeToChanges();
  }, [user, isAdmin, navigate]);

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([
      fetchTickets(),
      fetchPartnerships(),
      fetchDeliveries(),
    ]);
    setLoading(false);
  };

  const fetchTickets = async () => {
    const { data, error } = await supabase
      .from("support_tickets")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erro ao buscar tickets:", error);
      return;
    }

    setTickets(data || []);
  };

  const fetchPartnerships = async () => {
    const { data, error } = await supabase
      .from("partnership_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erro ao buscar parcerias:", error);
      return;
    }

    setPartnerships(data || []);
  };

  const fetchDeliveries = async () => {
    const { data, error } = await supabase
      .from("delivery_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erro ao buscar entregadores:", error);
      return;
    }

    setDeliveries(data || []);
  };

  const subscribeToChanges = () => {
    const ticketsChannel = supabase
      .channel("admin-tickets")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "support_tickets" },
        () => fetchTickets()
      )
      .subscribe();

    const partnershipsChannel = supabase
      .channel("admin-partnerships")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "partnership_requests" },
        () => fetchPartnerships()
      )
      .subscribe();

    const deliveriesChannel = supabase
      .channel("admin-deliveries")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "delivery_requests" },
        () => fetchDeliveries()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ticketsChannel);
      supabase.removeChannel(partnershipsChannel);
      supabase.removeChannel(deliveriesChannel);
    };
  };

  const openTicket = async (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    fetchTicketMessages(ticket.id);
  };

  const fetchTicketMessages = async (ticketId: string) => {
    const { data, error } = await supabase
      .from("ticket_messages")
      .select("*")
      .eq("ticket_id", ticketId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Erro ao buscar mensagens:", error);
      return;
    }

    setTicketMessages(data || []);
  };

  const handleSendMessage = async () => {
    if (!user || !selectedTicket || !newMessage.trim()) return;

    setSendingMessage(true);
    try {
      // Inserir mensagem
      const { error: msgError } = await supabase
        .from("ticket_messages")
        .insert({
          ticket_id: selectedTicket.id,
          user_id: user.id,
          message: newMessage,
          is_admin: true,
        });

      if (msgError) throw msgError;

      // Criar notificação para o usuário
      const { error: notifError } = await supabase
        .from("notifications")
        .insert({
          user_id: selectedTicket.user_id,
          type: "ticket_response",
          title: "Nova resposta no seu ticket",
          message: `O suporte respondeu: "${newMessage.substring(0, 50)}..."`,
          reference_id: selectedTicket.id,
          reference_type: "ticket",
        });

      if (notifError) throw notifError;

      // Log de auditoria
      await logAdminAction(
        user.id,
        "ticket_response",
        "support_tickets",
        selectedTicket.id,
        null,
        { message: newMessage }
      );

      setNewMessage("");
      toast.success("Mensagem enviada!");
      fetchTicketMessages(selectedTicket.id);
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
      toast.error("Erro ao enviar mensagem");
    } finally {
      setSendingMessage(false);
    }
  };

  const updateTicketStatus = async (ticketId: string, newStatus: string) => {
    try {
      const ticket = tickets.find((t) => t.id === ticketId);
      
      const { error } = await supabase
        .from("support_tickets")
        .update({ 
          status: newStatus,
          resolved_at: newStatus === "resolvido" ? new Date().toISOString() : null
        })
        .eq("id", ticketId);

      if (error) throw error;

      // Log de auditoria
      await logAdminAction(
        user!.id,
        "ticket_status_update",
        "support_tickets",
        ticketId,
        { status: ticket?.status },
        { status: newStatus }
      );

      // Criar notificação
      if (ticket) {
        await supabase.from("notifications").insert({
          user_id: ticket.user_id,
          type: "ticket_response",
          title: "Status do ticket atualizado",
          message: `Seu ticket foi atualizado para: ${getStatusLabel(newStatus)}`,
          reference_id: ticketId,
          reference_type: "ticket",
        });
      }

      toast.success("Status atualizado!");
      fetchTickets();
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      toast.error("Erro ao atualizar status");
    }
  };

  const updateRequestStatus = async (
    type: "partnership" | "delivery",
    requestId: string,
    newStatus: string
  ) => {
    try {
      const table = type === "partnership" ? "partnership_requests" : "delivery_requests";
      const request = type === "partnership" 
        ? partnerships.find((p) => p.id === requestId)
        : deliveries.find((d) => d.id === requestId);

      const { error } = await supabase
        .from(table)
        .update({ status: newStatus })
        .eq("id", requestId);

      if (error) throw error;

      // Log de auditoria
      await logAdminAction(
        user!.id,
        `${type}_status_update`,
        table,
        requestId,
        { status: request?.status },
        { status: newStatus }
      );

      // Criar notificação
      if (request) {
        await supabase.from("notifications").insert({
          user_id: request.user_id,
          type: `${type}_response`,
          title: `Solicitação ${newStatus}`,
          message: `Sua solicitação de ${type === "partnership" ? "parceria" : "entregador"} foi ${newStatus}`,
          reference_id: requestId,
          reference_type: type,
        });
      }

      toast.success("Status atualizado!");
      type === "partnership" ? fetchPartnerships() : fetchDeliveries();
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      toast.error("Erro ao atualizar status");
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      aberto: "Aberto",
      em_andamento: "Em Andamento",
      resolvido: "Resolvido",
      pendente: "Pendente",
      aprovado: "Aprovado",
      rejeitado: "Rejeitado",
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      aberto: "bg-yellow-500/10 text-yellow-700 border-yellow-500/20",
      em_andamento: "bg-blue-500/10 text-blue-700 border-blue-500/20",
      resolvido: "bg-green-500/10 text-green-700 border-green-500/20",
      pendente: "bg-orange-500/10 text-orange-700 border-orange-500/20",
      aprovado: "bg-green-500/10 text-green-700 border-green-500/20",
      rejeitado: "bg-red-500/10 text-red-700 border-red-500/20",
    };
    return colors[status] || "";
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full">
          <p>Carregando...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Suporte & Solicitações</h1>
          <p className="text-muted-foreground">Gerencie tickets e solicitações de parceria/entregadores</p>
        </div>

        <Tabs defaultValue="tickets" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="tickets">
              <Ticket className="h-4 w-4 mr-2" />
              Tickets ({tickets.length})
            </TabsTrigger>
            <TabsTrigger value="partnerships">
              Parcerias ({partnerships.length})
            </TabsTrigger>
            <TabsTrigger value="deliveries">
              Entregadores ({deliveries.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tickets" className="space-y-4">
            {tickets.length === 0 ? (
              <Card>
                <CardContent className="py-8">
                  <p className="text-center text-muted-foreground">Nenhum ticket encontrado</p>
                </CardContent>
              </Card>
            ) : (
              tickets.map((ticket) => (
                <Card key={ticket.id} className="cursor-pointer hover:bg-muted/50" onClick={() => openTicket(ticket)}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={getStatusColor(ticket.status)}>
                            {getStatusLabel(ticket.status)}
                          </Badge>
                          <Badge variant="outline">{ticket.priority}</Badge>
                        </div>
                        <CardTitle className="text-lg">{ticket.subject}</CardTitle>
                        <CardDescription>#{ticket.id.slice(0, 8)} • {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true, locale: ptBR })}</CardDescription>
                      </div>
                      <div className="w-40" onClick={(e) => e.stopPropagation()}>
                        <Select
                          value={ticket.status}
                          onValueChange={(value) => {
                            updateTicketStatus(ticket.id, value);
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="aberto">Aberto</SelectItem>
                            <SelectItem value="em_andamento">Em Andamento</SelectItem>
                            <SelectItem value="resolvido">Resolvido</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="partnerships" className="space-y-4">
            {partnerships.length === 0 ? (
              <Card>
                <CardContent className="py-8">
                  <p className="text-center text-muted-foreground">Nenhuma solicitação de parceria</p>
                </CardContent>
              </Card>
            ) : (
              partnerships.map((request) => (
                <Card key={request.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <Badge variant="outline" className={getStatusColor(request.status)}>
                          {getStatusLabel(request.status)}
                        </Badge>
                        <CardTitle className="text-lg">{request.nome_comercio}</CardTitle>
                        <CardDescription>
                          {request.nome} • {request.telefone}
                          <br />
                          {request.endereco}
                          <br />
                          {formatDistanceToNow(new Date(request.created_at), { addSuffix: true, locale: ptBR })}
                        </CardDescription>
                      </div>
                      <Select
                        value={request.status}
                        onValueChange={(value) => updateRequestStatus("partnership", request.id, value)}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pendente">Pendente</SelectItem>
                          <SelectItem value="aprovado">Aprovado</SelectItem>
                          <SelectItem value="rejeitado">Rejeitado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardHeader>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="deliveries" className="space-y-4">
            {deliveries.length === 0 ? (
              <Card>
                <CardContent className="py-8">
                  <p className="text-center text-muted-foreground">Nenhuma solicitação de entregador</p>
                </CardContent>
              </Card>
            ) : (
              deliveries.map((request) => (
                <Card key={request.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <Badge variant="outline" className={getStatusColor(request.status)}>
                          {getStatusLabel(request.status)}
                        </Badge>
                        <CardTitle className="text-lg">{request.nome}</CardTitle>
                        <CardDescription>
                          {request.email} • {request.telefone}
                          <br />
                          CPF: {request.cpf} • CNH: {request.tem_cnh ? "Sim" : "Não"}
                          <br />
                          Veículo: {request.tipo_veiculo.toUpperCase()}
                          <br />
                          {formatDistanceToNow(new Date(request.created_at), { addSuffix: true, locale: ptBR })}
                        </CardDescription>
                      </div>
                      <Select
                        value={request.status}
                        onValueChange={(value) => updateRequestStatus("delivery", request.id, value)}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pendente">Pendente</SelectItem>
                          <SelectItem value="aprovado">Aprovado</SelectItem>
                          <SelectItem value="rejeitado">Rejeitado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardHeader>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>

        {/* Dialog de Conversa do Ticket */}
        <Dialog open={!!selectedTicket} onOpenChange={(open) => !open && setSelectedTicket(null)}>
          <DialogContent className="sm:max-w-[700px]">
            <DialogHeader>
              <DialogTitle>{selectedTicket?.subject}</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium mb-1">Descrição:</p>
                <p className="text-sm whitespace-pre-wrap">{selectedTicket?.description}</p>
              </div>

              <ScrollArea className="h-[300px] pr-4">
                <div className="space-y-3">
                  {ticketMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`p-3 rounded-lg ${
                        msg.is_admin ? "bg-primary/10 ml-8" : "bg-muted mr-8"
                      }`}
                    >
                      <p className="text-sm font-medium mb-1">
                        {msg.is_admin ? "Suporte (Você)" : "Cliente"}
                      </p>
                      <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {formatDistanceToNow(new Date(msg.created_at), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </p>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              <div className="space-y-2">
                <Label>Sua resposta</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Digite sua resposta..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={sendingMessage || !newMessage.trim()}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
