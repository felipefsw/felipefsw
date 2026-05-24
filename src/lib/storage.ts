// Upload de imagem para o Supabase Storage (bucket público "fotos") via REST.
// Usa SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (criados pela integração Supabase).
const URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = "fotos";

export function storageAtivo(): boolean {
  return Boolean(URL && KEY);
}

// Cria o bucket público "fotos" se ainda não existir (idempotente).
async function garantirBucket(): Promise<void> {
  if (!URL || !KEY) return;
  await fetch(`${URL}/storage/v1/bucket`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${KEY}`,
      apikey: KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ id: BUCKET, name: BUCKET, public: true }),
  }).catch(() => {});
}

export type UploadResultado = { url: string } | { erro: string };

export async function uploadImagemResultado(file: File, path: string): Promise<UploadResultado> {
  if (!URL || !KEY) {
    return {
      erro: "Armazenamento de fotos não configurado. Faltam SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY na Vercel.",
    };
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const enviar = () =>
    fetch(`${URL}/storage/v1/object/${BUCKET}/${path}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${KEY}`,
        apikey: KEY,
        "Content-Type": file.type || "application/octet-stream",
        "x-upsert": "true",
      },
      body: buf,
    });

  let res = await enviar();

  // Bucket inexistente → cria e tenta de novo.
  if (!res.ok && (res.status === 400 || res.status === 404)) {
    await garantirBucket();
    res = await enviar();
  }

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    return { erro: `Falha no upload (HTTP ${res.status}). ${txt.slice(0, 140)}`.trim() };
  }

  return { url: `${URL}/storage/v1/object/public/${BUCKET}/${path}` };
}

export async function uploadImagem(file: File, path: string): Promise<string | null> {
  const r = await uploadImagemResultado(file, path);
  return "url" in r ? r.url : null;
}
