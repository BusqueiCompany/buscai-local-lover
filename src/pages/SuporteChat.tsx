import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Send, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useRole } from "@/hooks/useRole";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export default function SuporteChat() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin } = useRole();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Olá! Sou Mari, a IA de suporte do Busquei 🤖\n\nEstou aqui para ajudar você com praticamente qualquer dúvida ou problema. Posso te auxiliar com:\n• Pedidos e entregas\n• Dúvidas sobre produtos\n• Problemas técnicos\n• Questões sobre sua conta\n• E muito mais!\n\nSe preferir, você também pode solicitar atendimento com um atendente humano a qualquer momento. Como posso te ajudar hoje?",
      timestamp: new Date(),
    },
  ]);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [requestingHuman, setRequestingHuman] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: inputMessage.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      const chatHistory = [...messages, userMessage].map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      const { data, error } = await supabase.functions.invoke("chat-support", {
        body: { messages: chatHistory },
      });

      if (error) {
        throw error;
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.message,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Erro ao enviar mensagem",
        description: error instanceof Error ? error.message : "Tente novamente em instantes.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleRequestHuman = () => {
    setRequestingHuman(true);
    const humanRequestMessage: Message = {
      id: Date.now().toString(),
      role: "assistant",
      content: "Entendido! Estou transferindo você para um atendente humano. Por favor, aguarde um momento enquanto localizo um atendente disponível...",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, humanRequestMessage]);
    
    toast({
      title: "Solicitação enviada",
      description: "Um atendente entrará em contato em breve.",
    });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate("/suporte")}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="relative">
                <Avatar className="h-10 w-10 border-2 border-primary">
                  <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                    M
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-card"></div>
              </div>
              <div>
                <h1 className="text-lg font-bold">Suporte</h1>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    Online
                  </Badge>
                  {isAdmin && <Badge variant="outline" className="text-xs">IA Mari</Badge>}
                </div>
              </div>
            </div>
            
            <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm">
                  Histórico
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Histórico de Conversas</DialogTitle>
                  <DialogDescription>
                    Suas conversas anteriores com o suporte
                  </DialogDescription>
                </DialogHeader>
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-3">
                    <div className="p-3 rounded-lg border border-border hover:bg-muted cursor-pointer transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <p className="font-medium text-sm">Conversa atual</p>
                        <Badge variant="secondary" className="text-xs">Ativa</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      Nenhuma conversa anterior encontrada
                    </div>
                  </div>
                </ScrollArea>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      {/* Chat Messages */}
      <main className="flex-1 overflow-y-auto px-4 py-6 max-w-4xl mx-auto w-full">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                <p
                  className={`text-xs mt-1 ${
                    message.role === "user"
                      ? "text-primary-foreground/70"
                      : "text-muted-foreground"
                  }`}
                >
                  {message.timestamp.toLocaleTimeString("pt-BR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="max-w-[80%] rounded-2xl px-4 py-3 bg-muted">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input Area */}
      <div className="border-t border-border bg-card">
        <div className="max-w-4xl mx-auto px-4 py-4">
          {!requestingHuman && messages.length === 1 && (
            <div className="mb-3 flex justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRequestHuman}
                className="gap-2"
              >
                <User className="h-4 w-4" />
                Falar com atendente humano
              </Button>
            </div>
          )}
          <div className="flex gap-2">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Digite sua mensagem..."
              className="flex-1"
              disabled={isLoading || requestingHuman}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading || requestingHuman}
              size="icon"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
