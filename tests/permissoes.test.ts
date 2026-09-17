// Teste de aceite 10 (seção 11 do book):
// "RLS: gerente não lê outra loja; equipe não escreve; TV só lê."
//
// No book essas travas são RLS do Postgres. Aqui elas vivem em
// src/lib/painel/papeis.ts, e é isso que este arquivo verifica.

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  SemPermissao,
  carregarAcesso,
  exigeEditar,
  exigeVer,
  lojasDoAcesso,
  papelNaLoja,
  podeEditar,
  podeVer,
  temPapel,
  type Acesso,
} from "@/lib/painel/papeis";
import { criarTokenTv, lojaDoTokenTv } from "@/lib/painel/tv";

const MARCA_DO_TESTE = "teste-permissoes@painel.local";

let wlp1 = "";
let reiWs = "";
const acessos: Record<string, Acesso> = {};

async function criarPessoa(apelido: string, papeis: { storeId: string; role: Parameters<typeof temPapel>[2][number] }[]) {
  const perfil = await prisma.profile.create({
    data: {
      name: apelido,
      email: `${apelido}.${MARCA_DO_TESTE}`,
      memberships: { create: papeis.map((p) => ({ storeId: p.storeId, role: p.role })) },
    },
  });
  const acesso = await carregarAcesso(perfil.id);
  if (!acesso) throw new Error(`não consegui carregar o acesso de ${apelido}`);
  acessos[apelido] = acesso;
  return perfil.id;
}

beforeAll(async () => {
  const lojas = await prisma.store.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } });
  const wlp = lojas.find((l) => l.name.includes("We Love"));
  const rei = lojas.find((l) => l.name.includes("Rei da Pizza"));
  if (!wlp || !rei) throw new Error("rode `npx tsx prisma/seed.painel.ts` antes dos testes");
  wlp1 = wlp.id;
  reiWs = rei.id;

  await prisma.profile.deleteMany({ where: { email: { endsWith: MARCA_DO_TESTE } } });

  await criarPessoa("gerente", [{ storeId: wlp1, role: "gerente" }]);
  await criarPessoa("equipe", [{ storeId: wlp1, role: "equipe" }]);
  await criarPessoa("gestor", [{ storeId: wlp1, role: "gestor" }]);
  await criarPessoa("auditor", [{ storeId: wlp1, role: "auditor" }]);
  await criarPessoa("admin", [{ storeId: wlp1, role: "admin_rede" }]);
  await criarPessoa("cd", [{ storeId: wlp1, role: "cd" }]);
  await criarPessoa("inativo", [{ storeId: wlp1, role: "gerente" }]);
});

afterAll(async () => {
  await prisma.profile.deleteMany({ where: { email: { endsWith: MARCA_DO_TESTE } } });
  await prisma.tvToken.deleteMany({ where: { storeId: { in: [wlp1, reiWs] } } });
  await prisma.$disconnect();
});

describe("gerente não lê outra loja", () => {
  it("lê a loja dele", () => {
    expect(podeVer(acessos.gerente, wlp1)).toBe(true);
    expect(papelNaLoja(acessos.gerente, wlp1)).toBe("gerente");
  });

  it("não lê a outra loja da rede", () => {
    expect(podeVer(acessos.gerente, reiWs)).toBe(false);
    expect(papelNaLoja(acessos.gerente, reiWs)).toBeNull();
    expect(() => exigeVer(acessos.gerente, reiWs)).toThrow(SemPermissao);
  });

  it("o seletor de loja só mostra a loja dele", async () => {
    const lojas = await lojasDoAcesso(acessos.gerente);
    expect(lojas.map((l) => l.id)).toEqual([wlp1]);
  });

  it("não edita a meta da semana nem os parâmetros (isso é do gestor)", () => {
    expect(podeEditar(acessos.gerente, wlp1, "meta")).toBe(false);
    expect(podeEditar(acessos.gerente, wlp1, "parametros")).toBe(false);
    expect(podeEditar(acessos.gerente, wlp1, "aprovacao")).toBe(false);
    expect(() => exigeEditar(acessos.gerente, wlp1, "meta")).toThrow(SemPermissao);
  });

  it("edita a operação do dia a dia", () => {
    expect(podeEditar(acessos.gerente, wlp1, "operacao")).toBe(true);
    expect(() => exigeEditar(acessos.gerente, wlp1, "operacao")).not.toThrow();
  });
});

