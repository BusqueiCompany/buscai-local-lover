import { useState, useEffect } from "react";
import { 
  MapPin, 
  Sparkles, 
  Shield, 
  Utensils,
  ChefHat,
  ShoppingCart,
  PawPrint,
  Wine,
  Pill,
  Zap,
  MessageCircle,
  Truck,
  ShoppingBag
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { BottomNav } from "@/components/ui/bottom-nav";
import { FloatingActionButton } from "@/components/ui/fab";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { AddressSelector } from "@/components/AddressSelector";
import { NotificationBell } from "@/components/NotificationBell";
import banner1 from "@/assets/banner-1.png";
import banner2 from "@/assets/banner-2.png";
import lanchesIcon from "@/assets/lanches.png";
import restauranteIcon from "@/assets/restaurante.png";
import mercadoIcon from "@/assets/mercado.png";
import petshopIcon from "@/assets/petshop.png";
import bebidasIcon from "@/assets/bebidas.png";
import farmaciaIcon from "@/assets/farmacia.png";
import ofertasIcon from "@/assets/ofertas.png";
import bazarIcon from "@/assets/bazar.png";

const menuItems = [
  { icon: Utensils, label: "Lanches", route: "/lanches", locked: false, color: "text-orange-500" },
  { icon: ChefHat, label: "Restaurantes", route: "/restaurantes", locked: false, color: "text-red-500" },
  { icon: ShoppingCart, label: "Mercados", route: "/mercados", locked: false, color: "text-green-500" },
  { icon: PawPrint, label: "Petshops", route: "/petshops", locked: false, color: "text-purple-500" },
  { icon: Wine, label: "Bebidas", route: "/bebidas", locked: false, color: "text-blue-500" },
  { icon: Pill, label: "Farmácia", route: "/farmacia", locked: false, color: "text-emerald-500" },
  { icon: Zap, label: "Ofertas", route: "/ofertas", locked: true, color: "text-yellow-500" },
  { icon: ShoppingBag, label: "Bazar", route: "/bazar", locked: false, color: "text-purple-500" },
  { icon: MessageCircle, label: "Suporte", route: "/suporte", locked: false, color: "text-sky-500" },
];

export default function Home() {
  const navigate = useNavigate();
  const { user, userRole, isAdmin, loading } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [vipLevel] = useState<"bronze" | "gold" | "diamond">("bronze");
  const [points] = useState(1250);
  const [activeAddress, setActiveAddress] = useState<any>(null);
  const [isAddressSelectorOpen, setIsAddressSelectorOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchActiveAddress();
    }
  }, [user]);

  const fetchProfile = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user?.id)
      .maybeSingle();

    if (data) {
      setProfile(data);
    }
  };

  const fetchActiveAddress = async () => {
    if (!user) return;
    
    try {
      // Tentar buscar de user_addresses primeiro
      const { data: addressData } = await supabase
        .from("user_addresses")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .maybeSingle();

      if (addressData) {
        setActiveAddress(addressData);
        return;
      }

      // Fallback: buscar de profiles caso não exista em user_addresses
      const { data: profileData } = await supabase
        .from("profiles")
        .select("endereco, numero, bairro, referencia")
        .eq("id", user.id)
        .maybeSingle();

      if (profileData && profileData.endereco) {
        setActiveAddress({
          id: "",
          user_id: user.id,
          nome: "Casa",
          endereco: profileData.endereco,
          numero: profileData.numero || "",
          bairro: profileData.bairro || "",
          complemento: "",
          referencia: profileData.referencia || "",
          is_active: true,
          created_at: "",
          updated_at: "",
        });
      }
    } catch (error) {
      console.error("Erro ao buscar endereço:", error);
    }
  };

  const getUserLevelNumber = () => {
    switch (userRole) {
      case "FREE": return 1;
      case "VIP": return 100;
      case "PARCEIRO": return 250;
      case "SUPORTE": return 500;
      case "ADMINISTRADOR": return 1010;
      default: return 1;
    }
  };

  const getUserLevelColor = () => {
    switch (userRole) {
      case "FREE": return "text-muted-foreground";
      case "VIP": return "text-yellow-500";
      case "PARCEIRO": return "text-blue-500";
      case "SUPORTE": return "text-purple-500";
      case "ADMINISTRADOR": return "text-red-700";
      default: return "text-muted-foreground";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-primary">
        <p className="text-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-40">
        <div className="max-w-lg mx-auto px-4 py-3">
          {/* Endereço */}
          <div className="flex items-center justify-center gap-2 mb-3">
            <MapPin className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">
              {activeAddress 
                ? `${activeAddress.endereco}, ${activeAddress.numero} - ${activeAddress.bairro}`
                : 'Endereço não cadastrado'}
            </span>
              <Button 
                variant="link" 
                size="sm" 
                className="text-xs text-primary p-0 h-auto"
                onClick={() => setIsAddressSelectorOpen(true)}
              >
                Trocar
              </Button>
          </div>

          {/* Perfil e Notificações */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12 border-2 border-primary">
                <AvatarImage src="" />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {profile?.nome_completo?.charAt(0) || user?.email?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">
                    {profile?.nome_completo?.split(" ")[0] || user?.email?.split("@")[0] || "Usuário"}
                  </span>
                  {userRole === "VIP" && (
                    <Badge className={`gradient-vip-${vipLevel} text-white text-xs px-2 py-0`}>
                      {vipLevel.toUpperCase()}
                    </Badge>
                  )}
                  {userRole === "SUPORTE" && (
                    <Badge className="bg-blue-600 text-white text-xs px-2 py-0">
                      SUPORTE
                    </Badge>
                  )}
                </div>
                {userRole === "VIP" && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Sparkles className="h-3 w-3 text-accent" />
                    <span>{points} pontos</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isAdmin && (
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => navigate("/admin/dashboard")}
                  className="text-red-700"
                >
                  <Shield className="h-5 w-5" />
                </Button>
              )}
              <NotificationBell />
              <Button
                size="sm"
                className="gradient-vip-gold text-white font-semibold flex items-center gap-1"
                onClick={() => navigate("/vip")}
              >
                VIP 💎
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Grade de Menus 4x2 */}
        <div className="grid grid-cols-4 gap-2">
          {menuItems.map((item, index) => {
            const IconComponent = item.icon;
            return (
              <button
                key={index}
                onClick={() => {
                  if (item.locked) {
                    navigate("/vip");
                  } else {
                    navigate(item.route);
                  }
                }}
                className="flex flex-col items-center gap-1.5 py-3 px-1 rounded-2xl bg-card hover:bg-accent/5 transition-all relative shadow-sm"
              >
                {item.locked && (
                  <div className="absolute top-1 right-1 bg-accent text-white rounded-full p-0.5">
                    <svg className="h-2.5 w-2.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
                {(() => {
                  const iconMap: Record<string, string> = {
                    "Lanches": lanchesIcon,
                    "Restaurantes": restauranteIcon,
                    "Mercados": mercadoIcon,
                    "Petshops": petshopIcon,
                    "Bebidas": bebidasIcon,
                    "Farmácia": farmaciaIcon,
                    "Ofertas": ofertasIcon,
                    "Bazar": bazarIcon,
                  };
                  
                  if (iconMap[item.label]) {
                    return <img src={iconMap[item.label]} alt={item.label} className="w-14 h-14 object-cover rounded-full" />;
                  }
                  
                  return <IconComponent className={`w-8 h-8 ${item.color}`} strokeWidth={1.8} />;
                })()}
                <span className="text-[10px] text-center font-medium leading-tight text-foreground">{item.label}</span>
              </button>
            );
          })}
          {isAdmin && (
            <button
              onClick={() => navigate("/admin")}
              className="flex flex-col items-center gap-1.5 py-3 px-1 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 transition-all shadow-md relative"
            >
              <Shield className="w-8 h-8 text-white" strokeWidth={1.8} />
              <span className="text-[10px] text-center font-bold text-white leading-tight">Admin</span>
            </button>
          )}
          {userRole === "ENTREGADOR" && (
            <button
              onClick={() => navigate("/entregador")}
              className="flex flex-col items-center gap-1.5 py-3 px-1 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 transition-all shadow-md relative"
            >
              <Truck className="w-8 h-8 text-white" strokeWidth={1.8} />
              <span className="text-[10px] text-center font-bold text-white leading-tight">Entregas</span>
            </button>
          )}
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
            📍 Mapa de Lojas
          </Button>
        </div>
      </main>

      {/* Botão Flutuante de Pedido */}
      <FloatingActionButton />

      <BottomNav />

      {/* Address Selector Sheet */}
      <AddressSelector
        isOpen={isAddressSelectorOpen}
        onClose={() => setIsAddressSelectorOpen(false)}
        onAddressChange={fetchActiveAddress}
      />
    </div>
  );
}
