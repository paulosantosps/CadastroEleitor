import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { cleanCpf, formatCpf, isValidCpf } from "../lib/cpf";
import { cleanTituloEleitor, formatTituloEleitor, isValidTituloEleitor } from "../lib/titulo-eleitor";
import { cleanCep, formatCep, formatCepAddress, lookupCep } from "../lib/cep";

interface Morador {
  id: string;
  voter_title: string;
  cpf: string | null;
  name: string;
  fiscal_responsavel: string;
  email: string | null;
  phone: string | null;
  cep: string | null;
  address: string | null;
}

export function MoradorDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [morador, setMorador] = useState<Morador | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLookingUpCep, setIsLookingUpCep] = useState(false);

  const [voterTitle, setVoterTitle] = useState("");
  const [cpf, setCpf] = useState("");
  const [name, setName] = useState("");
  const [fiscalResponsavel, setFiscalResponsavel] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [cep, setCep] = useState("");
  const [address, setAddress] = useState("");

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
        setEmail(m.email ?? "");
        setPhone(m.phone ?? "");
        setCep(m.cep ?? "");
        setAddress(m.address ?? "");
      }
      setLoading(false);
    })();
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

    setIsSaving(true);
    const { error: dbError } = await supabase
      .from("moradores")
      .update({
        voter_title: cleanedTitle,
        cpf: cleanedCpf,
        name: name.trim(),
        fiscal_responsavel: fiscalResponsavel.trim(),
        email: email.trim() || null,
        phone: phone.trim() || null,
        cep: cep.trim() || null,
        address: address.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);
    setIsSaving(false);

    if (dbError) setError(dbError.message);
    else setError(null);
  };

  if (loading) return <p className="text-sm text-ink/50">Carregando...</p>;
  if (!morador) return <p className="text-sm text-red-600">{error ?? "Morador não encontrado"}</p>;

  return (
    <div className="space-y-4">
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
