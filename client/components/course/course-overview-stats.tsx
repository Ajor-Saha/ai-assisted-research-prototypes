'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { BookOpen, FileText, BrainCircuit, Loader2 } from "lucide-react"

import { getCourseMaterials } from '@/services/material-service';
import { getCourseTopics } from '@/services/topic-service';
import { getGeneratedExams } from '@/services/generated-exam-service';
import { getExamPatterns } from '@/services/exam-pattern-service';

export function CourseOverviewStats({ courseId }: { courseId: string }) {
  const [stats, setStats] = useState({
    materials: 0,
    topics: 0,
    totalExams: 0,
    examsByCategory: {} as Record<string, number>
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        setLoading(true);
        const [materials, topics, exams, patterns] = await Promise.all([
          getCourseMaterials(courseId),
          getCourseTopics(courseId),
          getGeneratedExams({ courseId }),
          getExamPatterns()
        ]);
        
        // Map pattern details to get readable names
        const patternMap = patterns.reduce((acc, curr) => {
          acc[curr.examPatternId] = curr.name;
          return acc;
        }, {} as Record<string, string>);

        // Group exams by their category/pattern name
        const examsByCategory: Record<string, number> = {};
        exams.forEach(exam => {
          const categoryName = patternMap[exam.examPatternId] || 'Uncategorized';
          examsByCategory[categoryName] = (examsByCategory[categoryName] || 0) + 1;
        });

        setStats({
          materials: materials.length,
          topics: topics.length,
          totalExams: exams.length,
          examsByCategory
        });
      } catch (error) {
        console.error("Failed to load course stats", error);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, [courseId]);

  if (loading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {/* Materials Stat */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Total Materials Uploaded
          </CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.materials}</div>
        </CardContent>
      </Card>
      
      {/* Topics Stat */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Total Topics Created
          </CardTitle>
          <BookOpen className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.topics}</div>
        </CardContent>
      </Card>

      {/* Exams Stat */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Total Exams Created
          </CardTitle>
          <BrainCircuit className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalExams}</div>
          {Object.entries(stats.examsByCategory).length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-xs text-muted-foreground font-medium uppercase">Exams by Category</p>
              {Object.entries(stats.examsByCategory).map(([category, count]) => (
                <div key={category} className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">{category}</span>
                  <span className="font-medium">{count}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}