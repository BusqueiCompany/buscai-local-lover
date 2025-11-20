import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, MessageSquare, Ticket, Users, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { BottomNav } from "@/components/ui/bottom-nav";
export default function Suporte() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("chat");
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
                <Button className="w-full" size="lg">
                  <Ticket className="h-5 w-5 mr-2" />
                  Abrir Novo Ticket
                </Button>

                <div className="space-y-3 mt-6">
                  <p className="text-sm font-medium text-muted-foreground">Tickets Recentes</p>
                  
                  <Card className="border-l-4 border-l-yellow-500">
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="bg-yellow-500/10 text-yellow-700 border-yellow-500/20">
                              Em Andamento
                            </Badge>
                            <span className="text-xs text-muted-foreground">#1234</span>
                          </div>
                          <p className="font-medium">Problema com pagamento</p>
                          <p className="text-sm text-muted-foreground">Aberto há 2 dias</p>
                        </div>
                        <Button variant="outline" size="sm">Ver Detalhes</Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-l-4 border-l-green-500">
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-500/20">
                              Resolvido
                            </Badge>
                            <span className="text-xs text-muted-foreground">#1233</span>
                          </div>
                          <p className="font-medium">Dúvida sobre entrega</p>
                          <p className="text-sm text-muted-foreground">Resolvido há 5 dias</p>
                        </div>
                        <Button variant="outline" size="sm">Ver Detalhes</Button>
                      </div>
                    </CardContent>
                  </Card>
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
                  <p className="text-sm text-muted-foreground mb-3">Benefícios

                </p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">Aumento de % nas vendas<div className="h-1.5 w-1.5 rounded-full bg-primary" />
                      Aumento de até 40% nas vendas
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                      Gestão facilitada de pedidos
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                      Marketing gratuito na plataforma
                    </li>
                    <li className="flex items-center gap-2">















Suporte dedicado<div className="h-1.5 w-1.5 rounded-full bg-primary" />
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