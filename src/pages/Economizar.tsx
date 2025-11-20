import { BottomNav } from "@/components/ui/bottom-nav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Star, Trophy, Gift, Lock, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Economizar() {
  const navigate = useNavigate();

  const features = [
    {
      icon: Star,
      title: "Como o app funciona",
      description: "BUSQUEI conecta você aos melhores comércios da sua região, mostrando preços em tempo real para você escolher onde comprar mais barato.",
    },
    {
      icon: Trophy,
      title: "Acumule pontos",
      description: "A cada compra realizada através do app, você acumula pontos que podem ser trocados por descontos e benefícios exclusivos.",
    },
    {
      icon: Gift,
      title: "O que é o VIP",
      description: "O sistema VIP possui 3 níveis (Bronze, Ouro e Diamante) que desbloqueiam recursos exclusivos e melhores descontos.",
    },
    {
      icon: TrendingUp,
      title: "Benefícios e vantagens do VIP",
      description: "Usuários VIP têm acesso a menus exclusivos, cashback maior, ofertas antecipadas e atendimento prioritário nos parceiros.",
    },
    {
      icon: Lock,
      title: "Por que alguns menus estão bloqueados",
      description: "Alguns recursos são exclusivos para membros VIP. Isso ajuda a manter a qualidade do serviço e oferece vantagens reais para quem investe no app.",
    },
  ];

  return (
    <div className="min-h-screen pb-20 bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold text-foreground">Quero Economizar %</h1>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Hero Section */}
        <Card className="bg-gradient-primary text-white border-0">
          <CardContent className="p-6 text-center space-y-4">
            <h2 className="text-2xl font-bold">
              Aqui você vai economizar muito!
            </h2>
            <p className="text-white/90">
              Vamos te mostrar como aproveitar ao máximo o BUSQUEI
            </p>
          </CardContent>
        </Card>

        {/* Video Placeholder */}
        <Card>
          <CardContent className="p-6">
            <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
              <div className="text-center space-y-2">
                <svg
                  className="h-16 w-16 mx-auto text-muted-foreground"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-sm text-muted-foreground">Vídeo explicativo em breve</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Features */}
        <div className="space-y-4">
          {features.map((feature, index) => (
            <Card key={index} className="overflow-hidden hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-base">{feature.title}</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* CTA */}
        <Card className="bg-accent text-accent-foreground">
          <CardContent className="p-6 text-center space-y-4">
            <h3 className="text-xl font-bold">Pronto para economizar?</h3>
            <p className="text-sm">
              Comece agora a comparar preços e encontrar as melhores ofertas perto de você!
            </p>
            <Button
              onClick={() => navigate("/")}
              variant="secondary"
              className="w-full font-semibold"
            >
              Voltar para o Início
            </Button>
          </CardContent>
        </Card>
      </main>

      <BottomNav />
    </div>
  );
}
