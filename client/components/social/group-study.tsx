'use client';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Users, MessageSquare, FileText, Share2, Plus, Star } from "lucide-react"

const MOCK_GROUPS = [
  {
    id: 1,
    name: "Exam Prep Squad",
    members: 4,
    active: true,
    description: "Focusing on Term Test 2 Algebra modules"
  },
  {
    id: 2,
    name: "Late Night Coders",
    members: 6,
    active: false,
    description: "Data Structures & Algo practice"
  }
]

const MOCK_RESOURCES = [
  {
    id: 1,
    title: "Chapter 4 Summary Notes",
    author: "Alice",
    likes: 12,
    type: "PDF"
  },
  {
    id: 2,
    title: "Practice Problems Set A",
    author: "Bob",
    likes: 8,
    type: "DOCX"
  }
]

export function GroupStudy() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-14rem)]">
      {/* Left: Groups List */}
      <Card className="col-span-1 flex flex-col h-full">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle>Your Groups</CardTitle>
            <Button size="icon" variant="ghost"><Plus className="h-4 w-4" /></Button>
          </div>
          <CardDescription>Join or create study circles</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 overflow-auto">
          <div className="space-y-4">
            {MOCK_GROUPS.map((group) => (
              <div key={group.id} className="flex items-start gap-4 p-3 rounded-lg border hover:bg-accent cursor-pointer transition-colors">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-semibold text-sm">{group.name}</h4>
                  <p className="text-xs text-muted-foreground">{group.description}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                    <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {group.members} members</span>
                    {group.active && <span className="flex items-center gap-1 text-green-500">● Active now</span>}
                  </div>
                </div>
              </div>
            ))}
            
            <Button variant="outline" className="w-full border-dashed">
              <Plus className="mr-2 h-4 w-4" /> Create New Group
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Middle: Chat/Activity Feed (Mock) */}
      <Card className="col-span-1 lg:col-span-2 flex flex-col h-full">
        <CardHeader className="border-b py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarFallback>EPS</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-base">Exam Prep Squad</CardTitle>
                <CardDescription className="text-xs">4 members online</CardDescription>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="icon"><Share2 className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon"><Users className="h-4 w-4" /></Button>
            </div>
          </div>
        </CardHeader>
        
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            <div className="flex gap-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback>AL</AvatarFallback>
              </Avatar>
              <div className="bg-muted p-3 rounded-lg rounded-tl-none text-sm max-w-[80%]">
                <p className="font-semibold text-xs mb-1">Alice</p>
                <p>Hey guys, has anyone solved the integration problem on page 42?</p>
              </div>
            </div>

            <div className="flex gap-3 flex-row-reverse">
              <Avatar className="h-8 w-8">
                <AvatarFallback>ME</AvatarFallback>
              </Avatar>
              <div className="bg-primary text-primary-foreground p-3 rounded-lg rounded-tr-none text-sm max-w-[80%]">
                <p>Yes! You need to use substitution method. Check the resource I just shared.</p>
              </div>
            </div>

            <div className="flex justify-center my-4">
              <span className="bg-muted text-muted-foreground text-xs px-2 py-1 rounded-full">
                Bob shared a file
              </span>
            </div>

            <div className="flex gap-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback>BO</AvatarFallback>
              </Avatar>
              <div className="border p-3 rounded-lg rounded-tl-none text-sm max-w-[80%] bg-card">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-blue-100 dark:bg-blue-900/20 rounded flex items-center justify-center">
                    <FileText className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">Calculus_Solutions.pdf</p>
                    <p className="text-xs text-muted-foreground">2.4 MB • PDF</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>

        <div className="p-4 border-t mt-auto">
          <div className="flex gap-2">
            <Button variant="ghost" size="icon"><Plus className="h-4 w-4" /></Button>
            <Input placeholder="Type a message..." />
            <Button size="icon"><MessageSquare className="h-4 w-4" /></Button>
          </div>
        </div>
      </Card>
      
      {/* Right: Shared Resources (Feature 10) */}
      {/* This section is integrated into the grid but hidden on smaller screens if needed */}
      {/* For this layout I put it in the same grid row if space allows, or handle it via tabs in parent */}
    </div>
  )
}

export function SharedResourcesList() {
    return (
        <div className="space-y-4">
            <h3 className="font-semibold text-lg flex items-center gap-2">
                <Share2 className="h-5 w-5" /> Shared Repository
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {MOCK_RESOURCES.map(res => (
                    <Card key={res.id}>
                        <CardContent className="p-4 flex items-start justify-between">
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-muted rounded-lg">
                                    <FileText className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="font-medium text-sm">{res.title}</p>
                                    <p className="text-xs text-muted-foreground">Shared by {res.author} • {res.type}</p>
                                </div>
                            </div>
                            <Button variant="ghost" size="sm" className="h-8 gap-1 text-muted-foreground">
                                <Star className="h-3 w-3" /> {res.likes}
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
