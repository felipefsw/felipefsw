import crypto from "crypto";

// Hash de senha com scrypt (nativo do Node, sem dependência externa).
// Formato armazenado: "salt:hash" (ambos em hex).
export function gerarHashSenha(senha: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(senha, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function conferirSenha(senha: string, armazenado: string | null | undefined): boolean {
  if (!armazenado || !armazenado.includes(":")) return false;
  const [salt, hash] = armazenado.split(":");
  const calc = crypto.scryptSync(senha, salt, 64);
  const guardado = Buffer.from(hash, "hex");
  return guardado.length === calc.length && crypto.timingSafeEqual(guardado, calc);
}

// Regra mínima de senha (ajustável depois).
export function senhaForte(senha: string): boolean {
  return typeof senha === "string" && senha.trim().length >= 6;
}
