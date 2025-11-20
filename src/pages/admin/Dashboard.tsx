import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Store, Package, Upload, Code, Settings, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export default function AdminDashboard() {
  const { isAdmin, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !isAdmin) {
      navigate("/");
      toast.error("Acesso negado");
    }
  }, [isAdmin, loading, navigate]);

  const menuItems = [
    {
      title: "Lojas",
      description: "Gerenciar lojas: criar, editar, excluir e publicar",
      icon: Store,
      path: "/admin/lojas",
      color: "bg-primary hover:bg-primary/90",
    },
    {
      title: "Lojas Code",
      description: "Visualizar IDs e Serials de todas as lojas",
      icon: Code,
      path: "/admin/lojas-code",
      color: "bg-secondary hover:bg-secondary/90",
    },
    {
      title: "Produtos",
      description: "Gerenciar produtos das lojas",
      icon: Package,
      path: "/admin/produtos",
      color: "bg-accent hover:bg-accent/90",
    },
    {
      title: "Importações",
      description: "Importar lojas e produtos em lote",
      icon: Upload,
      path: "/admin/importacoes",
      color: "bg-primary hover:bg-primary/90",
    },
    {
      title: "Configurações",
      description: "Configurações gerais do sistema",
      icon: Settings,
      path: "/admin/configuracoes",
      color: "bg-secondary hover:bg-secondary/90",
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
            className="hover:bg-muted"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Painel Administrativo</h1>
            <p className="text-muted-foreground">PWA BUSQUEI - Gerenciamento Completo</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {menuItems.map((item) => (
            <Card
              key={item.path}
              className="cursor-pointer transition-all hover:shadow-lg border-2 hover:border-primary"
              onClick={() => navigate(item.path)}
            >
              <CardHeader>
                <div className={`w-16 h-16 rounded-lg ${item.color} flex items-center justify-center mb-4`}>
                  <item.icon className="h-8 w-8 text-primary-foreground" />
                </div>
                <CardTitle className="text-xl">{item.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{item.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
