"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  LayoutDashboard,
  Calendar,
  ListVideo,
  CreditCard,
  Settings,
  Plus,
} from "lucide-react"
import Link from "next/link"

interface SidebarProps {
  activeItem?: string
  className?: string
}

const navItems = [
  { name: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
  { name: "Interviews", icon: ListVideo, href: "/dashboard/interviews" },
  { name: "Jobs", icon: Calendar, href: "/dashboard/jobs" },
  { name: "Settings", icon: Settings, href: "/dashboard/settings" },
]

export function Sidebar({ activeItem = "Dashboard", className }: SidebarProps) {
  return (
    <aside className={cn("flex h-full w-64 flex-col bg-card border-r border-border", className)}>
      <div className="p-6">
        <Link href="/">
          <h1 className="text-2xl font-bold text-primary hover:opacity-80 transition-opacity">TalentPulse</h1>
        </Link>
      </div>

      <div className="px-4 pb-6">
        <Link href="/create-interview">
          <Button className="w-full justify-start gap-2" size="lg">
            <Plus className="size-5" />
            Create New Interview
          </Button>
        </Link>
      </div>

      <nav className="flex-1 px-3">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = item.name === activeItem
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <item.icon className={cn("size-5", isActive && "text-primary")} />
                  {item.name}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </aside>
  )
}
