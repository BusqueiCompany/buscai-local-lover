import { Home, Search, Star, User, Settings } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { cn } from "@/lib/utils";

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-emerald-500/5 border-t-2 border-emerald-500/30 shadow-lg shadow-emerald-500/10">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        <NavLink
          to="/"
          className="flex flex-col items-center justify-center flex-1 h-full text-muted-foreground transition-colors"
          activeClassName="text-emerald-600"
        >
          <Home className="h-5 w-5 mb-1" />
          <span className="text-xs">Início</span>
        </NavLink>

        <NavLink
          to="/buscar"
          className="flex flex-col items-center justify-center flex-1 h-full text-muted-foreground transition-colors"
          activeClassName="text-emerald-600"
        >
          <Search className="h-5 w-5 mb-1" />
          <span className="text-xs">Buscar</span>
        </NavLink>

        <NavLink
          to="/vip"
          className="flex flex-col items-center justify-center flex-1 h-full text-muted-foreground transition-colors"
          activeClassName="text-emerald-600"
        >
          <Star className="h-5 w-5 mb-1 fill-yellow-500 text-yellow-500" />
          <span className="text-xs">Área VIP</span>
        </NavLink>

        <NavLink
          to="/perfil"
          className="flex flex-col items-center justify-center flex-1 h-full text-muted-foreground transition-colors"
          activeClassName="text-emerald-600"
        >
          <User className="h-5 w-5 mb-1" />
          <span className="text-xs">Perfil</span>
        </NavLink>

        <NavLink
          to="/configuracoes"
          className="flex flex-col items-center justify-center flex-1 h-full text-muted-foreground transition-colors"
          activeClassName="text-emerald-600"
        >
          <Settings className="h-5 w-5 mb-1" />
          <span className="text-xs">Config</span>
        </NavLink>
      </div>
    </nav>
  );
}
