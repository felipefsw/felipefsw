import Link from "next/link";
import BottomNav from "@/components/BottomNav";

export default function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="mx-auto flex min-h-full max-w-2xl flex-col">
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-teal-700 text-white">
        <div className="flex items-center gap-2 px-4 py-3">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor">
              <circle cx="12" cy="8" r="3.4" />
              <path d="M5 20c0-3.6 3.1-6 7-6s7 2.4 7 6a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1z" />
            </svg>
            Gestão de Diaristas
          </Link>
        </div>
      </header>

      <main className="flex-1 px-4 pb-24 pt-4">{children}</main>

      <BottomNav />
    </div>
  );
}
