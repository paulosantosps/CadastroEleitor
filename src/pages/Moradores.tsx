import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { formatTituloEleitor } from "../lib/titulo-eleitor";
import { formatCpf } from "../lib/cpf";

interface MoradorRow {
  id: string;
  voter_title: string;
  cpf: string | null;
  name: string;
  fiscal_responsavel: string;
  phone: string | null;
  created_at: string;
}

export function Moradores() {
  const [rows, setRows] = useState<MoradorRow[] | null>(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("moradores")
        .select("id, voter_title, cpf, name, fiscal_responsavel, phone, created_at")
        .order("name", { ascending: true });
      if (error) setError(error.message);
      else setRows(data as MoradorRow[]);
    })();
  }, []);

  const filtered =
    rows?.filter((r) => r.name.toLowerCase().includes(search.trim().toLowerCase())) ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-ink">
          Moradores cadastrados {rows && <span className="text-ink/40">({rows.length})</span>}
        </h2>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filtrar por nome..."
          className="w-64 rounded-md border border-line px-3 py-1.5 text-sm outline-none focus:border-teal"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="overflow-x-auto rounded-lg border border-line bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line bg-paper text-left text-ink/60">
              <th className="px-4 py-2 font-medium">Nome</th>
              <th className="px-4 py-2 font-medium">Título de Eleitor</th>
              <th className="px-4 py-2 font-medium">CPF</th>
              <th className="px-4 py-2 font-medium">Fiscal/Responsável</th>
              <th className="px-4 py-2 font-medium">Telefone</th>
            </tr>
          </thead>
          <tbody>
            {rows === null ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-ink/50">
                  Carregando...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-ink/50">
                  Nenhum morador encontrado.
                </td>
              </tr>
            ) : (
              filtered.map((r) => (
                <tr key={r.id} className="border-b border-line last:border-0 hover:bg-paper/60">
                  <td className="px-4 py-2">
                    <Link to={`/moradores/${r.id}`} className="font-medium text-teal hover:underline">
                      {r.name}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-ink/70">{formatTituloEleitor(r.voter_title)}</td>
                  <td className="px-4 py-2 text-ink/70">{r.cpf ? formatCpf(r.cpf) : "—"}</td>
                  <td className="px-4 py-2 text-ink/70">{r.fiscal_responsavel}</td>
                  <td className="px-4 py-2 text-ink/70">{r.phone ?? "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
