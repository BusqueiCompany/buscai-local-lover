import { useState } from "react";
import { Bell, MapPin, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { BottomNav } from "@/components/ui/bottom-nav";
import { useNavigate } from "react-router-dom";
import banner1 from "@/assets/banner-1.png";
import banner2 from "@/assets/banner-2.png";

const menuItems = [
  { icon: "🍔", label: "Lanches", route: "/lanches", locked: false },
  { icon: "🍽️", label: "Restaurantes", route: "/restaurantes", locked: false },
  { icon: "🛒", label: "Mercados", route: "/mercados", locked: false },
  { icon: "🐾", label: "Petshops", route: "/petshops", locked: true },
  { icon: "🍻", label: "Bebidas", route: "/bebidas", locked: true },
  { icon: "💊", label: "Farmácia", route: "/farmacia", locked: true },
  { icon: "💎", label: "Comprar VIP", route: "/vip", locked: false },
  { icon: "🏪", label: "Parceiros", route: "/parceiros", locked: false },
];

export default function Home() {
  const navigate = useNavigate();
  const [vipLevel] = useState<"bronze" | "gold" | "diamond">("bronze");
  const [points] = useState(1250);
  const [userName] = useState("João");

  const getVipBadgeClass = () => {
    switch (vipLevel) {
      case "bronze": return "gradient-vip-bronze";
      case "gold": return "gradient-vip-gold";
      case "diamond": return "gradient-vip-diamond";
      default: return "";
    }
  };

  return (
    <div className="min-h-screen pb-20 bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-40">
        <div className="max-w-lg mx-auto px-4 py-3">
          {/* Endereço */}
          <div className="flex items-center justify-center gap-2 mb-3">
            <MapPin className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Rua Exemplo, 123 - Paciência</span>
            <Button variant="link" size="sm" className="text-xs text-primary p-0 h-auto">
              Trocar
            </Button>
          </div>

          {/* Perfil e Notificações */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12 border-2 border-primary">
                <AvatarImage src="" />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {userName.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{userName}</span>
                  <Badge className={`${getVipBadgeClass()} text-white text-xs px-2 py-0`}>
                    {vipLevel.toUpperCase()}
                  </Badge>
                </div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Sparkles className="h-3 w-3 text-accent" />
                  <span>{points} pontos</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute top-1 right-1 h-2 w-2 bg-secondary rounded-full" />
              </Button>
              <Button
                size="sm"
                className="gradient-vip-gold text-white font-semibold"
                onClick={() => navigate("/vip")}
              >
                Seja Premium
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Grade de Menus 4x2 */}
        <div className="grid grid-cols-4 gap-4">
          {menuItems.map((item, index) => (
            <button
              key={index}
              onClick={() => {
                if (item.locked) {
                  navigate("/vip");
                } else {
                  navigate(item.route);
                }
              }}
              className="flex flex-col items-center gap-2 p-3 rounded-xl bg-card hover:bg-muted transition-colors relative"
            >
              {item.locked && (
                <div className="absolute -top-1 -right-1 bg-accent text-white rounded-full p-1">
                  <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
              <span className="text-4xl">{item.icon}</span>
              <span className="text-xs text-center font-medium">{item.label}</span>
            </button>
          ))}
        </div>

        {/* Banners */}
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
          <img
            src={banner1}
            alt="Banner promocional"
            className="h-32 rounded-xl shadow-md flex-shrink-0 w-72 object-cover"
          />
          <img
            src={banner2}
            alt="Banner promocional"
            className="h-32 rounded-xl shadow-md flex-shrink-0 w-72 object-cover"
          />
        </div>

        {/* Botões Principais */}
        <div className="space-y-3">
          <Button
            onClick={() => navigate("/economizar")}
            className="w-full h-14 text-lg font-bold gradient-primary pulse-glow"
          >
            🎯 Quero Economizar %
          </Button>

          <Button
            onClick={() => navigate("/radar")}
            variant="outline"
            className="w-full h-14 text-lg font-bold border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
          >
            📍 Radar de Preços
          </Button>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
