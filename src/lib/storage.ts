// Upload de imagem para o Supabase Storage (bucket público "fotos") via REST.
// Usa SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (criados pela integração Supabase).
const URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = "fotos";

export function storageAtivo(): boolean {
  return Boolean(URL && KEY);
}

export async function uploadImagem(file: File, path: string): Promise<string | null> {
  if (!URL || !KEY) return null;
  const buf = Buffer.from(await file.arrayBuffer());
  const res = await fetch(`${URL}/storage/v1/object/${BUCKET}/${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${KEY}`,
      "Content-Type": file.type || "application/octet-stream",
      "x-upsert": "true",
    },
    body: buf,
  });
  if (!res.ok) return null;
  return `${URL}/storage/v1/object/public/${BUCKET}/${path}`;
}
