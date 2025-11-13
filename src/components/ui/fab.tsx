import { ShoppingCart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function FloatingActionButton() {
  const navigate = useNavigate();

  return (
    <Button
      size="icon"
      className="fixed bottom-20 right-4 z-40 h-14 w-14 rounded-full bg-primary shadow-lg hover:bg-primary/90 hover:shadow-xl transition-all"
      onClick={() => navigate("/pedido")}
    >
      <ShoppingCart className="h-6 w-6 text-primary-foreground" />
    </Button>
  );
}
