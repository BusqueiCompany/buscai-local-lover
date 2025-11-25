import { useState, useEffect } from "react";
import { ArrowLeft, Plus, Search, Trash2, ShoppingCart, Crown, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BottomNav } from "@/components/ui/bottom-nav";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Alert,
  AlertDescription,
} from "@/components/ui/alert";

interface ShoppingItem {
  id: string;
  product_name: string;
  quantity: number;
  unit_type: "unidade" | "kg";
  is_active: boolean;
}

const VIP_LIMITS = {
  FREE: 0, // Usuários FREE não podem usar
  BRONZE: 5,
  OURO: 12,
  DIAMANTE: Infinity,
};

const VIP_PLAN_NAMES: Record<string, string> = {
  FREE: "Free",
  VIP: "Bronze",
  BRONZE: "Bronze",
  OURO: "Ouro",
  GOLD: "Ouro",
  DIAMANTE: "Diamante",
  DIAMOND: "Diamante",
};

export default function Economizar() {
  const navigate = useNavigate();
  const { user, userRole } = useAuth();
  const [shoppingList, setShoppingList] = useState<ShoppingItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [newProduct, setNewProduct] = useState("");
  const [newQuantity, setNewQuantity] = useState("1");
  const [newUnitType, setNewUnitType] = useState<"unidade" | "kg">("unidade");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadShoppingList();
    }
  }, [user]);

  const loadShoppingList = async () => {
    try {
      const { data, error } = await supabase
        .from("user_shopping_lists")
        .select("*")
        .eq("user_id", user?.id)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setShoppingList((data || []).map(item => ({
        ...item,
        unit_type: item.unit_type as "unidade" | "kg"
      })));
    } catch (error) {
      console.error("Erro ao carregar lista:", error);
      toast.error("Erro ao carregar sua lista de compras");
    } finally {
      setLoading(false);
    }
  };

  const getVipLimit = () => {
    const role = userRole?.toUpperCase() || "FREE";
    if (role === "VIP") return VIP_LIMITS.BRONZE; // VIP genérico = Bronze
    return VIP_LIMITS[role as keyof typeof VIP_LIMITS] || VIP_LIMITS.FREE;
  };

  const getVipPlanName = () => {
    const role = userRole?.toUpperCase() || "FREE";
    return VIP_PLAN_NAMES[role] || "Free";
  };

  const canAddMoreItems = () => {
    const limit = getVipLimit();
    if (limit === 0) return false; // FREE não pode usar
    return shoppingList.length < limit;
  };

  const addProduct = async () => {
    if (!newProduct.trim()) {
      toast.error("Digite o nome do produto");
      return;
    }

    const quantity = parseFloat(newQuantity);
    if (isNaN(quantity) || quantity <= 0) {
      toast.error("Digite uma quantidade válida");
      return;
    }

    // Verificar se é usuário FREE
    if (userRole === "FREE") {
      toast.error("Esta funcionalidade é exclusiva para membros VIP", {
        description: "Faça upgrade para Bronze, Ouro ou Diamante",
        action: {
          label: "Ver Planos VIP",
          onClick: () => navigate("/vip"),
        },
      });
      return;
    }

    // Verificar limite
    if (!canAddMoreItems()) {
      const planName = getVipPlanName();
      const limit = getVipLimit();
      toast.error(`Limite de ${limit} itens atingido no plano ${planName}`, {
        description: "Faça upgrade para adicionar mais itens",
        action: {
          label: "Fazer Upgrade",
          onClick: () => navigate("/vip"),
        },
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from("user_shopping_lists")
        .insert({
          user_id: user?.id,
          product_name: newProduct.trim(),
          quantity: quantity,
          unit_type: newUnitType,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;

      setShoppingList([{
        ...data,
        unit_type: data.unit_type as "unidade" | "kg"
      }, ...shoppingList]);
      setNewProduct("");
      setNewQuantity("1");
      setNewUnitType("unidade");
      toast.success("Produto adicionado à lista");
    } catch (error) {
      console.error("Erro ao adicionar produto:", error);
      toast.error("Erro ao adicionar produto");
    }
  };

  const removeProduct = async (id: string) => {
    try {
      const { error } = await supabase
        .from("user_shopping_lists")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setShoppingList(shoppingList.filter((item) => item.id !== id));
      toast.success("Produto removido da lista");
    } catch (error) {
      console.error("Erro ao remover produto:", error);
      toast.error("Erro ao remover produto");
    }
  };

  const filteredList = shoppingList.filter((item) =>
    item.product_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const limit = getVipLimit();
  const planName = getVipPlanName();
  const itemsRemaining = limit === Infinity ? "Ilimitado" : `${Math.max(0, limit - shoppingList.length)}`;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 bg-background">
      {/* Header */}
      <header className="bg-gradient-primary sticky top-0 z-50 shadow-lg">
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/")}
              className="text-primary-foreground hover:bg-primary-foreground/10"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-primary-foreground flex items-center gap-2">
                <ShoppingCart className="h-6 w-6" />
                Lista de Compras VIP
              </h1>
            </div>
            <Badge className="bg-accent text-white flex items-center gap-1">
              <Crown className="h-3 w-3" />
              {planName}
            </Badge>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Aviso para usuários FREE */}
        {userRole === "FREE" && (
          <Alert className="border-accent bg-accent/10">
            <AlertCircle className="h-4 w-4 text-accent" />
            <AlertDescription className="text-foreground">
              Esta funcionalidade é exclusiva para membros VIP.{" "}
              <Button
                variant="link"
                className="p-0 h-auto text-accent font-semibold"
                onClick={() => navigate("/vip")}
              >
                Faça upgrade agora
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Info do Plano */}
        {userRole !== "FREE" && (
          <Card className="p-4 bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Seu Plano</p>
                <p className="text-lg font-bold text-foreground">{planName}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Itens Restantes</p>
                <p className="text-2xl font-bold text-accent">{itemsRemaining}</p>
              </div>
            </div>
            {limit !== Infinity && (
              <div className="mt-2">
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent transition-all"
                    style={{ width: `${(shoppingList.length / limit) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </Card>
        )}

        {/* Adicionar Produto */}
        <Card className="p-4 space-y-3">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" />
            Adicionar Produto
          </h2>
          <div className="space-y-2">
            <Input
              placeholder="Nome do produto"
              value={newProduct}
              onChange={(e) => setNewProduct(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addProduct()}
              disabled={userRole === "FREE"}
            />
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Quantidade"
                value={newQuantity}
                onChange={(e) => setNewQuantity(e.target.value)}
                className="w-24"
                disabled={userRole === "FREE"}
                step="0.1"
                min="0.1"
              />
              <Select
                value={newUnitType}
                onValueChange={(value: "unidade" | "kg") => setNewUnitType(value)}
                disabled={userRole === "FREE"}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unidade">Unidade</SelectItem>
                  <SelectItem value="kg">Kg</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={addProduct}
                className="flex-1"
                disabled={userRole === "FREE" || !canAddMoreItems()}
              >
                <Plus className="h-4 w-4 mr-1" />
                Adicionar
              </Button>
            </div>
          </div>
        </Card>

        {/* Busca */}
        {shoppingList.length > 0 && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar na lista..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        )}

        {/* Lista de Produtos */}
        <div className="space-y-3">
          <h2 className="font-semibold text-foreground">
            Minha Lista ({shoppingList.length} {shoppingList.length === 1 ? "item" : "itens"})
          </h2>

          {filteredList.length === 0 ? (
            <Card className="p-8 text-center">
              <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">
                {searchTerm ? "Nenhum produto encontrado" : "Sua lista está vazia"}
              </p>
              {!searchTerm && userRole === "FREE" && (
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => navigate("/vip")}
                >
                  <Crown className="h-4 w-4 mr-2" />
                  Tornar-se VIP
                </Button>
              )}
            </Card>
          ) : (
            <div className="space-y-2">
              {filteredList.map((item) => (
                <Card key={item.id} className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{item.product_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.quantity} {item.unit_type === "kg" ? "kg" : item.quantity > 1 ? "unidades" : "unidade"}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeProduct(item.id)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* CTA Upgrade */}
        {userRole !== "FREE" && userRole === "VIP" && (
          <Card className="p-4 bg-gradient-to-r from-accent/10 to-primary/10 border-accent/30">
            <div className="text-center space-y-2">
              <Crown className="h-8 w-8 text-accent mx-auto" />
              <h3 className="font-semibold text-foreground">
                Quer adicionar mais itens?
              </h3>
              <p className="text-sm text-muted-foreground">
                Faça upgrade para Ouro ou Diamante e tenha mais espaço!
              </p>
              <Button
                onClick={() => navigate("/vip")}
                className="gradient-primary w-full"
              >
                Ver Planos VIP
              </Button>
            </div>
          </Card>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
