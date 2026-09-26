export interface CepAddress {
  logradouro: string;
  bairro: string;
  localidade: string;
  uf: string;
}

export function cleanCep(cep: string): string {
  return cep.replace(/\D/g, "").slice(0, 8);
}

export function formatCep(cep: string): string {
  const digits = cleanCep(cep);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

/**
 * Looks up an address by CEP using ViaCEP (free, public, no API key).
 * Returns null if the CEP is malformed or not found.
 */
export async function lookupCep(cep: string): Promise<CepAddress | null> {
  const digits = cleanCep(cep);
  if (digits.length !== 8) return null;

  try {
    const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.erro) return null;
    return {
      logradouro: data.logradouro || "",
      bairro: data.bairro || "",
      localidade: data.localidade || "",
      uf: data.uf || "",
    };
  } catch {
    return null;
  }
}

/** Builds a single-line address string from a ViaCEP result. */
export function formatCepAddress(addr: CepAddress): string {
  const parts = [addr.logradouro, addr.bairro].filter(Boolean).join(", ");
  const city = [addr.localidade, addr.uf].filter(Boolean).join("/");
  return [parts, city].filter(Boolean).join(" - ");
}
