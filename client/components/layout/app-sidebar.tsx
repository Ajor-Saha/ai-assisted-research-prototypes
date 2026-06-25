"use client"

import * as React from "react"
import Image from "next/image"
import {
  AudioWaveform,
  BookOpen,
  Command,
  MessageSquareText,
  Sigma,
  FlaskConical,
  UserCog,
  KeyRound,
  BookMarked,
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
  useSidebar,
} from "@/components/ui/sidebar"
import useAuthStore from "@/store/store"
import { Axios } from "@/config/axios"
import { env } from "@/config/env"
import { useRouter } from "next/navigation"
import { useCourseStore } from "@/store/course-store"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {

  const { user, logout } = useAuthStore();
  const { courses, fetchCourses } = useCourseStore();
  const router = useRouter();
  const { state } = useSidebar();
  
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
        icon: BookMarked,
      })),
    },
    {
      title: "Text Assistant",
      url: "/dashboard/text-assistant/text-ai-chat",
      icon: BookOpen,
      items: [
        {
          title: "AI BOT",
          url: "/dashboard/text-assistant/text-ai-chat",
          icon: MessageSquareText,
        },
      ],
    },
    {
      title: "Math Assistant",
      url: "/dashboard/math-assistant/math-ai-chat",
      icon: AudioWaveform,
      items: [
        {
          title: "AI BOT",
          url: "/dashboard/math-assistant/math-ai-chat",
          icon: Sigma,
        },
      ],
    },
    {
      title: "Research Assistant",
      url: "/dashboard/research-assistant/research-ai-chat",
      icon: Command,
      items: [
        {
          title: "AI BOT",
          url: "/dashboard/research-assistant/research-ai-chat",
          icon: FlaskConical,
        },
      ],
    },
    {
      title: "Settings",
      url: "/dashboard/settings/profile",
      icon: Settings2,
      items: [
        {
          title: "Update Profile",
          url: "/dashboard/settings/profile",
          icon: UserCog,
        },
        {
          title: "Change Password",
          url: "/dashboard/settings/security",
          icon: KeyRound,
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
        <div className="flex items-center gap-2.5 px-2 py-2.5">
          <div className="relative shrink-0">
            <div className="absolute inset-0 rounded-full bg-violet-500/30 blur-sm" />
            <Image
              src="/Gemini_Generated_Image_40b5sf40b5sf40b5.png"
              alt="Kogno Logo"
              width={32}
              height={32}
              className="relative h-8 w-8 rounded-full object-cover ring-2 ring-violet-500/40"
            />
          </div>
          {state === "expanded" && (
            <div className="flex flex-col min-w-0">
              <span className="text-base font-bold bg-linear-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent leading-tight">
                Kogno
              </span>
              <span className="text-[10px] text-muted-foreground font-medium leading-tight">AI Learning Platform</span>
            </div>
          )}
        </div>
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
