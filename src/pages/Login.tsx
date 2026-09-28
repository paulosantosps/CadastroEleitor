import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

export function Login() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setInfo(null);

    if (mode === "forgot") {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      setLoading(false);
      if (error) {
        setError(error.message);
        return;
      }
      setInfo("Enviamos um link de recuperação para o seu e-mail.");
      return;
    }

    const { error } =
      mode === "login"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });

    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    if (mode === "login") navigate("/");
    else setInfo("Conta criada! Verifique seu e-mail para confirmar, depois entre.");
  };

  const titles: Record<typeof mode, string> = {
    login: "Entre com sua conta",
    signup: "Crie sua conta",
    forgot: "Recuperar senha",
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-4">
      <div className="w-full max-w-sm rounded-lg border border-line bg-white p-6 shadow-sm">
        <h1 className="mb-1 text-2xl font-semibold text-ink">Cadastro de Moradores</h1>
        <p className="mb-6 text-sm text-ink/60">{titles[mode]}</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">E-mail</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-line px-3 py-2 text-sm outline-none focus:border-teal"
            />
          </div>
          {mode !== "forgot" && (
            <div>
              <label className="mb-1 block text-sm font-medium text-ink">Senha</label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-md border border-line px-3 py-2 text-sm outline-none focus:border-teal"
              />
            </div>
          )}
          {error && <p className="text-sm text-red-600">{error}</p>}
          {info && <p className="text-sm text-teal">{info}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-ink px-3 py-2 text-sm font-medium text-paper hover:bg-ink/90 disabled:opacity-60"
          >
            {loading
              ? "Aguarde..."
              : mode === "login"
                ? "Entrar"
                : mode === "signup"
                  ? "Criar conta"
                  : "Enviar link de recuperação"}
          </button>
        </form>

        {mode === "login" && (
          <button
            onClick={() => {
              setMode("forgot");
              setError(null);
              setInfo(null);
            }}
            className="mt-3 w-full text-center text-sm text-ink/60 hover:underline"
          >
            Esqueci minha senha
          </button>
        )}

        <button
          onClick={() => {
            setMode(mode === "login" ? "signup" : "login");
            setError(null);
            setInfo(null);
          }}
          className="mt-2 w-full text-center text-sm text-teal hover:underline"
        >
          {mode === "signup" ? "Já tenho conta" : mode === "forgot" ? "Voltar para o login" : "Criar uma conta nova"}
        </button>
      </div>
    </div>
  );
}
