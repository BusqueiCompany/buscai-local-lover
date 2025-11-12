import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Check, Crown, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

const vipPlans = [
  {
    id: "bronze",
    name: "Bronze",
    price: "R$ 19,90",
    period: "/mês",
    gradient: "gradient-vip-bronze",
    icon: Crown,
    benefits: [
      "Acesso a todos os menus",
      "Descontos exclusivos",
      "5% de cashback em pontos",
      "Suporte prioritário"
    ]
  },
  {
    id: "silver",
    name: "Prata",
    price: "R$ 34,90",
    period: "/mês",
    gradient: "bg-gradient-to-br from-gray-300 to-gray-500",
    icon: Sparkles,
    popular: true,
    benefits: [
      "Tudo do Bronze +",
      "10% de cashback em pontos",
      "Frete grátis ilimitado",
      "Ofertas especiais antecipadas",
      "Radar de preços premium"
    ]
  },
  {
    id: "gold",
    name: "Ouro",
    price: "R$ 54,90",
    period: "/mês",
    gradient: "gradient-vip-gold",
    icon: Zap,
    benefits: [
      "Tudo do Prata +",
      "15% de cashback em pontos",
      "Prioridade máxima nos pedidos",
      "Cupons mensais exclusivos",
      "Acesso VIP a eventos e lançamentos"
    ]
  },
  {
    id: "diamond",
    name: "Diamante",
    price: "R$ 99,90",
    period: "/mês",
    gradient: "gradient-vip-diamond",
    icon: Crown,
    premium: true,
    benefits: [
      "Tudo do Ouro +",
      "20% de cashback em pontos",
      "Atendimento VIP 24/7",
      "Promoções e descontos exclusivos",
      "Parceiro premium - benefícios especiais",
      "Acesso antecipado a novos recursos"
    ]
  }
];

export default function Vip() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const handleSubscribe = (planId: string, planName: string) => {
    setSelectedPlan(planId);
    
    // Simula assinatura
    setTimeout(() => {
      toast({
        title: "🎉 Parabéns!",
        description: `Você agora é ${planName}! Todos os recursos foram desbloqueados.`,
      });
      
      // Redireciona para home após 2 segundos
      setTimeout(() => {
        navigate("/");
      }, 2000);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">Assine seu Acesso VIP</h1>
              <p className="text-sm text-muted-foreground">
                Desbloqueie todos os recursos e economize muito mais
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Benefícios Gerais */}
        <Card className="mb-8 bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="bg-primary rounded-full p-3">
                <Crown className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h2 className="text-lg font-semibold mb-2">Por que ser VIP?</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Tenha acesso ilimitado a todos os estabelecimentos parceiros, 
                  descontos exclusivos, cashback em pontos e muito mais!
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="gap-1">
                    <Check className="h-3 w-3" /> Sem taxas extras
                  </Badge>
                  <Badge variant="secondary" className="gap-1">
                    <Check className="h-3 w-3" /> Cancele quando quiser
                  </Badge>
                  <Badge variant="secondary" className="gap-1">
                    <Check className="h-3 w-3" /> Suporte prioritário
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Planos VIP */}
        <div className="grid md:grid-cols-2 gap-6">
          {vipPlans.map((plan) => {
            const Icon = plan.icon;
            return (
              <Card
                key={plan.id}
                className={`relative overflow-hidden transition-all hover:shadow-lg ${
                  plan.popular ? "border-primary border-2" : ""
                } ${plan.premium ? "border-accent border-2" : ""}`}
              >
                {plan.popular && (
                  <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-bl-lg">
                    MAIS POPULAR
                  </div>
                )}
                {plan.premium && (
                  <div className="absolute top-0 right-0 bg-accent text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                    PREMIUM
                  </div>
                )}

                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`${plan.gradient} p-2 rounded-lg`}>
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  </div>
                  <CardDescription>
                    <span className="text-3xl font-bold text-foreground">
                      {plan.price}
                    </span>
                    <span className="text-muted-foreground">{plan.period}</span>
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  <ul className="space-y-3">
                    {plan.benefits.map((benefit, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <CardFooter>
                  <Button
                    className={`w-full ${plan.gradient} text-white font-semibold`}
                    size="lg"
                    onClick={() => handleSubscribe(plan.id, plan.name)}
                    disabled={selectedPlan === plan.id}
                  >
                    {selectedPlan === plan.id ? "Processando..." : "Assinar Agora"}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>

        {/* FAQ Rápido */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-lg">Dúvidas Frequentes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-1">Posso cancelar a qualquer momento?</h3>
              <p className="text-sm text-muted-foreground">
                Sim! Você pode cancelar sua assinatura quando quiser, sem multas ou taxas.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-1">Como funcionam os pontos?</h3>
              <p className="text-sm text-muted-foreground">
                A cada compra, você acumula pontos que podem ser trocados por descontos em pedidos futuros.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-1">Posso mudar de plano depois?</h3>
              <p className="text-sm text-muted-foreground">
                Sim! Você pode fazer upgrade ou downgrade do seu plano a qualquer momento.
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
