"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Item = { sub: string; label: string; icon: React.ReactNode };

const items: Item[] = [
  {
    sub: "",
    label: "Início",
    icon: <path d="M3 10.5 12 3l9 7.5M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5" />,
  },
  {
    sub: "vagas",
    label: "Vagas",
    icon: (
      <>
        <rect x="6" y="4" width="12" height="17" rx="2" />
        <path d="M9.5 4V3h5v1M9 11h6M9 15h4" />
      </>
    ),
  },
  {
    sub: "bonus",
    label: "Bônus",
    icon: (
      <>
        <path d="M20 12v9H4v-9M2 7h20v5H2zM12 22V7M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
      </>
    ),
  },
  {
    sub: "lojas",
    label: "Lojas",
    icon: (
      <>
        <path d="M4 9.5 5.2 5h13.6L20 9.5" />
        <path d="M4 9.5a2.2 2.2 0 0 0 4 0 2.2 2.2 0 0 0 4 0 2.2 2.2 0 0 0 4 0 2.2 2.2 0 0 0 4 0" />
        <path d="M5 11v8a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-8" />
      </>
    ),
  },
];

export default function BottomNavDiarista({ token }: { token: string }) {
  const pathname = usePathname();
  const base = `/d/${token}`;

  return (
    <nav className="fixed bottom-0 inset-x-0 z-20 border-t border-gray-200 bg-white">
      <div className="mx-auto flex max-w-md">
        {items.map((item) => {
          const href = item.sub ? `${base}/${item.sub}` : base;
          const active = item.sub ? pathname.startsWith(href) : pathname === base;
          return (
            <Link
              key={item.label}
              href={href}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium transition-colors ${
                active ? "text-orange-700" : "text-gray-500"
              }`}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-6 w-6"
              >
                {item.icon}
              </svg>
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
