import { useState, useEffect } from "react";
import { BottomNav } from "@/components/ui/bottom-nav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { User, MapPin, Phone, Mail, Calendar, Award, LogOut, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function Perfil() {
  const navigate = useNavigate();
  const { user, userRole, isAdmin, signOut, loading } = useAuth();
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchProfile();
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

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success("Logout realizado com sucesso");
      navigate("/auth", { replace: true });
    } catch (error) {
      toast.error("Erro ao fazer logout");
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Não informado";
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR");
  };

  const getUserLevelColor = () => {
    switch (userRole) {
      case "FREE": return "bg-gray-500";
      case "VIP": return "gradient-vip-gold";
      case "PARCEIRO": return "bg-blue-500";
      case "SUPORTE": return "bg-purple-500";
      case "ADMINISTRADOR": return "bg-red-700";
      default: return "bg-gray-500";
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
      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Profile Header */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center space-y-4">
              <Avatar className="h-24 w-24 border-4 border-primary">
                <AvatarImage src="" />
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                  {profile?.nome_completo?.charAt(0) || user?.email?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold">
                  {profile?.nome_completo || user?.email || "Usuário"}
                </h2>
                <Badge className={`${getUserLevelColor()} text-white`}>
                  {userRole}
                </Badge>
                {userRole === "VIP" && (
                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <Award className="h-4 w-4 text-accent" />
                    <span className="text-sm">1250 pontos acumulados</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* User Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Informações Pessoais
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{user?.email || "Não informado"}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Telefone</p>
                <p className="font-medium">{profile?.telefone || "Não informado"}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Endereço</p>
                <p className="font-medium">
                  {profile?.endereco && profile?.numero
                    ? `${profile.endereco}, ${profile.numero} - ${profile.bairro || "Não informado"}`
                    : "Não informado"}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Data de Nascimento</p>
                <p className="font-medium">{formatDate(profile?.data_nascimento)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="space-y-3">
          <Button 
            variant="outline" 
            className="w-full justify-start h-12"
            onClick={() => navigate("/configuracoes")}
          >
            <User className="h-5 w-5 mr-3" />
            Editar Perfil
          </Button>
          
          {userRole !== "VIP" && userRole !== "ADMINISTRADOR" && (
            <Button
              variant="outline"
              className="w-full justify-start h-12"
              onClick={() => navigate("/vip")}
            >
              <Award className="h-5 w-5 mr-3" />
              Upgrade para VIP
            </Button>
          )}

          {isAdmin && (
            <Button
              variant="outline"
              className="w-full justify-start h-12"
              onClick={() => navigate("/admin")}
            >
              <Shield className="h-5 w-5 mr-3" />
              Painel Administrador
            </Button>
          )}

          <Button
            variant="outline"
            className="w-full justify-start h-12 text-destructive hover:text-destructive"
            onClick={handleSignOut}
          >
            <LogOut className="h-5 w-5 mr-3" />
            Sair da Conta
          </Button>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
