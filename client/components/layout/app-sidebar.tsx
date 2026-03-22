"use client"

import * as React from "react"
import {
  AudioWaveform,
  BookOpen,
  Command,
  GalleryVerticalEnd,

  Settings2,
  GraduationCap,
} from "lucide-react"

import { NavMain } from "@/components/layout/nav-main"
import { NavUser } from "@/components/layout/nav-user"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import useAuthStore from "@/store/store"
import { Axios } from "@/config/axios"
import { env } from "@/config/env"
import { useRouter } from "next/navigation"
import { useCourseStore } from "@/store/course-store"

// This is sample data.
const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  teams: [
    {
      name: "ClarityAI",
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
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  
  const { user, logout } = useAuthStore();
  const { courses, fetchCourses } = useCourseStore();
  const router = useRouter();
  
  React.useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  // Build navigation with actual courses from API
  const navMain = React.useMemo(() => [
    {
      title: "Courses",
      url: "/dashboard",
      icon: GraduationCap,
      isActive: true,
      items: courses.map((course) => ({
        title: course.name,
        url: `/dashboard/course/${course.courseId}`,
      })),
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
  ], [courses]);

  const handleSignOut = async () => {
    try {
      const response = await Axios.post(
        `${env.BACKEND_BASE_URL}/api/auth/signout`
      );
      if (response.data.success) {
        logout();
        router.push("/sign-in");
      } else {
        throw new Error("Failed to sign out");
      }
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <h2 className="ml-2 my-2">ClarityAI</h2>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
        
      </SidebarContent>
      <SidebarFooter>
         <NavUser
          user={{
            name: user?.firstName || null,
            email: user?.email || null,
            avatar: user?.avatar || undefined,
          }}
          onSignOut={handleSignOut}
        />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
