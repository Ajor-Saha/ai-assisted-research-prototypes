'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Sparkles, 
  BookOpenCheck, 
  GraduationCap,
  Lightbulb,
  TrendingUp
} from 'lucide-react';

interface TopicInputProps {
  onSubmit: (topic: string, difficulty: string, subject: string) => void;
  isLoading?: boolean;
}

const subjects = [
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
  'Computer Science',
  'History',
  'Literature',
  'Economics',
  'Psychology',
  'Other'
];

const exampleTopics = [
  { topic: 'Explain photosynthesis step by step', subject: 'Biology', difficulty: 'Intermediate' },
  { topic: 'How does calculus work?', subject: 'Mathematics', difficulty: 'Advanced' },
  { topic: 'What is Newton\'s First Law?', subject: 'Physics', difficulty: 'Beginner' },
  { topic: 'How does machine learning work?', subject: 'Computer Science', difficulty: 'Intermediate' },
];

export function TopicInput({ onSubmit, isLoading = false }: TopicInputProps) {
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState('Intermediate');
  const [subject, setSubject] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (topic.trim() && subject) {
      onSubmit(topic.trim(), difficulty, subject);
    }
  };

  const handleExampleClick = (example: typeof exampleTopics[0]) => {
    setTopic(example.topic);
    setSubject(example.subject);
    setDifficulty(example.difficulty);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="flex items-center justify-center gap-3">
          <div className="p-3 bg-primary/10 rounded-full">
            <GraduationCap className="h-8 w-8 text-primary" />
          </div>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-foreground">
          AI-Powered Concept Explainer
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Break down complex academic concepts into easy-to-understand, step-by-step explanations
          with visual aids and interactive learning.
        </p>
      </div>

      {/* Main Input Card */}
      <Card className="p-6 md:p-8 shadow-lg">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Topic Input */}
          <div className="space-y-2">
            <Label htmlFor="topic" className="text-base font-semibold flex items-center gap-2">
              <BookOpenCheck className="h-4 w-4 text-primary" />
              What concept would you like to understand?
            </Label>
            <Textarea
              id="topic"
              placeholder="e.g., Explain how photosynthesis works, What is quantum entanglement?, How does DNA replication occur?"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="min-h-24 text-base resize-none"
              disabled={isLoading}
            />
          </div>

          {/* Selection Row */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* Subject Selection */}
            <div className="space-y-2">
              <Label htmlFor="subject" className="text-sm font-medium">
                Subject Area
              </Label>
              <Select value={subject} onValueChange={setSubject} disabled={isLoading}>
                <SelectTrigger id="subject">
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((subj) => (
                    <SelectItem key={subj} value={subj}>
                      {subj}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Difficulty Selection */}
            <div className="space-y-2">
              <Label htmlFor="difficulty" className="text-sm font-medium">
                Difficulty Level
              </Label>
              <Select value={difficulty} onValueChange={setDifficulty} disabled={isLoading}>
                <SelectTrigger id="difficulty">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Beginner">Beginner</SelectItem>
                  <SelectItem value="Intermediate">Intermediate</SelectItem>
                  <SelectItem value="Advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            size="lg"
            className="w-full text-base"
            disabled={!topic.trim() || !subject || isLoading}
          >
            {isLoading ? (
              <>
                <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Generating Explanation...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Step-by-Step Explanation
              </>
            )}
          </Button>
        </form>
      </Card>

      {/* Example Topics */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Lightbulb className="h-4 w-4" />
          <span>Try these example topics:</span>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          {exampleTopics.map((example, idx) => (
            <button
              key={idx}
              onClick={() => handleExampleClick(example)}
              disabled={isLoading}
              className="group text-left p-4 rounded-lg border border-border bg-card hover:bg-accent hover:border-primary/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                  {example.topic}
                </p>
                <div className="flex gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {example.subject}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {example.difficulty}
                  </Badge>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Features */}
      <div className="grid sm:grid-cols-3 gap-4 pt-4">
        <Card className="p-4 bg-linear-to-br from-blue-500/5 to-blue-500/10 border-blue-500/20">
          <div className="space-y-2">
            <div className="p-2 bg-blue-500/10 rounded-lg w-fit">
              <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="font-semibold text-sm">Step-by-Step</h3>
            <p className="text-xs text-muted-foreground">
              Break complex topics into digestible steps
            </p>
          </div>
        </Card>
        <Card className="p-4 bg-linear-to-br from-purple-500/5 to-purple-500/10 border-purple-500/20">
          <div className="space-y-2">
            <div className="p-2 bg-purple-500/10 rounded-lg w-fit">
              <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="font-semibold text-sm">Visual Learning</h3>
            <p className="text-xs text-muted-foreground">
              Diagrams, graphs, and animations
            </p>
          </div>
        </Card>
        <Card className="p-4 bg-linear-to-br from-green-500/5 to-green-500/10 border-green-500/20">
          <div className="space-y-2">
            <div className="p-2 bg-green-500/10 rounded-lg w-fit">
              <BookOpenCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="font-semibold text-sm">Deep Understanding</h3>
            <p className="text-xs text-muted-foreground">
              Focus on concepts, not memorization
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
