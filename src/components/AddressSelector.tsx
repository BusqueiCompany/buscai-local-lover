import { useState, useEffect } from "react";
import { Plus, MapPin, Trash2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface Address {
  id: string;
  nome: string;
  endereco: string;
  numero: string;
  complemento?: string;
  bairro: string;
  referencia?: string;
  is_active: boolean;
}

interface AddressSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onAddressChange: () => void;
}

export function AddressSelector({ isOpen, onClose, onAddressChange }: AddressSelectorProps) {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome: "",
    endereco: "",
    numero: "",
    complemento: "",
    bairro: "",
    referencia: "",
  });

  useEffect(() => {
    if (isOpen && user) {
      fetchAddresses();
    }
  }, [isOpen, user]);

  const fetchAddresses = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("user_addresses")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Erro ao carregar endereços");
      return;
    }

    setAddresses(data || []);
  };

  const handleSelectAddress = async (addressId: string) => {
    setLoading(true);
    const { error } = await supabase
      .from("user_addresses")
      .update({ is_active: true })
      .eq("id", addressId);

    if (error) {
      toast.error("Erro ao selecionar endereço");
      setLoading(false);
      return;
    }

    toast.success("Endereço alterado com sucesso!");
    onAddressChange();
    fetchAddresses();
    setLoading(false);
    onClose();
  };

  const handleDeleteAddress = async (addressId: string) => {
    const { error } = await supabase
      .from("user_addresses")
      .delete()
      .eq("id", addressId);

    if (error) {
      toast.error("Erro ao excluir endereço");
      return;
    }

    toast.success("Endereço excluído!");
    fetchAddresses();
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);

    // Se for o primeiro endereço, torná-lo ativo automaticamente
    const isFirstAddress = addresses.length === 0;

    const { error } = await supabase.from("user_addresses").insert({
      user_id: user.id,
      nome: formData.nome,
      endereco: formData.endereco,
      numero: formData.numero,
      complemento: formData.complemento || null,
      bairro: formData.bairro,
      referencia: formData.referencia || null,
      is_active: isFirstAddress,
    });

    if (error) {
      toast.error("Erro ao adicionar endereço");
      setLoading(false);
      return;
    }

    toast.success("Endereço adicionado com sucesso!");
    setFormData({
      nome: "",
      endereco: "",
      numero: "",
      complemento: "",
      bairro: "",
      referencia: "",
    });
    setIsAddDialogOpen(false);
    fetchAddresses();
    setLoading(false);
    
    if (isFirstAddress) {
      onAddressChange();
    }
  };

  return (
    <>
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent side="bottom" className="h-[80vh]">
          <SheetHeader>
            <SheetTitle>Meus Endereços</SheetTitle>
          </SheetHeader>

          <div className="mt-6 space-y-3">
            {/* Botão Adicionar Novo */}
            <Button
              variant="outline"
              className="w-full justify-start gap-2 h-auto py-4"
              onClick={() => setIsAddDialogOpen(true)}
            >
              <Plus className="h-5 w-5 text-primary" />
              <span className="font-medium">Adicionar novo endereço</span>
            </Button>

            {/* Lista de Endereços */}
            {addresses.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MapPin className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Nenhum endereço cadastrado</p>
              </div>
            ) : (
              addresses.map((address) => (
                <div
                  key={address.id}
                  className={`border rounded-lg p-4 relative ${
                    address.is_active ? "border-primary bg-primary/5" : "border-border"
                  }`}
                >
                  {address.is_active && (
                    <div className="absolute top-2 right-2">
                      <Check className="h-5 w-5 text-primary" />
                    </div>
                  )}
                  
                  <div className="pr-8">
                    <div className="flex items-start gap-2 mb-2">
                      <MapPin className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="font-semibold text-sm">{address.nome}</p>
                        <p className="text-sm text-foreground">
                          {address.endereco}, {address.numero}
                        </p>
                        {address.complemento && (
                          <p className="text-xs text-muted-foreground">
                            Complemento: {address.complemento}
                          </p>
                        )}
                        <p className="text-sm text-muted-foreground">{address.bairro}</p>
                        {address.referencia && (
                          <p className="text-xs text-muted-foreground">
                            Ref: {address.referencia}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2 mt-3">
                      {!address.is_active && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleSelectAddress(address.id)}
                          disabled={loading}
                        >
                          Selecionar
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDeleteAddress(address.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Dialog para Adicionar Novo Endereço */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Adicionar Novo Endereço</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleAddAddress} className="space-y-4 mt-4">
            <div>
              <Label htmlFor="nome">Nome do Endereço *</Label>
              <Input
                id="nome"
                placeholder="Ex: Casa, Trabalho, Apartamento"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="endereco">Endereço *</Label>
              <Input
                id="endereco"
                placeholder="Rua, Avenida..."
                value={formData.endereco}
                onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="numero">Número *</Label>
                <Input
                  id="numero"
                  placeholder="123"
                  value={formData.numero}
                  onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="complemento">Complemento</Label>
                <Input
                  id="complemento"
                  placeholder="Apto, Bloco..."
                  value={formData.complemento}
                  onChange={(e) => setFormData({ ...formData, complemento: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="bairro">Bairro *</Label>
              <Input
                id="bairro"
                placeholder="Nome do bairro"
                value={formData.bairro}
                onChange={(e) => setFormData({ ...formData, bairro: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="referencia">Ponto de Referência</Label>
              <Input
                id="referencia"
                placeholder="Próximo ao..."
                value={formData.referencia}
                onChange={(e) => setFormData({ ...formData, referencia: e.target.value })}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setIsAddDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
