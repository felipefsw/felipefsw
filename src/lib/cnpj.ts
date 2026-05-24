// Valida CNPJ (14 dígitos + dígitos verificadores). Ignora pontuação.
export function cnpjValido(entrada: string | null | undefined): boolean {
  const c = (entrada ?? "").replace(/\D/g, "");
  if (c.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(c)) return false; // todos os dígitos iguais

  const calc = (base: string, pesos: number[]) => {
    let soma = 0;
    for (let i = 0; i < pesos.length; i++) soma += Number(base[i]) * pesos[i];
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  };

  const pesos1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const pesos2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const d1 = calc(c.slice(0, 12), pesos1);
  if (d1 !== Number(c[12])) return false;
  const d2 = calc(c.slice(0, 13), pesos2);
  return d2 === Number(c[13]);
}
