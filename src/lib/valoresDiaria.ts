// Opções fixas de valor da diária. O "+10" é o transporte.
// value gravado = total (diária + transporte) em reais (texto); as actions convertem p/ centavos.
export const VALORES_DIARIA = Array.from({ length: 15 }, (_, i) => {
  const base = 60 + i * 10; // 60, 70, ... 200
  const total = base + 10;
  return {
    base,
    total,
    label: `R$ ${base} diária + R$ 10 transporte (R$ ${total})`,
    value: String(total),
  };
});
