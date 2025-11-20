import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import logo from "@/assets/busquei-logo-main.png";

const bairros = [
  "1º Abril", "3 Pontes", "7 de Abril", "Amendoeiras", "Amoreiras", "Baixada",
  "Césarinho", "Cond. Paçuare 1", "Cond. Paçuare 2", "Conj 735", "Cosmos",
  "Estrada dos Vieiras", "Gouveia", "Inhoaíba", "Nova Jersey", "Paçuare 1",
  "Paçuare 2", "Paciência", "Parque Sueli", "Urucânia", "Varanda", "Outros"
];

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [outrosBairro, setOutrosBairro] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedBairro, setSelectedBairro] = useState("");
  const [selectedSexo, setSelectedSexo] = useState("");
  const [lembrarEmail, setLembrarEmail] = useState(false);
  const [loginAutomatico, setLoginAutomatico] = useState(false);
  const [emailSalvo, setEmailSalvo] = useState("");
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  // Carregar preferências salvas
  useEffect(() => {
    const savedEmail = localStorage.getItem("busquei_saved_email");
    const autoLogin = localStorage.getItem("busquei_auto_login") === "true";
    const savedPassword = localStorage.getItem("busquei_saved_password");

    if (savedEmail) {
      setEmailSalvo(savedEmail);
      setLembrarEmail(true);
    }

    if (autoLogin && savedEmail && savedPassword) {
      setLoginAutomatico(true);
      // Fazer login automático
      realizarLoginAutomatico(savedEmail, savedPassword);
    }
  }, []);

  const realizarLoginAutomatico = async (email: string, encodedPassword: string) => {
    try {
      setLoading(true);
      const password = atob(encodedPassword); // Decodificar senha
      
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (error) {
        // Se falhar, limpar credenciais salvas
        localStorage.removeItem("busquei_saved_password");
        localStorage.removeItem("busquei_auto_login");
        toast.error("Login automático falhou. Por favor, faça login novamente.");
        return;
      }

      toast.success("Login automático realizado!");
      navigate("/");
    } catch (error) {
      localStorage.removeItem("busquei_saved_password");
      localStorage.removeItem("busquei_auto_login");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const senha = formData.get("senha") as string;

    try {
      if (isLogin) {
        if (!email || !senha) {
          toast.error("Por favor, preencha email e senha");
          return;
        }

        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: senha,
        });

        if (error) {
          if (error.message.includes("Invalid login credentials")) {
            toast.error("Email ou senha incorretos");
          } else {
            toast.error("Erro ao fazer login: " + error.message);
          }
          return;
        }

        // Salvar preferências de login
        if (lembrarEmail || loginAutomatico) {
          localStorage.setItem("busquei_saved_email", email.trim());
        } else {
          localStorage.removeItem("busquei_saved_email");
        }

        if (loginAutomatico) {
          localStorage.setItem("busquei_auto_login", "true");
          localStorage.setItem("busquei_saved_password", btoa(senha)); // Codificar senha em base64
        } else {
          localStorage.removeItem("busquei_auto_login");
          localStorage.removeItem("busquei_saved_password");
        }

        toast.success("Login realizado com sucesso!");
        navigate("/");
      } else {
        const nome = formData.get("nome") as string;
        const nascimento = formData.get("nascimento") as string;
        const endereco = formData.get("endereco") as string;
        const numero = formData.get("numero") as string;
        const telefone = formData.get("telefone") as string;
        const cpf = formData.get("cpf") as string;
        const referencia = formData.get("referencia") as string;

        if (!email || !senha || !nome || !nascimento || !endereco || !numero || !telefone || !selectedSexo || !selectedBairro) {
          toast.error("Por favor, preencha todos os campos obrigatórios");
          return;
        }

        const { data: authData, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password: senha,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              nome_completo: nome,
            },
          },
        });

        if (signUpError) {
          if (signUpError.message.includes("already registered")) {
            toast.error("Este email já está cadastrado");
          } else {
            toast.error("Erro ao criar conta: " + signUpError.message);
          }
          return;
        }

        if (authData.user) {
          const bairroFinal = selectedBairro === "Outros" ? outrosBairro : selectedBairro;
          
          const { error: profileError } = await supabase.from("profiles").update({
            nome_completo: nome,
            data_nascimento: nascimento,
            endereco,
            numero,
            telefone,
            sexo: selectedSexo,
            cpf: cpf || null,
            referencia: referencia || null,
            bairro: bairroFinal,
          }).eq("id", authData.user.id);

          if (profileError) {
            console.error("Error updating profile:", profileError);
          }

          // Criar endereço padrão em user_addresses
          const { error: addressError } = await supabase.from("user_addresses").insert({
            user_id: authData.user.id,
            nome: "Casa",
            endereco,
            numero,
            bairro: bairroFinal,
            complemento: "",
            referencia: referencia || "",
            is_active: true,
          });

          if (addressError) {
            console.error("Error creating address:", addressError);
          }
        }

        toast.success("Cadastro realizado com sucesso!");
        navigate("/");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Erro inesperado. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center gradient-primary p-4 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" />
      </div>

      <Card className="w-full max-w-md relative z-10 border-2 border-primary/20 shadow-2xl backdrop-blur-sm bg-card/95">
        <CardHeader className="text-center space-y-6 pb-8">
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl animate-pulse-glow" />
              <img 
                src={logo} 
                alt="BUSQUEI" 
                className="h-48 w-48 object-contain relative z-10 animate-float drop-shadow-2xl rounded-3xl" 
              />
            </div>
          </div>
          <div className="space-y-2">
            <CardTitle className="text-4xl font-bold bg-gradient-to-r from-primary via-primary to-secondary bg-clip-text text-transparent">
              BUSQUEI
            </CardTitle>
            <CardDescription className="text-lg mt-2 text-muted-foreground">
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
                  <Input id="nome" name="nome" type="text" placeholder="Seu nome completo" required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nascimento">Data de Nascimento</Label>
                  <Input id="nascimento" name="nascimento" type="date" required />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="endereco">Endereço</Label>
                    <Input id="endereco" name="endereco" type="text" placeholder="Rua/Av" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="numero">Número</Label>
                    <Input id="numero" name="numero" type="text" placeholder="Nº" required />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input id="telefone" name="telefone" type="tel" placeholder="(21) 99999-9999" required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sexo">Sexo</Label>
                  <Select required value={selectedSexo} onValueChange={setSelectedSexo}>
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
              <Input 
                id="email" 
                name="email" 
                type="email" 
                placeholder="seu@email.com" 
                defaultValue={isLogin ? emailSalvo : ""}
                required 
              />
            </div>

            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="cpf">CPF (opcional)</Label>
                <Input id="cpf" name="cpf" type="text" placeholder="000.000.000-00" />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="senha">Senha</Label>
              <Input id="senha" name="senha" type="password" placeholder="••••••••" required />
            </div>

            {isLogin && (
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="lembrar-email"
                    checked={lembrarEmail}
                    onCheckedChange={(checked) => {
                      setLembrarEmail(checked as boolean);
                      if (!checked) {
                        setLoginAutomatico(false);
                      }
                    }}
                  />
                  <Label htmlFor="lembrar-email" className="text-sm font-normal cursor-pointer">
                    Lembrar meu email
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="login-automatico"
                    checked={loginAutomatico}
                    onCheckedChange={(checked) => {
                      setLoginAutomatico(checked as boolean);
                      if (checked) {
                        setLembrarEmail(true);
                      }
                    }}
                  />
                  <Label htmlFor="login-automatico" className="text-sm font-normal cursor-pointer">
                    Fazer login automaticamente
                  </Label>
                </div>
              </div>
            )}

            {!isLogin && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="referencia">Ponto de Referência</Label>
                  <Input id="referencia" name="referencia" type="text" placeholder="Ex: Próximo ao mercado X" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bairro">Bairro</Label>
                  <Select
                    required
                    name="bairro"
                    value={selectedBairro}
                    onValueChange={(value) => {
                      setSelectedBairro(value);
                      if (value !== "Outros") {
                        setOutrosBairro("");
                      }
                    }}
                  >
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

                {selectedBairro === "Outros" && (
                  <div className="space-y-2">
                    <Label htmlFor="outro-bairro">Qual bairro?</Label>
                    <Input
                      id="outro-bairro"
                      name="outro-bairro"
                      type="text"
                      placeholder="Digite o nome do bairro"
                      value={outrosBairro}
                      onChange={(e) => setOutrosBairro(e.target.value)}
                      required
                    />
                  </div>
                )}
              </>
            )}

            <Button
              type="submit"
              className="w-full gradient-primary text-lg font-semibold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300 border border-primary/30"
              disabled={loading}
            >
              {loading ? "Aguarde..." : isLogin ? "Entrar" : "Criar Conta"}
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
