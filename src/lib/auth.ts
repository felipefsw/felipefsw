import { cookies } from "next/headers";
import crypto from "crypto";

// Sessão simples por cookie assinado (HMAC). App interno; sem contas/senhas por usuário.
export type Sessao =
  | { tipo: "gestao"; perfil: "rh" | "ti" }
  | { tipo: "loja"; lojaId: string }
  | { tipo: "gestor"; gestorId: string; lojaId: string };

const COOKIE = "sessao";
const SECRET = process.env.SESSION_SECRET || "dev-secret-troque-no-vercel";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 dias

function sign(payload: string): string {
  return crypto.createHmac("sha256", SECRET).update(payload).digest("base64url");
}

function encode(s: Sessao): string {
  const body = Buffer.from(JSON.stringify(s)).toString("base64url");
  return `${body}.${sign(body)}`;
}

function decode(value: string): Sessao | null {
  const [body, sig] = value.split(".");
  if (!body || !sig) return null;
  if (sign(body) !== sig) return null;
  try {
    return JSON.parse(Buffer.from(body, "base64url").toString()) as Sessao;
  } catch {
    return null;
  }
}

export async function getSessao(): Promise<Sessao | null> {
  const c = await cookies();
  const v = c.get(COOKIE)?.value;
  return v ? decode(v) : null;
}

export async function setSessao(s: Sessao): Promise<void> {
  const c = await cookies();
  c.set(COOKIE, encode(s), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function limparSessao(): Promise<void> {
  const c = await cookies();
  c.delete(COOKIE);
}

// Contexto "lado loja": loja avulsa (login por CNPJ) ou gestor (com loja ativa).
// Retorna a lojaId ativa e o gestorId (quando houver), ou null se não for sessão de loja/gestor.
export function contextoLoja(s: Sessao | null): { lojaId: string; gestorId: string | null } | null {
  if (!s) return null;
  if (s.tipo === "loja") return { lojaId: s.lojaId, gestorId: null };
  if (s.tipo === "gestor") return { lojaId: s.lojaId, gestorId: s.gestorId };
  return null;
}

// Senhas de gestão: padrão 123456, sobrescrevíveis por variável no Vercel.
export function senhaGestao(perfil: "rh" | "ti"): string {
  if (perfil === "rh") return process.env.RH_SENHA || "123456";
  return process.env.TI_SENHA || "123456";
}
