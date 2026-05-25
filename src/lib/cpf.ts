// Validação de CPF (dígitos verificadores). Rejeita formatos inválidos e
// sequências repetidas (ex.: 111.111.111-11).

// Só os dígitos do CPF (para comparar/normalizar, ignorando pontos e traços).
export function soCpfDigitos(entrada: string | null | undefined): string {
  return String(entrada ?? "").replace(/\D/g, "");
}

export function cpfValido(entrada: string | null | undefined): boolean {
  const cpf = String(entrada ?? "").replace(/\D/g, "");
  if (cpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false;

  let soma = 0;
  for (let i = 0; i < 9; i++) soma += Number(cpf[i]) * (10 - i);
  let d1 = 11 - (soma % 11);
  if (d1 >= 10) d1 = 0;
  if (d1 !== Number(cpf[9])) return false;

  soma = 0;
  for (let i = 0; i < 10; i++) soma += Number(cpf[i]) * (11 - i);
  let d2 = 11 - (soma % 11);
  if (d2 >= 10) d2 = 0;
  return d2 === Number(cpf[10]);
}
