'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Info, Target, Users, Zap } from 'lucide-react';

export function PrototypeInfo() {
  return (
    <div className="w-full max-w-4xl mx-auto space-y-4 pb-8">
      <Card className="p-6 bg-linear-to-br from-primary/5 to-primary/10 border-primary/20">
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Info className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 space-y-2">
              <h3 className="font-semibold text-foreground">
                HCI Research Prototype
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                This tool is part of ongoing research in AI-powered educational technology. 
                It focuses on making complex academic concepts accessible through structured, 
                visual, step-by-step explanations.
              </p>
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-4 pt-2">
            <div className="flex items-start gap-2">
              <Target className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-foreground">Research Goal</p>
                <p className="text-xs text-muted-foreground">
                  Deeper conceptual understanding
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Users className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-foreground">Target Users</p>
                <p className="text-xs text-muted-foreground">
                  High school & college students
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Zap className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-foreground">Key Feature</p>
                <p className="text-xs text-muted-foreground">
                  Visual + step-by-step learning
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-2 border-t border-border/50">
            <Badge variant="outline" className="text-xs">
              HCI Research
            </Badge>
            <Badge variant="outline" className="text-xs">
              Educational AI
            </Badge>
            <Badge variant="outline" className="text-xs">
              Prototype v1.0
            </Badge>
          </div>
        </div>
      </Card>
    </div>
  );
}
