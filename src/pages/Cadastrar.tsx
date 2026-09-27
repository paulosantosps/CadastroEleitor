import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { cleanTituloEleitor, formatTituloEleitor, isValidTituloEleitor } from "../lib/titulo-eleitor";
import { cleanCpf, formatCpf, isValidCpf } from "../lib/cpf";
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

export function Cadastrar() {
  const navigate = useNavigate();

  const [voterTitle, setVoterTitle] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [found, setFound] = useState<Morador | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
  const [isLookingUpCep, setIsLookingUpCep] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleVoterTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVoterTitle(formatTituloEleitor(e.target.value));
    setFound(null);
    setShowForm(false);
    setError(null);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const cleaned = cleanTituloEleitor(voterTitle);
    if (!isValidTituloEleitor(cleaned)) {
      setError("Título de Eleitor inválido");
      return;
    }
    setIsSearching(true);
    const { data, error: dbError } = await supabase
      .from("moradores")
      .select("*")
      .eq("voter_title", cleaned)
      .maybeSingle();
    setIsSearching(false);

    if (dbError) {
      setError(dbError.message);
      return;
    }
    if (data) {
      setFound(data as Morador);
      setShowForm(false);
    } else {
      setFound(null);
      setShowForm(true);
    }
  };

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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanedTitle = cleanTituloEleitor(voterTitle);
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
    const { data, error: dbError } = await supabase
      .from("moradores")
      .insert({
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
      })
      .select()
      .single();
    setIsSaving(false);

    if (dbError) {
      setError(dbError.message);
      return;
    }
    navigate(`/moradores/${data.id}`, { state: { justCreated: true } });
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-line bg-white p-5">
        <h2 className="mb-1 text-lg font-semibold text-ink">Consultar morador</h2>
        <p className="mb-4 text-sm text-ink/60">
          Busque pelo Título de Eleitor para verificar se já existe cadastro
        </p>
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            value={voterTitle}
            onChange={handleVoterTitleChange}
            placeholder="00000000 00 00"
            maxLength={14}
            className="flex-1 rounded-md border border-line px-3 py-2 text-sm outline-none focus:border-teal"
          />
          <button
            type="submit"
            disabled={isSearching}
            className="rounded-md bg-seal px-4 py-2 text-sm font-medium text-white hover:bg-seal/90 disabled:opacity-60"
          >
            {isSearching ? "Buscando..." : "Consultar"}
          </button>
        </form>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </div>

      {found && (
        <div className="rounded-lg border border-line bg-white p-5">
          <h2 className="text-lg font-semibold text-ink">Morador encontrado</h2>
          <p className="mt-2 text-sm text-ink">
            <span className="font-medium">{found.name}</span>
          </p>
          <p className="text-sm text-ink/70">Título: {formatTituloEleitor(found.voter_title)}</p>
          {found.cpf && <p className="text-sm text-ink/70">CPF: {formatCpf(found.cpf)}</p>}
          <button
            onClick={() => navigate(`/moradores/${found.id}`)}
            className="mt-3 rounded-md bg-teal px-4 py-2 text-sm font-medium text-white hover:bg-teal/90"
          >
            Ver / editar cadastro
          </button>
        </div>
      )}

      {showForm && (
        <div className="rounded-lg border border-line bg-white p-5">
          <h2 className="text-lg font-semibold text-ink">Cadastrar morador</h2>
          <p className="mb-4 text-sm text-ink/60">
            Título de Eleitor {voterTitle} ainda não possui cadastro
          </p>
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nome completo" required>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="input"
                />
              </Field>
              <Field label="Fiscal/Responsável" required>
                <input
                  value={fiscalResponsavel}
                  onChange={(e) => setFiscalResponsavel(e.target.value)}
                  required
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
              <Field label="CPF (opcional)">
                <input
                  value={cpf}
                  onChange={(e) => setCpf(formatCpf(e.target.value.replace(/\D/g, "").slice(0, 11)))}
                  placeholder="000.000.000-00"
                  maxLength={14}
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
                <input
                  value={cep}
                  onChange={handleCepChange}
                  placeholder="00000-000"
                  maxLength={9}
                  className="input"
                />
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
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-md bg-ink px-4 py-2 text-sm font-medium text-paper hover:bg-ink/90 disabled:opacity-60"
            >
              {isSaving ? "Salvando..." : "Salvar cadastro"}
            </button>
          </form>
        </div>
      )}
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
