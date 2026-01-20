import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Sparkles } from 'lucide-react';

export function LoadingState() {
  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="flex items-center justify-center gap-3">
          <div className="p-3 bg-primary/10 rounded-full animate-pulse">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
        </div>
        <h2 className="text-2xl md:text-3xl font-bold text-foreground">
          Generating Your Explanation...
        </h2>
        <p className="text-muted-foreground">
          Breaking down the concept into clear, understandable steps
        </p>
      </div>

      {/* Loading Progress */}
      <Card className="p-6 md:p-8">
        <div className="space-y-6">
          {/* Step indicators skeleton */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-10 w-24 rounded-full shrink-0" />
            ))}
          </div>

          {/* Content skeleton */}
          <div className="space-y-4">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            
            <div className="pt-4">
              <Skeleton className="h-48 w-full rounded-lg" />
            </div>

            <div className="space-y-2 pt-4">
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-3/4" />
            </div>
          </div>
        </div>
      </Card>

      {/* Loading steps */}
      <div className="flex items-center justify-center">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="flex gap-1">
            <div className="h-2 w-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="h-2 w-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="h-2 w-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
          <span>Analyzing concept and creating visual explanations</span>
        </div>
      </div>
    </div>
  );
}
