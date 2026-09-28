import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { cleanCpf, formatCpf, isValidCpf } from "../lib/cpf";
import { cleanTituloEleitor, formatTituloEleitor, isValidTituloEleitor } from "../lib/titulo-eleitor";
import { cleanCep, formatCep, formatCepAddress, lookupCep } from "../lib/cep";
import { Toast } from "../components/Toast";
import { useAuth } from "../lib/auth";

interface Morador {
  id: string;
  voter_title: string;
  cpf: string | null;
  name: string;
  fiscal_responsavel: string;
  birth_date: string | null;
  voter_zone: string | null;
  voter_section: string | null;
  email: string | null;
  phone: string | null;
  cep: string | null;
  address: string | null;
  observacao: string | null;
  created_by_email: string | null;
}

export function MoradorDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { session } = useAuth();

  const [morador, setMorador] = useState<Morador | null>(null);
  const [history, setHistory] = useState<
    { id: string; campo: string; valor_antigo: string | null; valor_novo: string | null; alterado_por_email: string | null; created_at: string }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLookingUpCep, setIsLookingUpCep] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(
    (location.state as { justCreated?: boolean } | null)?.justCreated ? "Morador cadastrado!" : null,
  );

  const [voterTitle, setVoterTitle] = useState("");
  const [cpf, setCpf] = useState("");
  const [name, setName] = useState("");
  const [fiscalResponsavel, setFiscalResponsavel] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [voterZone, setVoterZone] = useState("");
  const [voterSection, setVoterSection] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [cep, setCep] = useState("");
  const [address, setAddress] = useState("");
  const [observacao, setObservacao] = useState("");

  useEffect(() => {
    // Clear the navigation state so refreshing the page doesn't re-show the toast.
    if (location.state) {
      window.history.replaceState({}, "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadHistory = async () => {
    const { data } = await supabase
      .from("alteracoes_log")
      .select("id, campo, valor_antigo, valor_novo, alterado_por_email, created_at")
      .eq("morador_id", id)
      .order("created_at", { ascending: false });
    if (data) setHistory(data);
  };

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.from("moradores").select("*").eq("id", id).maybeSingle();
      if (error) {
        setError(error.message);
      } else if (!data) {
        setError("Morador não encontrado");
      } else {
        const m = data as Morador;
        setMorador(m);
        setVoterTitle(formatTituloEleitor(m.voter_title));
        setCpf(m.cpf ? formatCpf(m.cpf) : "");
        setName(m.name);
        setFiscalResponsavel(m.fiscal_responsavel);
        setBirthDate(m.birth_date ?? "");
        setVoterZone(m.voter_zone ?? "");
        setVoterSection(m.voter_section ?? "");
        setEmail(m.email ?? "");
        setPhone(m.phone ?? "");
        setCep(m.cep ?? "");
        setAddress(m.address ?? "");
        setObservacao(m.observacao ?? "");
      }
      setLoading(false);
    })();
    loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCep(e.target.value);
    setCep(formatted);
    const digits = cleanCep(formatted);
    if (digits.length === 8) {
      setIsLookingUpCep(true);
      const result = await lookupCep(digits);
      setIsLookingUpCep(false);
      if (result) setAddress(formatCepAddress(result));
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!morador) return;

    const cleanedTitle = cleanTituloEleitor(voterTitle);
    if (!isValidTituloEleitor(cleanedTitle)) {
      setError("Título de Eleitor inválido");
      return;
    }
    const cleanedCpf = cpf.trim() ? cleanCpf(cpf) : null;
    if (cleanedCpf && !isValidCpf(cleanedCpf)) {
      setError("CPF inválido");
      return;
    }
    if (!name.trim()) {
      setError("Nome é obrigatório");
      return;
    }
    if (!fiscalResponsavel.trim()) {
      setError("Fiscal/Responsável é obrigatório");
      return;
    }

    const newValues: Record<string, string | null> = {
      voter_title: cleanedTitle,
      cpf: cleanedCpf,
      name: name.trim(),
      fiscal_responsavel: fiscalResponsavel.trim(),
      birth_date: birthDate || null,
      voter_zone: voterZone.trim() || null,
      voter_section: voterSection.trim() || null,
      email: email.trim() || null,
      phone: phone.trim() || null,
      cep: cep.trim() || null,
      address: address.trim() || null,
      observacao: observacao.trim() || null,
    };

    const fieldLabels: Record<string, string> = {
      voter_title: "Título de Eleitor",
      cpf: "CPF",
      name: "Nome",
      fiscal_responsavel: "Fiscal/Responsável",
      birth_date: "Data de nascimento",
      voter_zone: "Zona",
      voter_section: "Seção",
      email: "E-mail",
      phone: "Telefone",
      cep: "CEP",
      address: "Endereço",
      observacao: "Observação",
    };

    // Compara com os valores originalmente carregados para saber o que
    // realmente mudou — só esses campos entram no histórico.
    const changes = Object.entries(newValues)
      .filter(([field, value]) => (morador[field as keyof Morador] ?? null) !== value)
      .map(([field, value]) => ({
        morador_id: id,
        campo: fieldLabels[field] ?? field,
        valor_antigo: (morador[field as keyof Morador] as string | null) ?? null,
        valor_novo: value,
        alterado_por: session?.user.id ?? null,
        alterado_por_email: session?.user.email ?? null,
      }));

    setIsSaving(true);
    const { error: dbError } = await supabase
      .from("moradores")
      .update({ ...newValues, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (!dbError && changes.length > 0) {
      await supabase.from("alteracoes_log").insert(changes);
    }
    setIsSaving(false);

    if (dbError) {
      setError(dbError.message);
    } else {
      setMorador({ ...morador, ...newValues } as Morador);
      setToastMessage("Alterações salvas!");
      loadHistory();
    }
  };

  if (loading) return <p className="text-sm text-ink/50">Carregando...</p>;
  if (!morador) return <p className="text-sm text-red-600">{error ?? "Morador não encontrado"}</p>;

  return (
    <div className="space-y-4">
      {toastMessage && <Toast message={toastMessage} onDone={() => setToastMessage(null)} />}
      <button onClick={() => navigate("/moradores")} className="text-sm text-teal hover:underline">
        ← Voltar para a lista
      </button>
      <div className="rounded-lg border border-line bg-white p-5">
        <h2 className="mb-4 text-lg font-semibold text-ink">Dados do morador</h2>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nome completo" required>
              <input value={name} onChange={(e) => setName(e.target.value)} required className="input" />
            </Field>
            <Field label="Fiscal/Responsável" required>
              <input
                value={fiscalResponsavel}
                onChange={(e) => setFiscalResponsavel(e.target.value)}
                required
                className="input"
              />
            </Field>
            <Field label="Título de Eleitor" required>
              <input
                value={voterTitle}
                onChange={(e) => setVoterTitle(formatTituloEleitor(e.target.value))}
                maxLength={14}
                className="input"
              />
            </Field>
            <Field label="CPF (opcional)">
              <input
                value={cpf}
                onChange={(e) => setCpf(formatCpf(e.target.value.replace(/\D/g, "").slice(0, 11)))}
                maxLength={14}
                className="input"
              />
            </Field>
            <Field label="Data de nascimento">
              <input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="input"
              />
            </Field>
            <Field label="Zona">
              <input value={voterZone} onChange={(e) => setVoterZone(e.target.value)} className="input" />
            </Field>
            <Field label="Seção">
              <input
                value={voterSection}
                onChange={(e) => setVoterSection(e.target.value)}
                className="input"
              />
            </Field>
            <Field label="E-mail">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
              />
            </Field>
            <Field label="Telefone">
              <input value={phone} onChange={(e) => setPhone(e.target.value)} className="input" />
            </Field>
            <Field label="CEP">
              <input value={cep} onChange={handleCepChange} maxLength={9} className="input" />
              {isLookingUpCep && <p className="mt-1 text-xs text-ink/50">Buscando endereço...</p>}
            </Field>
            <Field label="Endereço" className="sm:col-span-2">
              <input value={address} onChange={(e) => setAddress(e.target.value)} className="input" />
            </Field>
            <Field label="Observação" className="sm:col-span-2">
              <textarea
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
                rows={3}
                className="input"
              />
            </Field>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={isSaving}
            className="rounded-md bg-ink px-4 py-2 text-sm font-medium text-paper hover:bg-ink/90 disabled:opacity-60"
          >
            {isSaving ? "Salvando..." : "Salvar alterações"}
          </button>
        </form>
      </div>

      <div className="rounded-lg border border-line bg-white p-5">
        <h2 className="mb-1 text-lg font-semibold text-ink">Histórico de alterações</h2>
        {morador.created_by_email && (
          <p className="mb-4 text-sm text-ink/60">Cadastrado por {morador.created_by_email}</p>
        )}
        {history.length === 0 ? (
          <p className="text-sm text-ink/50">Nenhuma alteração registrada.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-ink/60">
                  <th className="px-3 py-2 font-medium">Data e hora</th>
                  <th className="px-3 py-2 font-medium">Campo</th>
                  <th className="px-3 py-2 font-medium">Valor antigo</th>
                  <th className="px-3 py-2 font-medium">Valor novo</th>
                  <th className="px-3 py-2 font-medium">Alterado por</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h) => (
                  <tr key={h.id} className="border-b border-line last:border-0">
                    <td className="px-3 py-2 text-ink/70">
                      {new Date(h.created_at).toLocaleString("pt-BR")}
                    </td>
                    <td className="px-3 py-2 font-medium text-ink">{h.campo}</td>
                    <td className="px-3 py-2 text-ink/70">{h.valor_antigo ?? "—"}</td>
                    <td className="px-3 py-2 text-ink/70">{h.valor_novo ?? "—"}</td>
                    <td className="px-3 py-2 text-ink/70">{h.alterado_por_email ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  required,
  className,
  children,
}: {
  label: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <label className="mb-1 block text-sm font-medium text-ink">
        {label} {required && <span className="text-seal">*</span>}
      </label>
      {children}
    </div>
  );
}
