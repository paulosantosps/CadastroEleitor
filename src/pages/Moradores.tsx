import { useEffect, useMemo, useRef, useState } from "react";
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
  email: string | null;
  cep: string | null;
  address: string | null;
  observacao: string | null;
  created_by_email: string | null;
  created_at: string;
}

interface DisplayRow {
  id: string;
  name: string;
  voterTitle: string;
  voterZone: string;
  voterSection: string;
  cpf: string;
  fiscalResponsavel: string;
  birthDate: string;
  phone: string;
  email: string;
  cep: string;
  address: string;
  observacao: string;
  createdByEmail: string;
  createdAt: string;
}

type TextFilterKey = "name" | "voterTitle" | "cpf" | "birthDate" | "phone";
type MultiFilterKey = "fiscalResponsavel" | "voterZone" | "voterSection";

const emptyTextFilters: Record<TextFilterKey, string> = {
  name: "",
  voterTitle: "",
  cpf: "",
  birthDate: "",
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

function downloadCsv(rows: DisplayRow[]) {
  const headers = [
    "Nome",
    "Título de Eleitor",
    "Zona",
    "Seção",
    "CPF",
    "Fiscal/Responsável",
    "Data de nascimento",
    "Telefone",
    "E-mail",
    "CEP",
    "Endereço",
    "Observação",
    "Cadastrado por",
    "Data do cadastro",
  ];

  const lines = rows.map((r) =>
    [
      r.name,
      r.voterTitle,
      r.voterZone,
      r.voterSection,
      r.cpf,
      r.fiscalResponsavel,
      r.birthDate,
      r.phone,
      r.email,
      r.cep,
      r.address,
      r.observacao,
      r.createdByEmail,
      r.createdAt,
    ]
      .map(csvEscape)
      .join(";"),
  );

  // BOM (\uFEFF) faz o Excel abrir acentos certinho; ";" é o separador que
  // o Excel em pt-BR espera.
  const csv = "\uFEFF" + [headers.join(";"), ...lines].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `moradores-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function MultiSelectDropdown({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: string[];
  selected: Set<string>;
  onChange: (next: Set<string>) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    if (!open) setSearch("");
  }, [open]);

  const toggle = (value: string) => {
    const next = new Set(selected);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    onChange(next);
  };

  const visibleOptions = options.filter((opt) =>
    opt.toLowerCase().includes(search.trim().toLowerCase()),
  );

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full rounded border border-line bg-white px-2 py-1 text-left text-xs outline-none focus:border-teal"
      >
        {selected.size === 0 ? "Todos" : `${selected.size} selecionado(s)`}
      </button>
      {open && (
        <div className="absolute z-10 mt-1 w-48 rounded-md border border-line bg-white p-2 shadow-lg">
          {options.length > 5 && (
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Pesquisar..."
              className="mb-2 w-full rounded border border-line px-2 py-1 text-xs outline-none focus:border-teal"
            />
          )}
          <div className="max-h-40 overflow-y-auto">
          {options.length === 0 ? (
            <p className="px-1 py-1 text-xs text-ink/50">Sem opções ainda</p>
          ) : visibleOptions.length === 0 ? (
            <p className="px-1 py-1 text-xs text-ink/50">Nenhuma opção encontrada</p>
          ) : (
            visibleOptions.map((opt) => (
              <label
                key={opt}
                className="flex cursor-pointer items-center gap-2 rounded px-1 py-1 text-xs hover:bg-paper"
              >
                <input type="checkbox" checked={selected.has(opt)} onChange={() => toggle(opt)} />
                {opt}
              </label>
            ))
          )}
          </div>
          {selected.size > 0 && (
            <button
              type="button"
              onClick={() => onChange(new Set())}
              className="mt-1 w-full rounded px-1 py-1 text-left text-xs text-teal hover:underline"
            >
              Limpar seleção ({label})
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function Moradores() {
  const [rows, setRows] = useState<MoradorRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [textFilters, setTextFilters] = useState(emptyTextFilters);
  const [fiscalResponsavelFilter, setFiscalResponsavelFilter] = useState<Set<string>>(new Set());
  const [voterZoneFilter, setVoterZoneFilter] = useState<Set<string>>(new Set());
  const [voterSectionFilter, setVoterSectionFilter] = useState<Set<string>>(new Set());

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("moradores")
        .select("*")
        .order("name", { ascending: true });
      if (error) setError(error.message);
      else setRows(data as MoradorRow[]);
    })();
  }, []);

  const displayRows: DisplayRow[] = useMemo(
    () =>
      (rows ?? []).map((r) => ({
        id: r.id,
        name: r.name,
        voterTitle: formatTituloEleitor(r.voter_title),
        voterZone: r.voter_zone ?? "",
        voterSection: r.voter_section ?? "",
        cpf: r.cpf ? formatCpf(r.cpf) : "",
        fiscalResponsavel: r.fiscal_responsavel,
        birthDate: formatBirthDate(r.birth_date),
        phone: r.phone ?? "",
        email: r.email ?? "",
        cep: r.cep ?? "",
        address: r.address ?? "",
        observacao: r.observacao ?? "",
        createdByEmail: r.created_by_email ?? "",
        createdAt: r.created_at ? new Date(r.created_at).toLocaleString("pt-BR") : "",
      })),
    [rows],
  );

  const distinctOptions = (key: "fiscalResponsavel" | "voterZone" | "voterSection") =>
    Array.from(new Set(displayRows.map((r) => r[key]).filter((v) => v.trim() !== ""))).sort((a, b) =>
      a.localeCompare(b, "pt-BR"),
    );

  const fiscalResponsavelOptions = useMemo(() => distinctOptions("fiscalResponsavel"), [displayRows]);
  const voterZoneOptions = useMemo(() => distinctOptions("voterZone"), [displayRows]);
  const voterSectionOptions = useMemo(() => distinctOptions("voterSection"), [displayRows]);

  const filtered = displayRows.filter((r) => {
    const textOk = (Object.keys(textFilters) as TextFilterKey[]).every((key) =>
      r[key].toLowerCase().includes(textFilters[key].trim().toLowerCase()),
    );
    const fiscalOk = fiscalResponsavelFilter.size === 0 || fiscalResponsavelFilter.has(r.fiscalResponsavel);
    const zoneOk = voterZoneFilter.size === 0 || voterZoneFilter.has(r.voterZone);
    const sectionOk = voterSectionFilter.size === 0 || voterSectionFilter.has(r.voterSection);
    return textOk && fiscalOk && zoneOk && sectionOk;
  });

  const setTextFilter = (key: TextFilterKey, value: string) =>
    setTextFilters((prev) => ({ ...prev, [key]: value }));

  const hasActiveFilter =
    Object.values(textFilters).some((v) => v.trim() !== "") ||
    fiscalResponsavelFilter.size > 0 ||
    voterZoneFilter.size > 0 ||
    voterSectionFilter.size > 0;

  const clearAllFilters = () => {
    setTextFilters(emptyTextFilters);
    setFiscalResponsavelFilter(new Set());
    setVoterZoneFilter(new Set());
    setVoterSectionFilter(new Set());
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="rounded-lg border border-line bg-white px-4 py-3">
          <p className="text-2xl font-semibold text-ink">{rows === null ? "…" : filtered.length}</p>
          <p className="text-xs text-ink/60">
            {hasActiveFilter ? `Moradores filtrados (de ${rows?.length ?? 0} no total)` : "Total de moradores cadastrados"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {hasActiveFilter && (
            <button
              onClick={clearAllFilters}
              className="rounded-md border border-line px-4 py-2 text-sm font-medium text-ink/70 hover:bg-paper"
            >
              Limpar filtros
            </button>
          )}
          <button
            onClick={() => downloadCsv(filtered)}
            disabled={!rows}
            className="rounded-md bg-teal px-4 py-2 text-sm font-medium text-white hover:bg-teal/90 disabled:opacity-60"
          >
            {hasActiveFilter ? `Baixar planilha filtrada (${filtered.length})` : "Baixar planilha (CSV)"}
          </button>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="overflow-x-auto rounded-lg border border-line bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line bg-paper text-left text-ink/60">
              <th className="px-4 py-2 font-medium">Nome</th>
              <th className="px-4 py-2 font-medium">Título de Eleitor</th>
              <th className="px-4 py-2 font-medium">Zona</th>
              <th className="px-4 py-2 font-medium">Seção</th>
              <th className="px-4 py-2 font-medium">CPF</th>
              <th className="px-4 py-2 font-medium">Fiscal/Responsável</th>
              <th className="px-4 py-2 font-medium">Nascimento</th>
              <th className="px-4 py-2 font-medium">Telefone</th>
            </tr>
            <tr className="border-b border-line bg-paper/60">
              <th className="px-2 py-1.5">
                <input
                  value={textFilters.name}
                  onChange={(e) => setTextFilter("name", e.target.value)}
                  placeholder="Filtrar..."
                  className="w-full rounded border border-line bg-white px-2 py-1 text-xs font-normal outline-none focus:border-teal"
                />
              </th>
              <th className="px-2 py-1.5">
                <input
                  value={textFilters.voterTitle}
                  onChange={(e) => setTextFilter("voterTitle", e.target.value)}
                  placeholder="Filtrar..."
                  className="w-full rounded border border-line bg-white px-2 py-1 text-xs font-normal outline-none focus:border-teal"
                />
              </th>
              <th className="px-2 py-1.5">
                <MultiSelectDropdown
                  label="Zona"
                  options={voterZoneOptions}
                  selected={voterZoneFilter}
                  onChange={setVoterZoneFilter}
                />
              </th>
              <th className="px-2 py-1.5">
                <MultiSelectDropdown
                  label="Seção"
                  options={voterSectionOptions}
                  selected={voterSectionFilter}
                  onChange={setVoterSectionFilter}
                />
              </th>
              <th className="px-2 py-1.5">
                <input
                  value={textFilters.cpf}
                  onChange={(e) => setTextFilter("cpf", e.target.value)}
                  placeholder="Filtrar..."
                  className="w-full rounded border border-line bg-white px-2 py-1 text-xs font-normal outline-none focus:border-teal"
                />
              </th>
              <th className="px-2 py-1.5">
                <MultiSelectDropdown
                  label="Fiscal/Responsável"
                  options={fiscalResponsavelOptions}
                  selected={fiscalResponsavelFilter}
                  onChange={setFiscalResponsavelFilter}
                />
              </th>
              <th className="px-2 py-1.5">
                <input
                  value={textFilters.birthDate}
                  onChange={(e) => setTextFilter("birthDate", e.target.value)}
                  placeholder="dd/mm/aaaa"
                  className="w-full rounded border border-line bg-white px-2 py-1 text-xs font-normal outline-none focus:border-teal"
                />
              </th>
              <th className="px-2 py-1.5">
                <input
                  value={textFilters.phone}
                  onChange={(e) => setTextFilter("phone", e.target.value)}
                  placeholder="Filtrar..."
                  className="w-full rounded border border-line bg-white px-2 py-1 text-xs font-normal outline-none focus:border-teal"
                />
              </th>
            </tr>
          </thead>
          <tbody>
            {rows === null ? (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-ink/50">
                  Carregando...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-ink/50">
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
                  <td className="px-4 py-2 text-ink/70">{r.voterZone || "—"}</td>
                  <td className="px-4 py-2 text-ink/70">{r.voterSection || "—"}</td>
                  <td className="px-4 py-2 text-ink/70">{r.cpf || "—"}</td>
                  <td className="px-4 py-2 text-ink/70">{r.fiscalResponsavel}</td>
                  <td className="px-4 py-2 text-ink/70">{r.birthDate || "—"}</td>
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
