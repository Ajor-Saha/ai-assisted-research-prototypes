'use client';

import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sigma } from 'lucide-react';

const SYMBOL_CATEGORIES = {
  basic: {
    label: "Basic",
    symbols: ["+", "-", "×", "÷", "=", "≠", "≈", "±", "∞", "π", "°", "√", "∛"]
  },
  algebra: {
    label: "Algebra",
    symbols: ["²", "³", "⁴", "ⁿ", "½", "⅓", "¼", "∑", "∏", "log", "ln"]
  },
  calculus: {
    label: "Calculus",
    symbols: ["∫", "∬", "∭", "∮", "∂", "∆", "∇", "′", "″", "lim", "→"]
  },
  greek: {
    label: "Greek",
    symbols: ["α", "β", "γ", "θ", "λ", "μ", "σ", "φ", "Ω", "ε", "δ", "ρ", "τ", "ω"]
  },
  sets: {
    label: "Sets",
    symbols: ["∈", "∉", "∪", "∩", "⊂", "⊃", "∀", "∃", "∅", "ℝ", "ℕ", "ℤ", "ℚ"]
  },
  subscripts: {
    label: "Sub",
    symbols: ["₀", "₁", "₂", "₃", "₄", "₅", "₆", "₇", "₈", "₉", "₍", "₎"]
  }
};

interface MathSymbolPickerProps {
  onSymbolSelect: (symbol: string) => void;
}

export function MathSymbolPicker({ onSymbolSelect }: MathSymbolPickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon"
          className="h-9 w-9 text-muted-foreground hover:text-foreground"
          title="Insert Math Symbol"
        >
          <Sigma className="h-5 w-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start" side="top">
        <Tabs defaultValue="basic" className="w-full">
          <div className="border-b overflow-x-auto">
            <TabsList className="h-auto w-full justify-start rounded-none bg-transparent p-0 inline-flex">
              {Object.entries(SYMBOL_CATEGORIES).map(([key, category]) => (
                <TabsTrigger
                  key={key}
                  value={key}
                  className="relative h-10 rounded-none border-b-2 border-transparent bg-transparent px-4 pb-3 pt-2 font-semibold text-muted-foreground shadow-none transition-none data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none hover:text-foreground whitespace-nowrap"
                >
                  {category.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
          
          <div className="p-4">
            {Object.entries(SYMBOL_CATEGORIES).map(([key, category]) => (
              <TabsContent key={key} value={key} className="mt-0">
                <div className="grid grid-cols-6 gap-2">
                  {category.symbols.map((symbol) => (
                    <Button
                      key={symbol}
                      variant="outline"
                      className="h-10 w-10 p-0 font-serif text-lg hover:bg-accent hover:text-accent-foreground"
                      onClick={() => onSymbolSelect(symbol)}
                    >
                      {symbol}
                    </Button>
                  ))}
                </div>
              </TabsContent>
            ))}
          </div>
        </Tabs>
      </PopoverContent>
    </Popover>
  );
}
