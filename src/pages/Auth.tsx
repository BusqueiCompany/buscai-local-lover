import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import logo from "@/assets/busquei-logo.png";

const bairros = [
  "1º Abril", "3 Pontes", "7 de Abril", "Amendoeiras", "Amoreiras", "Baixada",
  "Césarinho", "Cond. Paçuare 1", "Cond. Paçuare 2", "Conj 735", "Cosmos",
  "Estrada dos Vieiras", "Gouveia", "Inhoaíba", "Nova Jersey", "Paçuare 1",
  "Paçuare 2", "Paciência", "Parque Sueli", "Urucânia", "Varanda", "Outros"
];

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [outrosBairro, setOutrosBairro] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulação de login/cadastro
    toast.success(isLogin ? "Login realizado com sucesso!" : "Cadastro realizado com sucesso!");
    navigate("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-primary p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <img src={logo} alt="BUSQUEI" className="h-20 w-20" />
          </div>
          <div>
            <CardTitle className="text-3xl font-bold text-primary">BUSQUEI</CardTitle>
            <CardDescription className="text-base mt-2">
              {isLogin ? "Bem-vindo de volta!" : "Crie sua conta"}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome Completo</Label>
                  <Input id="nome" type="text" placeholder="Seu nome completo" required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nascimento">Data de Nascimento</Label>
                  <Input id="nascimento" type="date" required />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="endereco">Endereço</Label>
                    <Input id="endereco" type="text" placeholder="Rua/Av" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="numero">Número</Label>
                    <Input id="numero" type="text" placeholder="Nº" required />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input id="telefone" type="tel" placeholder="(21) 99999-9999" required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sexo">Sexo</Label>
                  <Select required>
                    <SelectTrigger id="sexo">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="masculino">Masculino</SelectItem>
                      <SelectItem value="feminino">Feminino</SelectItem>
                      <SelectItem value="outro">Outro</SelectItem>
                      <SelectItem value="prefiro-nao-informar">Prefiro não informar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="seu@email.com" required />
            </div>

            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="cpf">CPF (opcional)</Label>
                <Input id="cpf" type="text" placeholder="000.000.000-00" />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="senha">Senha</Label>
              <Input id="senha" type="password" placeholder="••••••••" required />
            </div>

            {!isLogin && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="referencia">Ponto de Referência</Label>
                  <Input id="referencia" type="text" placeholder="Ex: Próximo ao mercado X" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bairro">Bairro</Label>
                  <Select required onValueChange={(value) => {
                    if (value === "Outros") {
                      setOutrosBairro("");
                    }
                  }}>
                    <SelectTrigger id="bairro">
                      <SelectValue placeholder="Selecione seu bairro" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {bairros.map((bairro) => (
                        <SelectItem key={bairro} value={bairro}>
                          {bairro}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {outrosBairro === "" && (
                  <div className="space-y-2">
                    <Label htmlFor="outro-bairro">Qual bairro?</Label>
                    <Input
                      id="outro-bairro"
                      type="text"
                      placeholder="Digite o nome do bairro"
                      value={outrosBairro}
                      onChange={(e) => setOutrosBairro(e.target.value)}
                    />
                  </div>
                )}
              </>
            )}

            <Button type="submit" className="w-full gradient-primary text-lg font-semibold">
              {isLogin ? "Entrar" : "Criar Conta"}
            </Button>

            {isLogin && (
              <Button variant="link" className="w-full text-sm text-muted-foreground">
                Esqueci minha senha
              </Button>
            )}

            <div className="text-center">
              <Button
                type="button"
                variant="link"
                onClick={() => setIsLogin(!isLogin)}
                className="text-primary"
              >
                {isLogin ? "Criar nova conta" : "Já tenho uma conta"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
