import { BottomNav } from "@/components/ui/bottom-nav";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

export default function Placeholder() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const getPageTitle = () => {
    const path = location.pathname.slice(1);
    return path.charAt(0).toUpperCase() + path.slice(1);
  };

  return (
    <div className="min-h-screen pb-20 bg-background">
      <header className="bg-gradient-primary text-white sticky top-0 z-50">
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="text-white hover:bg-white/20"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold">{getPageTitle()}</h1>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6">
        <Card>
          <CardContent className="p-12 text-center space-y-4">
            <div className="text-6xl mb-4">🚧</div>
            <h2 className="text-xl font-bold">Em desenvolvimento</h2>
            <p className="text-muted-foreground">
              Esta seção está sendo construída e em breve estará disponível.
            </p>
            <Button onClick={() => navigate("/")} className="mt-6">
              Voltar para o Início
            </Button>
          </CardContent>
        </Card>
      </main>

      <BottomNav />
    </div>
  );
}
