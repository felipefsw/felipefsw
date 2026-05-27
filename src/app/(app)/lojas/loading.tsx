export default function Loading() {
  return (
    <div className="animate-pulse">
      <div className="mb-4 h-7 w-32 rounded bg-gray-200" />
      <div className="mb-4 h-10 w-full rounded bg-gray-100" />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="aspect-square rounded-2xl bg-gray-100" />
        ))}
      </div>
    </div>
  );
}
