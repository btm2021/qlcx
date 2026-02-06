'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, FileText, ScanLine, Settings, Users } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  {
    title: 'Tổng quan',
    href: '/',
    icon: Home,
  },
  {
    title: 'Hợp đồng',
    href: '/contracts',
    icon: FileText,
  },
  {
    title: 'Khách hàng',
    href: '/customers',
    icon: Users,
  },
  {
    title: 'Kiểm tra',
    href: '/inspections',
    icon: ScanLine,
  },
  {
    title: 'Cài đặt',
    href: '/settings',
    icon: Settings,
  },
]

export function Sidebar() {
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/'
    }
    return pathname.startsWith(href)
  }

  return (
    <aside className="flex h-full flex-col border-r bg-background">
      {/* Logo for mobile sidebar */}
      <div className="flex h-14 items-center border-b px-4 md:hidden">
        <h1 className="text-lg font-semibold tracking-tight">CamXe</h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => {
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                'hover:bg-accent hover:text-accent-foreground',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                active
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground'
              )}
              aria-current={active ? 'page' : undefined}
            >
              <item.icon
                className={cn(
                  'h-5 w-5 transition-colors',
                  active ? 'text-primary' : 'text-muted-foreground'
                )}
              />
              {item.title}
            </Link>
          )
        })}
      </nav>

      {/* Footer info */}
      <div className="border-t p-4">
        <p className="text-xs text-muted-foreground text-center">
          CamXe - Hệ thống Quản lý Cầm Đồ
        </p>
        <p className="text-xs text-muted-foreground text-center mt-1">
          v1.0.0
        </p>
      </div>
    </aside>
  )
}
