import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Mercado() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
            className="text-foreground hover:bg-foreground/10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Mercado</h1>
            <p className="text-muted-foreground">Encontre os melhores preços em mercados</p>
          </div>
        </div>

        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground text-center">
            Em breve você poderá buscar produtos de mercados aqui! 🛒
          </p>
        </div>
      </div>
    </div>
  );
}
