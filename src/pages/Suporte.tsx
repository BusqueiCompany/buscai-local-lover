import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, MessageSquare, Ticket, Users, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { BottomNav } from "@/components/ui/bottom-nav";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
interface SupportTicket {
  id: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  created_at: string;
  resolved_at: string | null;
}

export default function Suporte() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("chat");
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    subject: "",
    description: "",
    priority: "normal"
  });

  useEffect(() => {
    if (user) {
      fetchTickets();
    }
  }, [user]);

  const fetchTickets = async () => {
    try {
      const { data, error } = await supabase
        .from("support_tickets")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTickets(data || []);
    } catch (error) {
      console.error("Erro ao buscar tickets:", error);
      toast.error("Erro ao carregar tickets");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error("Você precisa estar logado");
      return;
    }

    if (!formData.subject.trim() || !formData.description.trim()) {
      toast.error("Preencha todos os campos");
      return;
    }

    try {
      const { error } = await supabase
        .from("support_tickets")
        .insert({
          user_id: user.id,
          subject: formData.subject,
          description: formData.description,
          priority: formData.priority
        });

      if (error) throw error;

      toast.success("Ticket criado com sucesso! Responderemos em até 48h.");
      setFormData({ subject: "", description: "", priority: "normal" });
      setIsDialogOpen(false);
      fetchTickets();
    } catch (error) {
      console.error("Erro ao criar ticket:", error);
      toast.error("Erro ao criar ticket");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "aberto":
        return "border-l-yellow-500";
      case "em_andamento":
        return "border-l-blue-500";
      case "resolvido":
        return "border-l-green-500";
      default:
        return "border-l-gray-500";
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

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "aberto":
        return "bg-yellow-500/10 text-yellow-700 border-yellow-500/20";
      case "em_andamento":
        return "bg-blue-500/10 text-blue-700 border-blue-500/20";
      case "resolvido":
        return "bg-green-500/10 text-green-700 border-green-500/20";
      default:
        return "bg-gray-500/10 text-gray-700 border-gray-500/20";
    }
  };
  return <div className="min-h-screen pb-20 bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">Central de Suporte</h1>
              <p className="text-xs text-muted-foreground">Estamos aqui para ajudar</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="chat">
              <MessageSquare className="h-4 w-4 mr-2" />
              Chat
            </TabsTrigger>
            <TabsTrigger value="tickets">
              <Ticket className="h-4 w-4 mr-2" />
              Tickets
            </TabsTrigger>
            <TabsTrigger value="parceiro">
              <Users className="h-4 w-4 mr-2" />
              Parceiro
            </TabsTrigger>
            <TabsTrigger value="entregador">
              <Truck className="h-4 w-4 mr-2" />
              Entregador
            </TabsTrigger>
          </TabsList>

          {/* Chat Tab */}
          <TabsContent value="chat" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Chat com Suporte</CardTitle>
                <CardDescription>
                  Converse com nossa equipe em tempo real
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" size="lg" onClick={() => navigate("/suporte/chat")}>
                  <MessageSquare className="h-5 w-5 mr-2" />
                  Iniciar Conversa
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Perguntas Frequentes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start h-auto p-4">
                  <div className="text-left">
                    <p className="font-medium">Como funciona a entrega?</p>
                    <p className="text-sm text-muted-foreground">Saiba mais sobre nosso processo</p>
                  </div>
                </Button>
                <Button variant="outline" className="w-full justify-start h-auto p-4">
                  <div className="text-left">
                    <p className="font-medium">Como ser VIP?</p>
                    <p className="text-sm text-muted-foreground">Conheça os benefícios</p>
                  </div>
                </Button>
                <Button variant="outline" className="w-full justify-start h-auto p-4">
                  <div className="text-left">
                    <p className="font-medium">Política de devolução</p>
                    <p className="text-sm text-muted-foreground">Entenda seus direitos</p>
                  </div>
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tickets Tab */}
          <TabsContent value="tickets" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Meus Tickets</CardTitle>
                <CardDescription>
                  Acompanhe suas solicitações de suporte
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full" size="lg">
                      <Ticket className="h-5 w-5 mr-2" />
                      Abrir Novo Ticket
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                      <DialogTitle>Abrir Chamado Urgente</DialogTitle>
                      <DialogDescription>
                        Nossa equipe responderá em até 48 horas
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="subject">Assunto</Label>
                        <Input
                          id="subject"
                          placeholder="Descreva o problema brevemente"
                          value={formData.subject}
                          onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="description">Descrição</Label>
                        <Textarea
                          id="description"
                          placeholder="Descreva o problema em detalhes"
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          rows={5}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="priority">Prioridade</Label>
                        <Select
                          value={formData.priority}
                          onValueChange={(value) => setFormData({ ...formData, priority: value })}
                        >
                          <SelectTrigger id="priority">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="baixa">Baixa</SelectItem>
                            <SelectItem value="normal">Normal</SelectItem>
                            <SelectItem value="alta">Alta</SelectItem>
                            <SelectItem value="urgente">Urgente</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <Button type="submit" className="w-full">
                        Criar Ticket
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>

                <div className="space-y-3 mt-6">
                  <p className="text-sm font-medium text-muted-foreground">Tickets Recentes</p>
                  
                  {loading ? (
                    <p className="text-center text-muted-foreground py-8">Carregando...</p>
                  ) : tickets.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      Nenhum ticket criado ainda
                    </p>
                  ) : (
                    tickets.map((ticket) => (
                      <Card key={ticket.id} className={`border-l-4 ${getStatusColor(ticket.status)}`}>
                        <CardContent className="pt-4">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className={getStatusBadgeColor(ticket.status)}>
                                  {getStatusLabel(ticket.status)}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  #{ticket.id.slice(0, 8)}
                                </span>
                              </div>
                              <p className="font-medium">{ticket.subject}</p>
                              <p className="text-sm text-muted-foreground">
                                {ticket.resolved_at 
                                  ? `Resolvido ${formatDistanceToNow(new Date(ticket.resolved_at), { 
                                      addSuffix: true, 
                                      locale: ptBR 
                                    })}`
                                  : `Aberto ${formatDistanceToNow(new Date(ticket.created_at), { 
                                      addSuffix: true, 
                                      locale: ptBR 
                                    })}`
                                }
                              </p>
                            </div>
                            <Button variant="outline" size="sm">Ver Detalhes</Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Parceiro Tab */}
          <TabsContent value="parceiro" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Seja um Parceiro</CardTitle>
                <CardDescription>
                  Cadastre sua loja no Busquei e aumente suas vendas
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-primary">1</span>
                    </div>
                    <div>
                      <p className="font-medium">Cadastro Simples</p>
                      <p className="text-sm text-muted-foreground">Preencha o formulário em poucos minutos</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-primary">2</span>
                    </div>
                    <div>
                      <p className="font-medium">Análise Rápida</p>
                      <p className="text-sm text-muted-foreground">Nossa equipe avalia em até 48h</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-primary">3</span>
                    </div>
                    <div>
                      <p className="font-medium">Comece a Vender</p>
                      <p className="text-sm text-muted-foreground">Sua loja ativa em nossa plataforma</p>
                    </div>
                  </div>
                </div>

                <Button className="w-full" size="lg">
                  <Users className="h-5 w-5 mr-2" />
                  Solicitar Parceria
                </Button>

                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground mb-3">Benefícios</p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                      Aumento nas suas vendas
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                      Disponibilidade de entregador
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                      Dashboard para gestão e analytics do seu negócio
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                      Marketing gratuito na plataforma
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                      Suporte dedicado
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Entregador Tab */}
          <TabsContent value="entregador" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Seja um Entregador</CardTitle>
                <CardDescription>
                  Trabalhe conosco e tenha renda extra com flexibilidade
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-primary">1</span>
                    </div>
                    <div>
                      <p className="font-medium">Envie seus Dados</p>
                      <p className="text-sm text-muted-foreground">CPF, CNH e documentos do veículo</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-primary">2</span>
                    </div>
                    <div>
                      <p className="font-medium">Verificação</p>
                      <p className="text-sm text-muted-foreground">Análise de documentos em 24-48h</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-primary">3</span>
                    </div>
                    <div>
                      <p className="font-medium">Comece a Trabalhar</p>
                      <p className="text-sm text-muted-foreground">Aceite corridas e ganhe dinheiro</p>
                    </div>
                  </div>
                </div>

                <Button className="w-full" size="lg">
                  <Truck className="h-5 w-5 mr-2" />
                  Solicitar Cadastro
                </Button>

                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground mb-3">Vantagens</p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                      Trabalhe quando quiser
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                      Receba pagamentos semanais
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                      Sem taxas de cadastro
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                      Sistema de bônus por desempenho
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <BottomNav />
    </div>;
}