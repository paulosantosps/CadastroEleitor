export function cleanTituloEleitor(value: string): string {
  return value.replace(/\D/g, "").slice(0, 12);
}

export function formatTituloEleitor(value: string): string {
  const digits = cleanTituloEleitor(value);
  const seq = digits.slice(0, 8);
  const uf = digits.slice(8, 10);
  const dv = digits.slice(10, 12);
  return [seq, uf, dv].filter(Boolean).join(" ");
}

/**
 * Validates a Título de Eleitor using the TSE's módulo 11 checksum
 * (Resolução TSE 21.538/2003): 8 sequential digits + 2-digit UF code (01–28)
 * + 2 check digits. Each check digit is the remainder of the weighted sum
 * mod 11, with two exceptions: a remainder of 10 becomes 0, and for
 * São Paulo (01) / Minas Gerais (02) a remainder of 0 becomes 1.
 */
export function isValidTituloEleitor(value: string): boolean {
  const digits = cleanTituloEleitor(value);
  if (digits.length !== 12) return false;
  if (/^(\d)\1{11}$/.test(digits)) return false;

  const seq = digits.slice(0, 8).split("").map(Number);
  const uf = digits.slice(8, 10);
  const ufNum = Number(uf);
  if (ufNum < 1 || ufNum > 28) return false;

  const isSpMg = uf === "01" || uf === "02";

  const computeDv = (weightedSum: number): number => {
    const rest = weightedSum % 11;
    if (rest === 10) return 0;
    if (rest === 0) return isSpMg ? 1 : 0;
    return rest;
  };

  const weights1 = [2, 3, 4, 5, 6, 7, 8, 9];
  const sum1 = seq.reduce((acc, d, i) => acc + d * weights1[i], 0);
  const dv1 = computeDv(sum1);

  const ufDigits = uf.split("").map(Number);
  const sum2 = ufDigits[0] * 7 + ufDigits[1] * 8 + dv1 * 9;
  const dv2 = computeDv(sum2);

  return digits.slice(10, 12) === `${dv1}${dv2}`;
}
