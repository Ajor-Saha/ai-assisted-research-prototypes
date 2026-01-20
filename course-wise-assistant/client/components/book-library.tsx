"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Book, Filter, Star, Lock, BookOpen } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"

const MOCK_BOOKS = [
  {
    id: 1,
    title: "Linear Algebra Done Right",
    author: "Sheldon Axler",
    edition: "3rd Edition",
    difficulty: "Intermediate",
    rating: 4.8,
    type: "Textbook",
    access: "free", // or premium
    cover: "bg-blue-200"
  },
  {
    id: 2,
    title: "Introduction to Linear Algebra",
    author: "Gilbert Strang",
    edition: "5th Edition",
    difficulty: "Beginner",
    rating: 4.9,
    type: "Textbook",
    access: "premium",
    cover: "bg-green-200"
  },
  {
    id: 3,
    title: "Matrix Analysis",
    author: "Horn & Johnson",
    edition: "2nd Edition",
    difficulty: "Advanced",
    rating: 4.5,
    type: "Reference",
    access: "premium",
    cover: "bg-purple-200"
  },
  {
    id: 4,
    title: "Elementary Linear Algebra",
    author: "Anton",
    edition: "11th Edition",
    difficulty: "Beginner",
    rating: 4.2,
    type: "Textbook",
    access: "free",
    cover: "bg-yellow-200"
  }
]

export function BookLibrary() {
  const [searchQuery, setSearchQuery] = useState("")

  const filteredBooks = MOCK_BOOKS.filter(book => 
    book.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    book.author.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Intelligent Library</h2>
          <p className="text-muted-foreground">Find textbooks, reference materials, and notes powered by AI search.</p>
        </div>
        
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by title, author, topic..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="outline">
            <Filter className="mr-2 h-4 w-4" /> Filters
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredBooks.map((book) => (
          <Card key={book.id} className="overflow-hidden group hover:shadow-md transition-shadow">
            <div className={`h-32 ${book.cover} flex items-center justify-center relative`}>
              <Book className="h-12 w-12 text-foreground/20" />
              {book.access === "premium" && (
                <Badge className="absolute top-2 right-2 bg-yellow-500 hover:bg-yellow-600 text-white border-none gap-1">
                  <Lock className="h-3 w-3" /> Premium
                </Badge>
              )}
            </div>
            <CardHeader className="p-4 pb-2">
              <div className="flex justify-between items-start">
                <Badge variant="outline" className="mb-2">{book.difficulty}</Badge>
                <div className="flex items-center gap-1 text-sm text-yellow-500">
                  <Star className="h-3 w-3 fill-current" /> {book.rating}
                </div>
              </div>
              <CardTitle className="text-lg line-clamp-1">{book.title}</CardTitle>
              <CardDescription className="line-clamp-1">{book.author} • {book.edition}</CardDescription>
            </CardHeader>
            <CardFooter className="p-4 pt-0">
              <Button className="w-full" variant={book.access === "premium" ? "secondary" : "default"}>
                {book.access === "premium" ? "Unlock Access" : "Read Now"}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6 mt-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Publisher Partners
            </h3>
            <p className="text-sm text-muted-foreground">
              Access licensed content from top educational publishers with our Premium subscription.
            </p>
          </div>
          <div className="flex gap-4 opacity-50 grayscale hover:grayscale-0 transition-all">
            <div className="h-8 w-24 bg-muted rounded animate-pulse" />
            <div className="h-8 w-24 bg-muted rounded animate-pulse" />
            <div className="h-8 w-24 bg-muted rounded animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  )
}
