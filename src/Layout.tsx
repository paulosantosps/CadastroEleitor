import type { ReactNode } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
    isActive ? "bg-ink text-paper" : "text-ink/70 hover:bg-ink/5"
  }`;

export function Layout({ children }: { children: ReactNode }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-paper">
      <header className="border-b border-line bg-paper/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <h1 className="text-xl font-semibold text-ink">Cadastro de Moradores</h1>
          <nav className="flex items-center gap-2">
            <NavLink to="/" end className={navLinkClass}>
              Cadastrar
            </NavLink>
            <NavLink to="/moradores" className={navLinkClass}>
              Moradores
            </NavLink>
            <button
              onClick={handleLogout}
              className="ml-2 rounded-md px-3 py-1.5 text-sm font-medium text-ink/70 hover:bg-ink/5"
            >
              Sair
            </button>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
    </div>
  );
}
