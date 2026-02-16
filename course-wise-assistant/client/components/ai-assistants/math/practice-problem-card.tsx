'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { CheckCircle2, XCircle, BrainCircuit, ArrowRight } from 'lucide-react';
import { PracticeProblem } from './math-chat-interface';

interface PracticeProblemCardProps {
  practiceProblem: PracticeProblem;
  onSolveRequest: (problem: string) => void;
}

export function PracticeProblemCard({ practiceProblem, onSolveRequest }: PracticeProblemCardProps) {
  const [userAnswer, setUserAnswer] = useState('');
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);

  const checkAnswer = () => {
    // Simple string comparison for now, but normalizing spaces
    const normalize = (str: string) => str.trim().toLowerCase().replace(/\s+/g, ' ');
    if (normalize(userAnswer) === normalize(practiceProblem.correctAnswer)) {
      setFeedback('correct');
    } else {
      setFeedback('incorrect');
    }
  };

  return (
    <Card className="mt-6 p-4 border-dashed border-primary/30 bg-primary/5">
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-primary font-semibold">
          <BrainCircuit className="h-5 w-5" />
          <h4>Practice Problem</h4>
        </div>
        
        <p className="text-sm font-medium leading-relaxed">{practiceProblem.problem}</p>
        
        <div className="flex gap-2">
          <Input 
            placeholder="Enter your answer..." 
            value={userAnswer}
            onChange={(e) => {
              setUserAnswer(e.target.value);
              setFeedback(null);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                checkAnswer();
              }
            }}
            className="flex-1 bg-background"
          />
          <Button onClick={checkAnswer} size="sm">
            Check
          </Button>
        </div>

        {feedback === 'correct' && (
          <div className="flex flex-col gap-2 p-3 bg-green-500/10 rounded-md border border-green-500/20 animate-in fade-in slide-in-from-top-1">
            <div className="flex items-center gap-2 text-green-700 dark:text-green-400 font-semibold">
              <CheckCircle2 className="h-4 w-4" />
              <span>Correct! Great job!</span>
            </div>
            <p className="text-xs text-green-700/80 dark:text-green-400/80 pl-6">
              You&apos;ve mastered this concept. Ready for the next challenge?
            </p>
          </div>
        )}

        {feedback === 'incorrect' && (
          <div className="flex items-center gap-2 text-destructive text-sm animate-in fade-in slide-in-from-top-1">
            <XCircle className="h-4 w-4" />
            <span>Not quite. Try again or ask AI to solve.</span>
          </div>
        )}

        <div className="pt-2 flex justify-end">
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-xs text-muted-foreground hover:text-primary"
            onClick={() => onSolveRequest(practiceProblem.problem)}
          >
            Ask AI to solve this <ArrowRight className="ml-1 h-3 w-3" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
