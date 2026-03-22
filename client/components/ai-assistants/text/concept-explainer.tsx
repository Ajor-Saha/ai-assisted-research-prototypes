'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  BookOpen, 
  ChevronRight, 
  ChevronLeft, 
  Check, 
  Lightbulb,
  Brain,
  Eye,
  RefreshCcw,
  Keyboard
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface Step {
  id: number;
  title: string;
  content: string;
  visualType?: 'diagram' | 'graph' | 'animation' | 'example';
  keyPoints?: string[];
  relatedConcepts?: string[];
}

interface ConceptExplanation {
  topic: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  steps: Step[];
  summary: string;
}

interface ConceptExplainerProps {
  explanation: ConceptExplanation;
  onReset?: () => void;
}

export function ConceptExplainer({ explanation, onReset }: ConceptExplainerProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [showKeyPoints, setShowKeyPoints] = useState(true);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);

  const handleNextStep = useCallback(() => {
    if (currentStep < explanation.steps.length - 1) {
      if (!completedSteps.includes(currentStep)) {
        setCompletedSteps([...completedSteps, currentStep]);
      }
      setCurrentStep(currentStep + 1);
    }
  }, [currentStep, explanation.steps.length, completedSteps]);

  const handlePreviousStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep]);

  const handleStepClick = (stepIndex: number) => {
    setCurrentStep(stepIndex);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' && currentStep < explanation.steps.length - 1) {
        e.preventDefault();
        handleNextStep();
      } else if (e.key === 'ArrowLeft' && currentStep > 0) {
        e.preventDefault();
        handlePreviousStep();
      } else if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault();
        setShowKeyboardHelp(!showKeyboardHelp);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentStep, explanation.steps.length, showKeyboardHelp, handleNextStep, handlePreviousStep]);

  const progress = ((currentStep + 1) / explanation.steps.length) * 100;
  const currentStepData = explanation.steps[currentStep];

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'bg-green-500/10 text-green-700 dark:text-green-400';
      case 'Intermediate': return 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400';
      case 'Advanced': return 'bg-red-500/10 text-red-700 dark:text-red-400';
      default: return 'bg-gray-500/10 text-gray-700 dark:text-gray-400';
    }
  };

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-3">
              <Brain className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold text-foreground">{explanation.topic}</h1>
            </div>
            <Badge className={getDifficultyColor(explanation.difficulty)} variant="secondary">
              {explanation.difficulty}
            </Badge>
          </div>
          <div className="flex gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setShowKeyboardHelp(!showKeyboardHelp)}
                  >
                    <Keyboard className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Keyboard Shortcuts</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            {onReset && (
              <Button variant="outline" size="sm" onClick={onReset}>
                <RefreshCcw className="h-4 w-4 mr-2" />
                New Topic
              </Button>
            )}
          </div>
        </div>

        {/* Keyboard Help */}
        {showKeyboardHelp && (
          <Card className="p-4 bg-muted/50 border-dashed animate-in slide-in-from-top duration-300">
            <div className="space-y-2">
              <p className="text-sm font-semibold text-foreground">Keyboard Shortcuts:</p>
              <div className="grid sm:grid-cols-2 gap-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <kbd className="px-2 py-1 bg-background border rounded text-xs">←</kbd>
                  <span>Previous step</span>
                </div>
                <div className="flex items-center gap-2">
                  <kbd className="px-2 py-1 bg-background border rounded text-xs">→</kbd>
                  <span>Next step</span>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Step {currentStep + 1} of {explanation.steps.length}
            </span>
            <span className="font-medium text-foreground">
              {Math.round(progress)}% Complete
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </div>

      {/* Step Navigation Pills */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {explanation.steps.map((step, index) => (
          <button
            key={step.id}
            onClick={() => handleStepClick(index)}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap
              ${currentStep === index 
                ? 'bg-primary text-primary-foreground shadow-md' 
                : completedSteps.includes(index)
                ? 'bg-green-500/10 text-green-700 dark:text-green-400 hover:bg-green-500/20'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }
            `}
          >
            {completedSteps.includes(index) && index !== currentStep && (
              <Check className="h-3 w-3" />
            )}
            <span>Step {index + 1}</span>
          </button>
        ))}
      </div>

      {/* Main Content */}
      <Card className="p-6 md:p-8 transition-all duration-300">
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
          {/* Step Title */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-primary">
              <BookOpen className="h-5 w-5" />
              <span className="text-sm font-medium uppercase tracking-wide">
                Step {currentStep + 1}
              </span>
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-foreground">
              {currentStepData.title}
            </h2>
          </div>

          <Separator />

          {/* Step Content */}
          <div className="prose prose-sm md:prose-base max-w-none dark:prose-invert">
            <p className="text-foreground/90 leading-relaxed whitespace-pre-line">
              {currentStepData.content}
            </p>
          </div>

          {/* Visual Element Placeholder */}
          {currentStepData.visualType && (
            <div className="bg-linear-to-br from-primary/5 to-primary/10 rounded-lg p-8 border-2 border-dashed border-primary/20">
              <div className="flex flex-col items-center justify-center text-center space-y-3">
                <Eye className="h-12 w-12 text-primary/60" />
                <div className="space-y-1">
                  <p className="font-semibold text-foreground">
                    Visual: {currentStepData.visualType.charAt(0).toUpperCase() + currentStepData.visualType.slice(1)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Interactive visualization would appear here
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Key Points */}
          {currentStepData.keyPoints && currentStepData.keyPoints.length > 0 && (
            <div className="space-y-3">
              <button
                onClick={() => setShowKeyPoints(!showKeyPoints)}
                className="flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
              >
                <Lightbulb className="h-4 w-4" />
                Key Points to Remember
              </button>
              {showKeyPoints && (
                <ul className="space-y-2 ml-6">
                  {currentStepData.keyPoints.map((point, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-foreground/90">
                      <Check className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 shrink-0" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Related Concepts */}
          {currentStepData.relatedConcepts && currentStepData.relatedConcepts.length > 0 && (
            <div className="space-y-3 pt-4">
              <p className="text-sm font-semibold text-muted-foreground">Related Concepts:</p>
              <div className="flex flex-wrap gap-2">
                {currentStepData.relatedConcepts.map((concept, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs">
                    {concept}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between gap-4">
        <Button
          variant="outline"
          onClick={handlePreviousStep}
          disabled={currentStep === 0}
          size="lg"
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>

        <div className="text-center">
          {currentStep === explanation.steps.length - 1 && (
            <p className="text-sm text-muted-foreground">
              You&apos;ve reached the final step!
            </p>
          )}
        </div>

        <Button
          onClick={handleNextStep}
          disabled={currentStep === explanation.steps.length - 1}
          size="lg"
        >
          Next
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </div>

      {/* Summary (shown on last step) */}
      {currentStep === explanation.steps.length - 1 && (
        <Card className="p-6 bg-linear-to-br from-primary/5 to-primary/10 border-primary/20">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-primary">
              <Check className="h-5 w-5" />
              <h3 className="font-semibold text-lg">Summary</h3>
            </div>
            <p className="text-foreground/90 leading-relaxed">
              {explanation.summary}
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
