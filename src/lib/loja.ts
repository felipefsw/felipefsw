// Helpers de exibição do endereço da loja.

export function bairroCidade(l: { bairro?: string | null; cidade?: string | null }): string {
  return [l.bairro, l.cidade].filter(Boolean).join(", ");
}

// Rua/número da loja para mostrar; se ainda não tiver, um texto provisório.
export function ruaDaLoja(l: { endereco?: string | null }): string {
  return l.endereco?.trim() || "Endereço a confirmar";
}

export function enderecoCompleto(l: {
  endereco?: string | null;
  bairro?: string | null;
  cidade?: string | null;
}): string {
  return [l.endereco, l.bairro, l.cidade].filter(Boolean).join(", ");
}
