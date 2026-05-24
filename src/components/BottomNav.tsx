"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Item = {
  href: string;
  label: string;
  tour: string;
  icon: React.ReactNode;
};

const items: Item[] = [
  {
    href: "/",
    label: "Início",
    tour: "nav-inicio",
    icon: (
      <path d="M3 10.5 12 3l9 7.5M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5" />
    ),
  },
  {
    href: "/escala",
    label: "Escala",
    tour: "nav-escala",
    icon: (
      <>
        <rect x="3" y="4.5" width="18" height="16" rx="2" />
        <path d="M3 9h18M8 3v3M16 3v3" />
      </>
    ),
  },
  {
    href: "/requisicoes",
    label: "Pedidos",
    tour: "nav-pedidos",
    icon: (
      <>
        <rect x="6" y="4" width="12" height="17" rx="2" />
        <path d="M9.5 4V3h5v1M9 11h6M9 15h4" />
      </>
    ),
  },
  {
    href: "/diaristas",
    label: "Diaristas",
    tour: "nav-diaristas",
    icon: (
      <>
        <circle cx="9" cy="8" r="3.2" />
        <path d="M3.5 20c0-3 2.5-5 5.5-5s5.5 2 5.5 5" />
        <path d="M16 11.5a3 3 0 1 0 0-6M20.5 20c0-2.4-1.6-4.2-3.7-4.8" />
      </>
    ),
  },
  {
    href: "/lojas",
    label: "Lojas",
    tour: "nav-lojas",
    icon: (
      <>
        <path d="M4 9.5 5.2 5h13.6L20 9.5" />
        <path d="M4 9.5a2.2 2.2 0 0 0 4 0 2.2 2.2 0 0 0 4 0 2.2 2.2 0 0 0 4 0 2.2 2.2 0 0 0 4 0" />
        <path d="M5 11v8a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-8" />
      </>
    ),
  },
  {
    href: "/pagamentos",
    label: "Pagamentos",
    tour: "nav-pagamentos",
    icon: (
      <>
        <rect x="2.5" y="6" width="19" height="12" rx="2" />
        <circle cx="12" cy="12" r="2.5" />
      </>
    ),
  },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 inset-x-0 z-20 border-t border-gray-200 bg-white">
      <div className="mx-auto flex max-w-2xl">
        {items.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              data-tour={item.tour}
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
