import Link from "next/link";
import { requireProfile } from "@/lib/server/auth";
import { LayoutDashboard, Link2, Users, Megaphone, LayoutGrid, Inbox, BarChart3, ScrollText, Settings } from "lucide-react";

const NAV = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/links", label: "Links", icon: Link2 },
  { href: "/admin/partners", label: "Parceiros", icon: Users },
  { href: "/admin/campaigns", label: "Campanhas", icon: Megaphone },
  { href: "/admin/placements", label: "Posicionamentos", icon: LayoutGrid },
  { href: "/admin/leads", label: "Leads", icon: Inbox },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/audit", label: "Auditoria", icon: ScrollText },
  { href: "/admin/settings", label: "Configurações", icon: Settings },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireProfile();
  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-60 shrink-0 border-r bg-card p-4 md:block">
        <Link href="/admin" className="mb-6 block px-2 text-lg font-bold">
          Links Almeria
        </Link>
        <nav className="space-y-1">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <Icon className="size-4" /> {label}
            </Link>
          ))}
        </nav>
        <div className="mt-6 border-t pt-4 px-2 text-xs text-muted-foreground">
          <p className="font-medium text-foreground">{profile.full_name ?? profile.email}</p>
          <p className="capitalize">{profile.role}</p>
        </div>
      </aside>
      <main className="flex-1 overflow-x-hidden bg-muted/20">
        <div className="mx-auto max-w-6xl p-6">{children}</div>
      </main>
    </div>
  );
}
