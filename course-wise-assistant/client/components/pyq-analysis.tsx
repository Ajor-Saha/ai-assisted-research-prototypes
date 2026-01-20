"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from "recharts"
import { FileText, TrendingUp, AlertTriangle, Search, BrainCircuit, Download } from "lucide-react"

// Mock Data for PYQ Analysis
const TOPIC_FREQUENCY = [
  { topic: "Vector Spaces", y2021: 15, y2022: 20, y2023: 18 },
  { topic: "Eigenvalues", y2021: 10, y2022: 12, y2023: 25 },
  { topic: "Linear Map", y2021: 20, y2022: 15, y2023: 10 },
  { topic: "Determinants", y2021: 5, y2022: 8, y2023: 5 },
]

const DIFFICULTY_TREND = [
  { year: "2019", difficulty: 60 },
  { year: "2020", difficulty: 65 },
  { year: "2021", difficulty: 75 },
  { year: "2022", difficulty: 70 },
  { year: "2023", difficulty: 85 },
]

const PREDICTED_TOPICS = [
  { topic: "Eigenvalues & Eigenvectors", probability: 95, reason: "High frequency in last 3 years" },
  { topic: "Diagonalization", probability: 85, reason: "Alternating year pattern detected" },
  { topic: "Inner Product Spaces", probability: 70, reason: "Trending upward in difficulty" },
]

export function PYQAnalysis() {
  const [activeYear, setActiveYear] = useState("all")

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Exam Intelligence</h2>
          <p className="text-muted-foreground">Previous Year Questions (PYQ) Analysis & Trend Prediction</p>
        </div>
        <Button>
          <Download className="mr-2 h-4 w-4" /> Download PYQ Report
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Topic Frequency Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart className="h-5 w-5 text-primary" />
              Topic Frequency (Last 3 Years)
            </CardTitle>
            <CardDescription>Which topics appear most often in exams?</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={TOPIC_FREQUENCY}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="topic" fontSize={12} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="y2021" name="2021" fill="#8884d8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="y2022" name="2022" fill="#82ca9d" radius={[4, 4, 0, 0]} />
                <Bar dataKey="y2023" name="2023" fill="#ffc658" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Difficulty Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Exam Difficulty Trend
            </CardTitle>
            <CardDescription>How the paper difficulty has changed over time</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={DIFFICULTY_TREND}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Line type="monotone" dataKey="difficulty" stroke="#ef4444" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* AI Predictions */}
      <Card className="border-primary/50 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BrainCircuit className="h-5 w-5 text-primary" />
            AI Exam Predictions (2024)
          </CardTitle>
          <CardDescription>High probability topics based on pattern recognition</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {PREDICTED_TOPICS.map((item, idx) => (
              <div key={idx} className="bg-background p-4 rounded-lg border shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold">{item.topic}</h4>
                    <Badge className={item.probability > 80 ? "bg-red-500" : "bg-yellow-500"}>
                      {item.probability}% Chance
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{item.reason}</p>
                </div>
                <div className="mt-4 pt-4 border-t">
                  <Button variant="outline" size="sm" className="w-full">
                    Practice Questions
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
