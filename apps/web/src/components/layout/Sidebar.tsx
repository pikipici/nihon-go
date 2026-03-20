"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/dashboard",          label: "Beranda",      icon: "⌂" },
  { href: "/dashboard/learn",    label: "Belajar",      icon: "📚" },
  { href: "/dashboard/srs",      label: "SRS Review",   icon: "🃏" },
  { href: "/dashboard/test",     label: "Mock Test",    icon: "📝" },
  { href: "/dashboard/progress", label: "Progress",     icon: "📊" },
];

export function Sidebar() {
  const path = usePathname();
  return (
    <aside className="hidden w-56 flex-shrink-0 border-r border-gray-100 bg-white lg:flex lg:flex-col">
      <div className="flex h-14 items-center border-b border-gray-100 px-5">
        <span className="text-lg font-medium text-purple-600">にほんご</span>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {NAV.map((item) => {
          const active = path === item.href;
          return (
            <Link key={item.href} href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${active ? "bg-purple-50 text-purple-700 font-medium" : "text-gray-600 hover:bg-gray-50"}`}>
              <span style={{ fontSize: "14px" }}>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
