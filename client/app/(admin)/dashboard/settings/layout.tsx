"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Lock, Settings, UserRound } from "lucide-react"
import { cn } from "@/lib/utils"

interface SettingsLayoutProps {
  children: React.ReactNode
}

const tabs = [
  {
    href: "/dashboard/settings/profile",
    label: "Update Profile",
    icon: UserRound,
    color: "text-violet-600 dark:text-violet-400",
    activeBg: "bg-violet-600 hover:bg-violet-700",
    hoverBg: "hover:bg-violet-50 dark:hover:bg-violet-950/20 hover:border-violet-200 dark:hover:border-violet-800",
  },
  {
    href: "/dashboard/settings/security",
    label: "Change Password",
    icon: Lock,
    color: "text-emerald-600 dark:text-emerald-400",
    activeBg: "bg-emerald-600 hover:bg-emerald-700",
    hoverBg: "hover:bg-emerald-50 dark:hover:bg-emerald-950/20 hover:border-emerald-200 dark:hover:border-emerald-800",
  },
]

export default function SettingsLayout({ children }: SettingsLayoutProps) {
  const pathname = usePathname()

  return (
    <div className="min-h-full bg-linear-to-br from-slate-100 via-white to-violet-50 dark:from-slate-950 dark:via-slate-950 dark:to-violet-950/20 p-4 sm:p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Header Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-linear-to-r from-violet-600 via-indigo-600 to-blue-600 p-6 sm:p-8 text-white shadow-lg">
          <div className="absolute inset-0 bg-linear-to-br from-white/10 to-transparent" />
          <div className="absolute -top-8 -right-8 h-36 w-36 rounded-full bg-white/10 blur-2xl" />
          <div className="relative flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-white/20 backdrop-blur shrink-0">
              <Settings className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70 mb-0.5">Configuration</p>
              <h1 className="text-xl sm:text-2xl font-bold">Account Management</h1>
              <p className="text-sm text-white/70 mt-0.5">
                Keep your profile details fresh and secure your account credentials.
              </p>
            </div>
          </div>
        </div>

        {/* Nav Tabs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = pathname === tab.href

            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl border px-4 py-3.5 text-sm font-medium transition-all",
                  isActive
                    ? cn(tab.activeBg, "text-white border-transparent shadow-sm")
                    : cn("bg-background dark:bg-background", tab.hoverBg)
                )}
              >
                <Icon className={cn("h-4 w-4", isActive ? "text-white" : tab.color)} />
                {tab.label}
              </Link>
            )
          })}
        </div>

        <div>{children}</div>
      </div>
    </div>
  )
}
