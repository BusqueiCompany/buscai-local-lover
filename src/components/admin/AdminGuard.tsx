import { ReactNode, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface AdminGuardProps {
  children: ReactNode;
}

export function AdminGuard({ children }: AdminGuardProps) {
  const { isAdmin, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !isAdmin) {
      navigate("/");
      toast.error("Acesso negado");
    }
  }, [isAdmin, loading, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (!isAdmin) return null;

  return <>{children}</>;
}
