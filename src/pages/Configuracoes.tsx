import { BottomNav } from "@/components/ui/bottom-nav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Bell, Lock, Globe, HelpCircle, Info, Shield } from "lucide-react";

export default function Configuracoes() {
  return (
    <div className="min-h-screen pb-20 bg-background">
      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        <h1 className="text-2xl font-bold">Configurações</h1>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Bell className="h-5 w-5" />
              Notificações
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="push-notif" className="flex-1">
                Notificações Push
              </Label>
              <Switch id="push-notif" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="email-notif" className="flex-1">
                Notificações por Email
              </Label>
              <Switch id="email-notif" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="promo-notif" className="flex-1">
                Ofertas e Promoções
              </Label>
              <Switch id="promo-notif" defaultChecked />
            </div>
          </CardContent>
        </Card>

        {/* Privacy */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Lock className="h-5 w-5" />
              Privacidade e Segurança
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-start">
              <Shield className="h-5 w-5 mr-3" />
              Alterar Senha
            </Button>
            <div className="flex items-center justify-between">
              <Label htmlFor="location" className="flex-1">
                Compartilhar Localização
              </Label>
              <Switch id="location" defaultChecked />
            </div>
          </CardContent>
        </Card>

        {/* General */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Globe className="h-5 w-5" />
              Geral
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-start">
              <HelpCircle className="h-5 w-5 mr-3" />
              Central de Ajuda
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Info className="h-5 w-5 mr-3" />
              Sobre o BUSQUEI
            </Button>
          </CardContent>
        </Card>

        {/* App Info */}
        <div className="text-center text-sm text-muted-foreground space-y-1">
          <p>BUSQUEI v1.0.0</p>
          <p>© 2025 Todos os direitos reservados</p>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
