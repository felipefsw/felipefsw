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
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/rwp-logo.svg" alt="RWP" className="h-7 w-auto" />
            <span>Gestão de Diaristas · Pizzarias RWP</span>
          </Link>
        </div>
      </header>

      <main className="flex-1 px-4 pb-24 pt-4">{children}</main>

      <BottomNav />
    </div>
  );
}
