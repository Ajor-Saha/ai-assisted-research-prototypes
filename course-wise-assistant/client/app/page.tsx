import Link from "next/link";
import { ArrowRight, BookOpen, Brain, Calendar, FolderTree, Sparkles, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-blue-950">
      {/* Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <BookOpen className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="text-xl font-bold text-foreground">CourseWise</span>
          </div>
          <Link href="/dashboard">
            <Button variant="outline">Dashboard</Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-20 md:py-32">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-sm font-medium text-blue-700 dark:text-blue-300">
            <Sparkles className="h-4 w-4" />
            AI-Powered Course Management
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-foreground">
            Course-wise Personalized
            <br />
            <span className="text-blue-600 dark:text-blue-400">Study Assistant</span>
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Your intelligent learning companion that organizes course materials, maintains chat histories, 
            and creates personalized study paths based on your learning needs and exam timelines.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            <Link href="/dashboard">
              <Button size="lg" className="text-lg px-8 h-14 gap-2">
                Get Started
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="text-lg px-8 h-14">
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-6 py-20 bg-background/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Reduce Academic Stress, Improve Study Efficiency
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need to stay organized and excel in your courses
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="p-6 space-y-4 hover:shadow-lg transition-shadow">
              <div className="p-3 bg-blue-500/10 rounded-lg w-fit">
                <FolderTree className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold text-foreground">Course Organization</h3>
              <p className="text-muted-foreground">
                Upload and organize all materials for each course in dedicated spaces. Keep lecture notes, 
                assignments, and resources perfectly structured.
              </p>
            </Card>

            <Card className="p-6 space-y-4 hover:shadow-lg transition-shadow">
              <div className="p-3 bg-purple-500/10 rounded-lg w-fit">
                <Brain className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold text-foreground">Smart Chat History</h3>
              <p className="text-muted-foreground">
                Maintain course-specific conversation histories. Return to previous discussions and build 
                on your learning journey throughout the semester.
              </p>
            </Card>

            <Card className="p-6 space-y-4 hover:shadow-lg transition-shadow">
              <div className="p-3 bg-green-500/10 rounded-lg w-fit">
                <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-xl font-semibold text-foreground">Personalized Study Paths</h3>
              <p className="text-muted-foreground">
                Get AI-generated study recommendations tailored to your learning style, course difficulty, 
                and upcoming exam schedules.
              </p>
            </Card>

            <Card className="p-6 space-y-4 hover:shadow-lg transition-shadow">
              <div className="p-3 bg-amber-500/10 rounded-lg w-fit">
                <Calendar className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
              <h3 className="text-xl font-semibold text-foreground">Exam Timeline Integration</h3>
              <p className="text-muted-foreground">
                Sync your exam dates and receive time-sensitive study plans. Stay ahead with intelligent 
                reminders and progress tracking.
              </p>
            </Card>

            <Card className="p-6 space-y-4 hover:shadow-lg transition-shadow">
              <div className="p-3 bg-rose-500/10 rounded-lg w-fit">
                <BookOpen className="h-6 w-6 text-rose-600 dark:text-rose-400" />
              </div>
              <h3 className="text-xl font-semibold text-foreground">Long-term Organization</h3>
              <p className="text-muted-foreground">
                Build a comprehensive knowledge base across semesters. Access all course materials and 
                conversations whenever you need them.
              </p>
            </Card>

            <Card className="p-6 space-y-4 hover:shadow-lg transition-shadow">
              <div className="p-3 bg-cyan-500/10 rounded-lg w-fit">
                <Sparkles className="h-6 w-6 text-cyan-600 dark:text-cyan-400" />
              </div>
              <h3 className="text-xl font-semibold text-foreground">AI-Powered Insights</h3>
              <p className="text-muted-foreground">
                Leverage artificial intelligence to identify knowledge gaps, suggest review topics, 
                and optimize your study sessions for maximum retention.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-6 py-20">
        <div className="max-w-4xl mx-auto bg-linear-to-br from-blue-500 to-indigo-600 rounded-2xl p-12 text-center text-white shadow-xl">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Transform Your Learning?
          </h2>
          <p className="text-lg mb-8 text-blue-50">
            Join students who are reducing stress and improving their academic performance with CourseWise.
          </p>
          <Link href="/dashboard">
            <Button size="lg" variant="secondary" className="text-lg px-8 h-14 gap-2">
              Start Organizing Your Courses
              <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <span className="font-semibold text-foreground">CourseWise</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2026 CourseWise. Your personalized study companion.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}