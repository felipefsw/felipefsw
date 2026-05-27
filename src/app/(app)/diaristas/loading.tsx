export default function Loading() {
  return (
    <div className="animate-pulse">
      <div className="mb-4 h-7 w-40 rounded bg-gray-200" />
      <div className="mb-4 h-10 w-full rounded bg-gray-100" />
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-16 rounded-xl bg-gray-100" />
        ))}
      </div>
    </div>
  );
}
