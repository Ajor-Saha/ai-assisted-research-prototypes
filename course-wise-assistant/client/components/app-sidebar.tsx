"use client"

import * as React from "react"
import {
  AudioWaveform,
  BookOpen,
  Command,
  GalleryVerticalEnd,

  Settings2,
  GraduationCap,
  Plus,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"

// This is sample data.
const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  teams: [
    {
      name: "Acme Inc",
      logo: GalleryVerticalEnd,
      plan: "Enterprise",
    },
    {
      name: "Acme Corp.",
      logo: AudioWaveform,
      plan: "Startup",
    },
    {
      name: "Evil Corp.",
      logo: Command,
      plan: "Free",
    },
  ],
  navMain: [
    {
      title: "Courses",
      url: "/dashboard",
      icon: GraduationCap,
      isActive: true,
      items: [
        {
          title: "Create Course",
          url: "/dashboard#create",
          icon: Plus,
        },
        {
          title: "Introduction to Computer Science",
          url: "/dashboard/course/1",
        },
        {
          title: "Data Structures and Algorithms",
          url: "/dashboard/course/2",
        },
        {
          title: "Web Development Fundamentals",
          url: "/dashboard/course/3",
        },
        {
          title: "Machine Learning Basics",
          url: "/dashboard/course/4",
        },
      ],
    },
    {
      title: "Text Assistant",
      url: "/dashboard",
      icon: BookOpen,
      items: [
        {
          title: "Add Chat",
          url: "#",
        },
        {
          title: "AI BOT",
          url: "/dashboard/text-assistant/text-ai-chat",
        },
      ],
    },
    {
      title: "Math Assistant",
      url: "/dashboard",
      icon: AudioWaveform,
      items: [
        {
          title: "Add Chat",
          url: "#",
        },
        {
          title: "AI BOT",
          url: "/dashboard/math-assistant/math-ai-chat",
        },
      ],
    },
    {
      title: "Research Assistant",
      url: "/dashboard",
      icon: Command,
      items: [
        {
          title: "Add Chat",
          url: "/dashboard/research-assistant/add-chat",
        },
        {
          title: "AI BOT",
          url: "/dashboard/research-assistant/research-ai-chat",
        },
      ],
    },
    {
      title: "Settings",
      url: "#",
      icon: Settings2,
      items: [
        {
          title: "General",
          url: "#",
        },
        {
          title: "Team",
          url: "#",
        },
        {
          title: "Billing",
          url: "#",
        },
        {
          title: "Limits",
          url: "#",
        },
      ],
    },
  ],
  
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
