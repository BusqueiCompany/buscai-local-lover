import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Store, Package, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export default function Importacoes() {
  const { isAdmin, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !isAdmin) {
      navigate("/");
      toast.error("Acesso negado");
    }
  }, [isAdmin, loading, navigate]);

  const importOptions = [
    {
      title: "Importar Lojas",
      description: "Upload de CSV ou TXT para cadastrar múltiplas lojas",
      icon: Store,
      path: "/admin/importar-lojas",
      color: "bg-primary hover:bg-primary/90",
    },
    {
      title: "Importar Produtos",
      description: "Upload de CSV para cadastrar produtos de uma loja",
      icon: Package,
      path: "/admin/importar-produtos",
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
            onClick={() => navigate("/admin/dashboard")}
            className="hover:bg-muted"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Importações</h1>
            <p className="text-muted-foreground">Importar dados em lote para o sistema</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {importOptions.map((option) => (
            <Card
              key={option.path}
              className="cursor-pointer transition-all hover:shadow-lg border-2 hover:border-primary"
              onClick={() => navigate(option.path)}
            >
              <CardHeader>
                <div className={`w-16 h-16 rounded-lg ${option.color} flex items-center justify-center mb-4`}>
                  <option.icon className="h-8 w-8 text-primary-foreground" />
                </div>
                <CardTitle className="text-xl">{option.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{option.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}