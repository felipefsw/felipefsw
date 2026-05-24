// Avatar do diarista: foto se houver, senão um círculo com a inicial do nome.
export default function Avatar({
  nome,
  fotoUrl,
  className = "h-8 w-8",
}: {
  nome: string;
  fotoUrl?: string | null;
  className?: string;
}) {
  if (fotoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={fotoUrl}
        alt={nome}
        className={`${className} shrink-0 rounded-full object-cover`}
      />
    );
  }
  const inicial = (nome.trim()[0] ?? "?").toUpperCase();
  return (
    <span
      className={`${className} flex shrink-0 items-center justify-center rounded-full bg-orange-100 font-bold text-orange-700`}
    >
      {inicial}
    </span>
  );
}
