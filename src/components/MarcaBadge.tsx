import { seloDaLoja } from "@/lib/marcas";

export default function MarcaBadge({
  nome,
  className = "h-6 w-6 shrink-0 rounded",
}: {
  nome: string;
  className?: string;
}) {
  const { src, label } = seloDaLoja(nome);
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={label} title={label} className={className} />;
}
