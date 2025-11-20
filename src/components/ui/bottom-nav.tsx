import { Home, Search, Star, User, Settings } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { cn } from "@/lib/utils";

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-primary">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        <NavLink
          to="/"
          className="flex flex-col items-center justify-center flex-1 h-full text-white/70 transition-colors"
          activeClassName="text-white"
        >
          <Home className="h-5 w-5 mb-1" />
          <span className="text-xs">Início</span>
        </NavLink>

        <NavLink
          to="/buscar"
          className="flex flex-col items-center justify-center flex-1 h-full text-white/70 transition-colors"
          activeClassName="text-white"
        >
          <Search className="h-5 w-5 mb-1" />
          <span className="text-xs">Buscar</span>
        </NavLink>

        <NavLink
          to="/vip"
          className="flex flex-col items-center justify-center flex-1 h-full text-white/70 transition-colors"
          activeClassName="text-white"
        >
          <Star className="h-5 w-5 mb-1 fill-yellow-400 text-yellow-400" />
          <span className="text-xs">Área VIP</span>
        </NavLink>

        <NavLink
          to="/perfil"
          className="flex flex-col items-center justify-center flex-1 h-full text-white/70 transition-colors"
          activeClassName="text-white"
        >
          <User className="h-5 w-5 mb-1" />
          <span className="text-xs">Perfil</span>
        </NavLink>

        <NavLink
          to="/configuracoes"
          className="flex flex-col items-center justify-center flex-1 h-full text-white/70 transition-colors"
          activeClassName="text-white"
        >
          <Settings className="h-5 w-5 mb-1" />
          <span className="text-xs">Config</span>
        </NavLink>
      </div>
    </nav>
  );
}
