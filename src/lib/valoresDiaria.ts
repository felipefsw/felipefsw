// Opções fixas de valor da diária. Rótulo "base + 10"; valor gravado = base + 10.
export const VALORES_DIARIA = Array.from({ length: 15 }, (_, i) => {
  const base = 60 + i * 10; // 60, 70, ... 200
  const total = base + 10;
  return {
    label: `R$ ${base} + R$ 10 (R$ ${total})`,
    // valor em reais como texto; as actions convertem para centavos.
    value: String(total),
  };
});
