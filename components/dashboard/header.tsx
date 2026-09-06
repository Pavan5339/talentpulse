"use client"

import { Bell, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Sidebar } from "./sidebar"
import { logoutAction } from "@/app/actions/auth"

interface HeaderProps {
  userName?: string
}

export function Header({ userName = "Sarah" }: HeaderProps) {
  return (
    <header className="flex items-center justify-between border-b border-border bg-card px-6 py-4">
      <div className="flex items-center gap-4">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="lg:hidden">
              <Menu className="size-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <Sidebar />
          </SheetContent>
        </Sheet>

        <div>
          <h1 className="text-xl font-semibold text-foreground sm:text-2xl">
            Welcome back, {userName}!
          </h1>
          <p className="text-sm text-muted-foreground">
            AI-Driven Interviews, Hassle-Free Hiring
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="size-5" />
          <span className="sr-only">Notifications</span>
        </Button>
        <form action={logoutAction}>
          <Button variant="outline" size="sm" type="submit">Log Out</Button>
        </form>
      </div>
    </header>
  )
}
