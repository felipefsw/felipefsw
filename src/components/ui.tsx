import Link from "next/link";

export const inputClass =
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 outline-none focus:border-orange-600 focus:ring-2 focus:ring-orange-100";

export const labelClass = "block text-sm font-medium text-gray-700 mb-1";

export const btnPrimary =
  "inline-flex items-center justify-center gap-1 rounded-lg bg-orange-700 px-4 py-2 font-medium text-white hover:bg-orange-800 disabled:opacity-50";

export const btnSecondary =
  "inline-flex items-center justify-center gap-1 rounded-lg border border-gray-300 bg-white px-4 py-2 font-medium text-gray-700 hover:bg-gray-50";

export const btnDanger =
  "inline-flex items-center justify-center gap-1 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50";

export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-xl border border-gray-200 bg-white p-4 shadow-sm ${className}`}>
      {children}
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: { href: string; label: string };
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-3">
      <div>
        <h1 className="text-xl font-bold text-gray-900">{title}</h1>
        {subtitle ? <p className="text-sm text-gray-500">{subtitle}</p> : null}
      </div>
      {action ? (
        <Link href={action.href} className={btnPrimary}>
          {action.label}
        </Link>
      ) : null}
    </div>
  );
}

export function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center text-gray-500">
      {children}
    </div>
  );
}
