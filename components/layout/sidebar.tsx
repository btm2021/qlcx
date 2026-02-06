import Link from "next/link"
import { Home, FileText, Scan, Settings } from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  {
    title: "Tổng quan",
    href: "/",
    icon: Home,
  },
  {
    title: "Hợp đồng",
    href: "/contracts",
    icon: FileText,
  },
  {
    title: "Kiểm tra",
    href: "/inspections",
    icon: Scan,
  },
  {
    title: "Cài đặt",
    href: "/settings",
    icon: Settings,
  },
]

export function Sidebar() {
  return (
    <aside className="hidden md:flex w-64 flex-col border-r bg-background">
      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              "hover:bg-accent hover:text-accent-foreground",
              "focus:bg-accent focus:text-accent-foreground"
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.title}
          </Link>
        ))}
      </nav>
    </aside>
  )
}