describe("equipe não escreve", () => {
  it("lê o placar da loja dele", () => {
    expect(podeVer(acessos.equipe, wlp1)).toBe(true);
  });

  it("não escreve em nenhuma área", () => {
    const areas = ["parametros", "usuarios", "modelos", "meta", "equipe", "operacao", "auditoria", "cd", "aprovacao"] as const;
    for (const area of areas) {
      expect(podeEditar(acessos.equipe, wlp1, area), `equipe não deveria editar "${area}"`).toBe(false);
      expect(() => exigeEditar(acessos.equipe, wlp1, area)).toThrow(SemPermissao);
    }
  });
});

describe("TV só lê", () => {
  it("o token abre a loja certa", async () => {
    const { token } = await criarTokenTv(wlp1);
    await expect(lojaDoTokenTv(wlp1, token)).resolves.toMatchObject({ id: wlp1 });
  });

  it("o token de uma loja não abre a outra", async () => {
    const { token } = await criarTokenTv(wlp1);
    await expect(lojaDoTokenTv(reiWs, token)).resolves.toBeNull();
  });

  it("token inexistente, vazio ou vencido não abre nada", async () => {
    await expect(lojaDoTokenTv(wlp1, "nao-existe")).resolves.toBeNull();
    await expect(lojaDoTokenTv(wlp1, null)).resolves.toBeNull();
    const vencido = await prisma.tvToken.create({
      data: { storeId: wlp1, token: `vencido-${Date.now()}`, expires: new Date(Date.now() - 1000) },
    });
    await expect(lojaDoTokenTv(wlp1, vencido.token)).resolves.toBeNull();
  });

  it("quem chega pela TV não tem acesso de escrita nenhum", () => {
    // A TV não cria sessão: o acesso é null, e null não vê nem edita nada.
    expect(podeVer(null, wlp1)).toBe(false);
    expect(podeEditar(null, wlp1, "operacao")).toBe(false);
    expect(() => exigeVer(null, wlp1)).toThrow(SemPermissao);
  });
});

describe("os outros papéis da seção 3", () => {
  it("admin da rede vê todas as lojas e edita tudo", async () => {
    const lojas = await lojasDoAcesso(acessos.admin);
    expect(lojas.length).toBeGreaterThanOrEqual(2);
    expect(podeVer(acessos.admin, reiWs)).toBe(true);
    for (const area of ["parametros", "usuarios", "modelos", "meta", "aprovacao"] as const) {
      expect(podeEditar(acessos.admin, reiWs, area)).toBe(true);
    }
  });

  it("gestor aprova o fechamento e define a meta, mas não mexe em usuários", () => {
    expect(podeEditar(acessos.gestor, wlp1, "meta")).toBe(true);
    expect(podeEditar(acessos.gestor, wlp1, "aprovacao")).toBe(true);
    expect(podeEditar(acessos.gestor, wlp1, "equipe")).toBe(true);
    expect(podeEditar(acessos.gestor, wlp1, "usuarios")).toBe(false);
  });

  it("auditor só lança auditoria", () => {
    expect(podeEditar(acessos.auditor, wlp1, "auditoria")).toBe(true);
    expect(podeEditar(acessos.auditor, wlp1, "operacao")).toBe(false);
    expect(podeEditar(acessos.auditor, wlp1, "meta")).toBe(false);
  });

  it("CD vê todas as lojas e só mexe em cupons e entregas", async () => {
    const lojas = await lojasDoAcesso(acessos.cd);
    expect(lojas.length).toBeGreaterThanOrEqual(2);
    expect(podeEditar(acessos.cd, reiWs, "cd")).toBe(true);
    expect(podeEditar(acessos.cd, wlp1, "operacao")).toBe(false);
    expect(podeEditar(acessos.cd, wlp1, "meta")).toBe(false);
  });

  it("usuário desativado perde o acesso na hora", async () => {
    const inativo = await prisma.profile.findUnique({ where: { email: `inativo.${MARCA_DO_TESTE}` } });
    await prisma.profile.update({ where: { id: inativo!.id }, data: { active: false } });
    await expect(carregarAcesso(inativo!.id)).resolves.toBeNull();
    expect(podeVer(null, wlp1)).toBe(false);
  });
});
