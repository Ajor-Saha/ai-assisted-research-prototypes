"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Lock, UserRound } from "lucide-react"
import { cn } from "@/lib/utils"

interface SettingsLayoutProps {
  children: React.ReactNode
}

const tabs = [
  {
    href: "/dashboard/settings/profile",
    label: "Update Profile",
    icon: UserRound,
  },
  {
    href: "/dashboard/settings/security",
    label: "Change Password",
    icon: Lock,
  },
]

export default function SettingsLayout({ children }: SettingsLayoutProps) {
  const pathname = usePathname()

  return (
    <div className="min-h-full bg-linear-to-br from-slate-100 via-white to-sky-100 dark:from-slate-950 dark:via-slate-950 dark:to-sky-950/30 p-4 sm:p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="rounded-2xl border bg-background/90 backdrop-blur p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Settings</p>
          <h1 className="text-2xl sm:text-3xl font-bold mt-2">Account Management</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Keep your profile details fresh and secure your account credentials.
          </p>

          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-2">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = pathname === tab.href

              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background hover:bg-muted"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </Link>
              )
            })}
          </div>
        </div>

        <div>{children}</div>
      </div>
    </div>
  )
}
