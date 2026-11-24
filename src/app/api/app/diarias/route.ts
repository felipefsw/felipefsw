import { NextResponse } from "next/server";

/**
 * Stub da API que o app ppf-diaria / rederwp usavam em /api/app/diarias.
 * Fase 1: responde 503 com orientação até o contrato ser portado de fato.
 * Não remove o endpoint do rederwp até o cutover.
 */
export async function GET() {
  return NextResponse.json(
    {
      ok: false,
      migracao: true,
      mensagem:
        "API de diárias no felipefsw ainda em migração. Use o app web /d/[token] ou a API do rederwp até o cutover da Fase 1.",
      docs: "/docs/cutover-diaristas.md",
    },
    { status: 503 },
  );
}

export async function POST() {
  return GET();
}
