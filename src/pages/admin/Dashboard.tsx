import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Store, Package, DollarSign, Users, ArrowLeft } from "lucide-react";
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
      title: "Users",
      description: "Gerenciar níveis e permissões de usuários",
      icon: Users,
      path: "/admin/users",
      color: "bg-[#1976D2] hover:bg-[#1565C0]",
    },
    {
      title: "Seeds",
      description: "Visualizar e editar dados completos dos usuários",
      icon: Users,
      path: "/admin/seeds",
      color: "bg-[#FF7A00] hover:bg-[#E66A00]",
    },
    {
      title: "Markets Importer",
      description: "Importar lojas via arquivo .txt",
      icon: Store,
      path: "/admin/importar-lojas",
      color: "bg-[#1976D2] hover:bg-[#1565C0]",
    },
    {
      title: "Gerenciar Lojas",
      description: "Cadastrar, editar e ativar/desativar lojas",
      icon: Store,
      path: "/admin/lojas",
      color: "bg-[#FF7A00] hover:bg-[#E66A00]",
    },
    {
      title: "Gerenciar Produtos",
      description: "Adicionar e editar produtos do sistema",
      icon: Package,
      path: "/admin/produtos",
      color: "bg-[#1976D2] hover:bg-[#1565C0]",
    },
    {
      title: "Atualizar Preços",
      description: "Gerenciar preços e promoções",
      icon: DollarSign,
      path: "/admin/precos",
      color: "bg-[#FF7A00] hover:bg-[#E66A00]",
    },
    {
      title: "Gerenciar Pedidos",
      description: "Ver pedidos de entregadores e ajustar parâmetros",
      icon: Package,
      path: "/admin/pedidos",
      color: "bg-[#1976D2] hover:bg-[#1565C0]",
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
            <p className="text-muted-foreground">Gerencie todos os aspectos do sistema</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {menuItems.map((item) => (
            <Card
              key={item.path}
              className="cursor-pointer transition-all hover:shadow-lg border-2 hover:border-primary"
              onClick={() => navigate(item.path)}
            >
              <CardHeader>
                <div className={`w-16 h-16 rounded-lg ${item.color} flex items-center justify-center mb-4`}>
                  <item.icon className="h-8 w-8 text-white" />
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
