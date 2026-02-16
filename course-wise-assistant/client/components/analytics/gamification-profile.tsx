"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Zap, GraduationCap } from "lucide-react"

export function GamificationProfile() {
  return (
    <Card className="border-none shadow-none bg-transparent">
      <CardHeader className="p-0 pb-4">
        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Your Progress</CardTitle>
      </CardHeader>
      <CardContent className="p-0 space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
            12
          </div>
          <div>
            <p className="text-sm font-medium">Level 12 Scholar</p>
            <div className="w-32 h-1.5 bg-muted rounded-full mt-1 overflow-hidden">
              <div className="bg-primary h-full w-[70%]" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="bg-muted/50 p-2 rounded flex flex-col items-center justify-center text-center">
            <Zap className="h-4 w-4 text-yellow-500 mb-1" />
            <span className="text-xs font-bold">5 Day Streak</span>
          </div>
          <div className="bg-muted/50 p-2 rounded flex flex-col items-center justify-center text-center">
            <GraduationCap className="h-4 w-4 text-blue-500 mb-1" />
            <span className="text-xs font-bold">Top 5%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
