import { BottomNav } from "@/components/ui/bottom-nav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { User, MapPin, Phone, Mail, Calendar, Award, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Perfil() {
  const navigate = useNavigate();

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
                  J
                </AvatarFallback>
              </Avatar>
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold">João Silva</h2>
                <Badge className="gradient-vip-bronze text-white">BRONZE VIP</Badge>
                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                  <Award className="h-4 w-4 text-accent" />
                  <span className="text-sm">1250 pontos acumulados</span>
                </div>
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
                <p className="font-medium">joao.silva@email.com</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Telefone</p>
                <p className="font-medium">(21) 99999-9999</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Endereço</p>
                <p className="font-medium">Rua Exemplo, 123 - Paciência</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Data de Nascimento</p>
                <p className="font-medium">15/05/1990</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="space-y-3">
          <Button variant="outline" className="w-full justify-start h-12">
            <User className="h-5 w-5 mr-3" />
            Editar Perfil
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start h-12"
            onClick={() => navigate("/vip")}
          >
            <Award className="h-5 w-5 mr-3" />
            Upgrade para VIP
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start h-12 text-destructive hover:text-destructive"
            onClick={() => navigate("/auth")}
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
