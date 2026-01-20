'use client';

import { MathChatInterface } from '@/components/math-chat-interface';
import { ThemeToggle } from '@/components/theme-toggle';
import { Calculator, Sparkles } from 'lucide-react';

interface Step {
  id: number;
  title: string;
  explanation: string;
  equation?: string;
  visualType?: 'graph' | 'diagram' | 'table';
  visualDescription?: string;
}

interface Solution {
  problem: string;
  steps: Step[];
  finalAnswer: string;
  methodology: string;
  keyInsights?: string[];
}

export default function MathSolverPage() {
  const generateSolution = async (problem: string, imageFile?: File): Promise<Solution> => {
    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Determine problem type and generate appropriate solution
    const lowerProblem = problem.toLowerCase();
    
    if (imageFile) {
      // Handle image upload - return generic solution
      return {
        problem: "Problem from uploaded image",
        steps: [
          {
            id: 1,
            title: "Extract problem from image",
            explanation: "I've analyzed the handwritten problem in your image. Let me solve it step by step.",
            visualType: 'diagram',
            visualDescription: "Image shows a mathematical equation or diagram"
          },
          {
            id: 2,
            title: "Solve the equation",
            explanation: "Based on the problem in the image, I'll apply the appropriate mathematical principles to find the solution.",
            equation: "x = solution_value"
          }
        ],
        finalAnswer: "Solution extracted from image",
        methodology: "Image Recognition + Mathematical Analysis",
        keyInsights: [
          "Image-based problems allow you to upload handwritten work",
          "The system can recognize mathematical notation and diagrams"
        ]
      };
    }

    // Quadratic equation solver
    if (lowerProblem.includes('x²') || lowerProblem.includes('x^2') || (lowerProblem.includes('solve') && lowerProblem.includes('='))) {
      return {
        problem: problem,
        steps: [
          {
            id: 1,
            title: "Identify the equation type",
            explanation: "This is a quadratic equation in the standard form ax² + bx + c = 0. We need to identify the coefficients a, b, and c.",
            equation: "2x² + 5x - 3 = 0  →  a = 2, b = 5, c = -3"
          },
          {
            id: 2,
            title: "Apply the Quadratic Formula",
            explanation: "We'll use the quadratic formula to find the roots: x = (-b ± √(b² - 4ac)) / (2a)",
            equation: "x = (-5 ± √(5² - 4(2)(-3))) / (2(2))"
          },
          {
            id: 3,
            title: "Calculate the Discriminant",
            explanation: "The discriminant (b² - 4ac) determines the nature of the roots. A positive discriminant means two real solutions.",
            equation: "Δ = 5² - 4(2)(-3) = 25 + 24 = 49",
            visualType: 'diagram',
            visualDescription: "Discriminant > 0 indicates two distinct real roots on the number line"
          },
          {
            id: 4,
            title: "Simplify the Expression",
            explanation: "Now we substitute the discriminant value and simplify:",
            equation: "x = (-5 ± √49) / 4 = (-5 ± 7) / 4"
          },
          {
            id: 5,
            title: "Find Both Solutions",
            explanation: "We get two solutions from the ± symbol:",
            equation: "x₁ = (-5 + 7) / 4 = 2/4 = 0.5\nx₂ = (-5 - 7) / 4 = -12/4 = -3"
          },
          {
            id: 6,
            title: "Graph the Parabola",
            explanation: "The parabola opens upward (a > 0) and crosses the x-axis at x = 0.5 and x = -3.",
            visualType: 'graph',
            visualDescription: "Parabola y = 2x² + 5x - 3 with vertex at (-1.25, -6.125), x-intercepts at x = 0.5 and x = -3"
          }
        ],
        finalAnswer: "x = 0.5 or x = -3",
        methodology: "Quadratic Formula",
        keyInsights: [
          "The discriminant (49) being positive confirms two distinct real solutions",
          "The coefficient 'a' being positive (2) means the parabola opens upward",
          "The vertex of the parabola is located at x = -b/(2a) = -5/4 = -1.25"
        ]
      };
    }

    // Derivative problems
    if (lowerProblem.includes('derivative') || lowerProblem.includes('differentiate') || lowerProblem.includes("f'")) {
      return {
        problem: problem,
        steps: [
          {
            id: 1,
            title: "Identify the Function",
            explanation: "We have a polynomial function that we need to differentiate using the power rule.",
            equation: "f(x) = x³ - 4x² + 6x - 2"
          },
          {
            id: 2,
            title: "Apply the Power Rule",
            explanation: "The power rule states: d/dx(xⁿ) = n·xⁿ⁻¹. We'll apply this to each term separately.",
            equation: "d/dx(x³) = 3x²\nd/dx(-4x²) = -8x\nd/dx(6x) = 6\nd/dx(-2) = 0"
          },
          {
            id: 3,
            title: "Combine the Terms",
            explanation: "Sum all the derivatives to get the final derivative function:",
            equation: "f'(x) = 3x² - 8x + 6"
          },
          {
            id: 4,
            title: "Visualize the Functions",
            explanation: "The original function (blue) and its derivative (red) show the relationship between position and rate of change.",
            visualType: 'graph',
            visualDescription: "Graph showing f(x) = x³ - 4x² + 6x - 2 and f'(x) = 3x² - 8x + 6, with critical points marked where f'(x) = 0"
          },
          {
            id: 5,
            title: "Find Critical Points",
            explanation: "Critical points occur where f'(x) = 0. Let's solve 3x² - 8x + 6 = 0:",
            equation: "x = (8 ± √(64 - 72)) / 6\nNo real solutions (Δ < 0)",
            visualType: 'diagram',
            visualDescription: "Number line showing the derivative is always positive, indicating f(x) is always increasing"
          }
        ],
        finalAnswer: "f'(x) = 3x² - 8x + 6",
        methodology: "Power Rule for Derivatives",
        keyInsights: [
          "The derivative gives us the instantaneous rate of change at any point",
          "Since f'(x) has no real roots, the original function has no local extrema",
          "The function f(x) is always increasing because f'(x) > 0 for all real x"
        ]
      };
    }

    // Integration/Area problems
    if (lowerProblem.includes('integral') || lowerProblem.includes('integrate') || lowerProblem.includes('area under')) {
      return {
        problem: problem,
        steps: [
          {
            id: 1,
            title: "Set Up the Definite Integral",
            explanation: "To find the area under the curve y = x² from x = 0 to x = 3, we need to evaluate the definite integral:",
            equation: "A = ∫₀³ x² dx"
          },
          {
            id: 2,
            title: "Find the Antiderivative",
            explanation: "Using the power rule for integration: ∫xⁿ dx = xⁿ⁺¹/(n+1) + C",
            equation: "∫ x² dx = x³/3 + C"
          },
          {
            id: 3,
            title: "Apply the Fundamental Theorem of Calculus",
            explanation: "Evaluate the antiderivative at the upper and lower bounds, then subtract:",
            equation: "A = [x³/3]₀³ = (3³/3) - (0³/3)"
          },
          {
            id: 4,
            title: "Calculate the Result",
            explanation: "Simplify the expression to find the exact area:",
            equation: "A = 27/3 - 0 = 9"
          },
          {
            id: 5,
            title: "Visualize the Area",
            explanation: "The shaded region represents the area under the parabola y = x² from x = 0 to x = 3.",
            visualType: 'graph',
            visualDescription: "Graph of y = x² with shaded area between x = 0 and x = 3, showing the region with area = 9 square units"
          }
        ],
        finalAnswer: "Area = 9 square units",
        methodology: "Definite Integration using the Fundamental Theorem of Calculus",
        keyInsights: [
          "The definite integral gives us the exact area under a curve",
          "For y = x², the area from 0 to a is a³/3",
          "The area represents accumulation - in this case, total space under the curve"
        ]
      };
    }

    // System of equations
    if (lowerProblem.includes('system') || (lowerProblem.includes('and') && lowerProblem.includes('='))) {
      return {
        problem: problem,
        steps: [
          {
            id: 1,
            title: "Write the System of Equations",
            explanation: "We have two linear equations with two unknowns (x and y):",
            equation: "2x + 3y = 12\n4x - y = 5"
          },
          {
            id: 2,
            title: "Choose a Method",
            explanation: "We'll use the elimination method. First, multiply the second equation by 3 to eliminate y:",
            equation: "2x + 3y = 12\n12x - 3y = 15"
          },
          {
            id: 3,
            title: "Add the Equations",
            explanation: "Adding both equations eliminates y and gives us an equation in x only:",
            equation: "(2x + 3y) + (12x - 3y) = 12 + 15\n14x = 27"
          },
          {
            id: 4,
            title: "Solve for x",
            explanation: "Divide both sides by 14:",
            equation: "x = 27/14 ≈ 1.93"
          },
          {
            id: 5,
            title: "Substitute to Find y",
            explanation: "Plug x back into the first original equation:",
            equation: "2(27/14) + 3y = 12\n54/14 + 3y = 12\n3y = 12 - 54/14 = 114/14\ny = 38/14 = 19/7 ≈ 2.71"
          },
          {
            id: 6,
            title: "Graph the Solution",
            explanation: "The solution is the point where both lines intersect:",
            visualType: 'graph',
            visualDescription: "Two lines intersecting at point (27/14, 19/7) ≈ (1.93, 2.71)"
          }
        ],
        finalAnswer: "x = 27/14, y = 19/7 (or x ≈ 1.93, y ≈ 2.71)",
        methodology: "Elimination Method for Linear Systems",
        keyInsights: [
          "The solution represents the intersection point of two lines",
          "Elimination works well when coefficients can be easily matched",
          "Always verify by substituting back into both original equations"
        ]
      };
    }

    // Generic/fallback solution
    return {
      problem: problem,
      steps: [
        {
          id: 1,
          title: "Understand the Problem",
          explanation: "First, let's identify what we're being asked to find and what information we have.",
          equation: "Given: " + problem
        },
        {
          id: 2,
          title: "Choose the Right Method",
          explanation: "Based on the problem type, we'll select the most appropriate mathematical technique or formula.",
          visualType: 'diagram',
          visualDescription: "Decision tree showing problem type classification and method selection"
        },
        {
          id: 3,
          title: "Apply Mathematical Principles",
          explanation: "We'll systematically apply the chosen method, showing all work clearly.",
          equation: "Mathematical operations and transformations..."
        },
        {
          id: 4,
          title: "Verify the Solution",
          explanation: "Let's check our answer by substituting back or using an alternative method.",
          visualType: 'table',
          visualDescription: "Verification table showing original values vs. calculated results"
        }
      ],
      finalAnswer: "Solution to: " + problem,
      methodology: "Step-by-Step Problem Solving",
      keyInsights: [
        "Breaking complex problems into smaller steps makes them manageable",
        "Visual representations help understand abstract concepts",
        "Always verify your solution to catch potential errors"
      ]
    };
  };

  return (
    <div className="flex flex-col h-screen w-full">
      {/* Header */}
      <header className="shrink-0 border-b border-border bg-background/95 backdrop-blur z-20">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <Calculator className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
                Math Problem Solver
                <Sparkles className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </h1>
              <p className="text-sm text-muted-foreground">
                Step-by-step solutions with visual representations
              </p>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden">
        <MathChatInterface onSolveProblem={generateSolution} />
      </main>
    </div>
  );
}

