import { useEffect, useMemo, useState } from "react";
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
  birth_date: string | null;
  voter_zone: string | null;
  voter_section: string | null;
  phone: string | null;
}

type FilterKey =
  | "name"
  | "voterTitle"
  | "cpf"
  | "fiscalResponsavel"
  | "birthDate"
  | "voterZone"
  | "voterSection"
  | "phone";

const emptyFilters: Record<FilterKey, string> = {
  name: "",
  voterTitle: "",
  cpf: "",
  fiscalResponsavel: "",
  birthDate: "",
  voterZone: "",
  voterSection: "",
  phone: "",
};

function formatBirthDate(value: string | null): string {
  if (!value) return "";
  const [y, m, d] = value.split("-");
  return `${d}/${m}/${y}`;
}

function csvEscape(value: string | null | undefined): string {
  const s = value ?? "";
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

async function downloadMoradoresCsv() {
  const { data, error } = await supabase
    .from("moradores")
    .select("*")
    .order("name", { ascending: true });
  if (error || !data) {
    alert("Erro ao gerar a planilha: " + (error?.message ?? "sem dados"));
    return;
  }

  const headers = [
    "Nome",
    "Título de Eleitor",
    "CPF",
    "Fiscal/Responsável",
    "Data de nascimento",
    "Zona",
    "Seção",
    "Telefone",
    "E-mail",
    "CEP",
    "Endereço",
    "Observação",
    "Cadastrado por",
    "Data do cadastro",
  ];

  const lines = data.map((r) =>
    [
      r.name,
      formatTituloEleitor(r.voter_title),
      r.cpf ? formatCpf(r.cpf) : "",
      r.fiscal_responsavel,
      formatBirthDate(r.birth_date),
      r.voter_zone,
      r.voter_section,
      r.phone,
      r.email,
      r.cep,
      r.address,
      r.observacao,
      r.created_by_email,
      new Date(r.created_at).toLocaleString("pt-BR"),
    ]
      .map(csvEscape)
      .join(";"),
  );

  // BOM (\uFEFF) makes Excel open accented characters correctly; ";" is the
  // separator Excel expects in pt-BR locale.
  const csv = "\uFEFF" + [headers.join(";"), ...lines].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `moradores-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function Moradores() {
  const [rows, setRows] = useState<MoradorRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState(emptyFilters);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("moradores")
        .select(
          "id, voter_title, cpf, name, fiscal_responsavel, birth_date, voter_zone, voter_section, phone",
        )
        .order("name", { ascending: true });
      if (error) setError(error.message);
      else setRows(data as MoradorRow[]);
    })();
  }, []);

  const displayRows = useMemo(
    () =>
      (rows ?? []).map((r) => ({
        id: r.id,
        name: r.name,
        voterTitle: formatTituloEleitor(r.voter_title),
        cpf: r.cpf ? formatCpf(r.cpf) : "",
        fiscalResponsavel: r.fiscal_responsavel,
        birthDate: formatBirthDate(r.birth_date),
        voterZone: r.voter_zone ?? "",
        voterSection: r.voter_section ?? "",
        phone: r.phone ?? "",
      })),
    [rows],
  );

  const filtered = displayRows.filter((r) =>
    (Object.keys(filters) as FilterKey[]).every((key) =>
      r[key].toLowerCase().includes(filters[key].trim().toLowerCase()),
    ),
  );

  const setFilter = (key: FilterKey, value: string) =>
    setFilters((prev) => ({ ...prev, [key]: value }));

  const columns: { key: FilterKey; label: string }[] = [
    { key: "name", label: "Nome" },
    { key: "voterTitle", label: "Título de Eleitor" },
    { key: "cpf", label: "CPF" },
    { key: "fiscalResponsavel", label: "Fiscal/Responsável" },
    { key: "birthDate", label: "Nascimento" },
    { key: "voterZone", label: "Zona" },
    { key: "voterSection", label: "Seção" },
    { key: "phone", label: "Telefone" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="rounded-lg border border-line bg-white px-4 py-3">
          <p className="text-2xl font-semibold text-ink">{rows === null ? "…" : rows.length}</p>
          <p className="text-xs text-ink/60">Total de moradores cadastrados</p>
        </div>
        {rows !== null && filtered.length !== rows.length && (
          <p className="text-sm text-ink/60">
            Mostrando {filtered.length} de {rows.length}
          </p>
        )}
        <button
          onClick={downloadMoradoresCsv}
          className="rounded-md bg-teal px-4 py-2 text-sm font-medium text-white hover:bg-teal/90"
        >
          Baixar planilha (CSV)
        </button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="overflow-x-auto rounded-lg border border-line bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line bg-paper text-left text-ink/60">
              {columns.map((c) => (
                <th key={c.key} className="px-4 py-2 font-medium">
                  {c.label}
                </th>
              ))}
            </tr>
            <tr className="border-b border-line bg-paper/60">
              {columns.map((c) => (
                <th key={c.key} className="px-2 py-1.5">
                  <input
                    value={filters[c.key]}
                    onChange={(e) => setFilter(c.key, e.target.value)}
                    placeholder="Filtrar..."
                    className="w-full rounded border border-line bg-white px-2 py-1 text-xs font-normal outline-none focus:border-teal"
                  />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows === null ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-6 text-center text-ink/50">
                  Carregando...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-6 text-center text-ink/50">
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
                  <td className="px-4 py-2 text-ink/70">{r.voterTitle}</td>
                  <td className="px-4 py-2 text-ink/70">{r.cpf || "—"}</td>
                  <td className="px-4 py-2 text-ink/70">{r.fiscalResponsavel}</td>
                  <td className="px-4 py-2 text-ink/70">{r.birthDate || "—"}</td>
                  <td className="px-4 py-2 text-ink/70">{r.voterZone || "—"}</td>
                  <td className="px-4 py-2 text-ink/70">{r.voterSection || "—"}</td>
                  <td className="px-4 py-2 text-ink/70">{r.phone || "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
