'use client';

import { MathChatInterface } from '@/components/ai-assistants/math/math-chat-interface-connected';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Sigma } from "lucide-react";

export default function MathAIChatPage() {
  return (
    <div className="flex flex-col h-screen">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem className="hidden md:block">
              <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="hidden md:block" />
            <BreadcrumbItem className="hidden md:block">
              <BreadcrumbLink href="/dashboard/math-assistant">
                Math Assistant
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="hidden md:block" />
            <BreadcrumbItem>
              <BreadcrumbPage>AI Chat</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="ml-auto">
          <ThemeToggle />
        </div>
      </header>

      {/* Math Assistant Banner */}
      <div className="relative overflow-hidden border-b bg-linear-to-r from-purple-600 via-violet-600 to-indigo-600 px-4 sm:px-6 py-3">
        <div className="absolute inset-0 bg-linear-to-br from-white/10 to-transparent" />
        <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-white/10 blur-xl" />
        <div className="relative flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded-lg bg-white/20 backdrop-blur">
              <Sigma className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white leading-tight">Math AI Assistant</p>
              <p className="text-xs text-white/70">Step-by-step problem solving with visualizations</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 bg-white/20 rounded-full px-3 py-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 animate-pulse" />
            <span className="text-xs text-white font-medium">Online</span>
          </div>
        </div>
      </div>

      <main className="flex-1 overflow-hidden">
        <MathChatInterface />
      </main>
    </div>
  );
}
