// Distância entre dois pontos (metros) e cálculo de valor proporcional da diária.

export const RAIO_CHECKIN_METROS = 500;

export function distanciaMetros(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371000; // raio da Terra em metros
  const rad = (g: number) => (g * Math.PI) / 180;
  const dLat = rad(lat2 - lat1);
  const dLng = rad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function minutos(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

/**
 * Valor a pagar dado o horário de saída.
 * - Saída no fim (ou depois) → valor cheio.
 * - Saída antes → proporcional ao tempo entre o início e a saída.
 */
export function valorProporcional(
  valor: number,
  horaInicio: string | null,
  horaFim: string | null,
  saida: Date,
): number {
  if (!horaInicio || !horaFim) return valor;
  const ini = minutos(horaInicio);
  const fim = minutos(horaFim);
  if (fim <= ini) return valor;
  const saidaMin = saida.getHours() * 60 + saida.getMinutes();
  if (saidaMin >= fim) return valor;
  if (saidaMin <= ini) return 0;
  const proporcao = (saidaMin - ini) / (fim - ini);
  return Math.round(valor * proporcao);
}
