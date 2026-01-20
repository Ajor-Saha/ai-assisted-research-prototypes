"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check, Zap, Crown, GraduationCap } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface SubscriptionModalProps {
    open?: boolean
    onOpenChange?: (open: boolean) => void
}

export function SubscriptionModal({ open, onOpenChange }: SubscriptionModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] p-0 overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2">
          <div className="p-6 bg-muted/30 flex flex-col justify-center">
            <div className="mb-6">
              <Badge className="mb-2 bg-yellow-500 hover:bg-yellow-600">Premium Access</Badge>
              <h2 className="text-3xl font-bold tracking-tight mb-2">Upgrade your learning</h2>
              <p className="text-muted-foreground">Get unlimited access to advanced AI features and premium content.</p>
            </div>
            
            <div className="space-y-4">
              {[
                "Unlimited AI Chat & Explanations",
                "Full Textbook Library Access",
                "Advanced Exam Predictor & Analytics",
                "Handwritten Notes OCR Analysis",
                "Verified Expert Solutions"
              ].map((feature, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
                    <Check className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                  </div>
                  <span className="text-sm font-medium">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-6 flex flex-col gap-4 justify-center border-l">
            <Card className="border-2 border-primary relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-bl">
                Best Value
              </div>
              <CardHeader className="pb-2">
                <CardTitle className="flex justify-between items-center">
                  Semester Pass
                  <span className="text-2xl font-bold">$12<span className="text-sm font-normal text-muted-foreground">/mo</span></span>
                </CardTitle>
                <CardDescription>Billed $48 per semester</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" size="lg">Start Free Trial</Button>
              </CardContent>
            </Card>

            <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
              <CardHeader className="pb-2">
                <CardTitle className="flex justify-between items-center">
                  Monthly
                  <span className="text-2xl font-bold">$15<span className="text-sm font-normal text-muted-foreground">/mo</span></span>
                </CardTitle>
                <CardDescription>Cancel anytime</CardDescription>
              </CardHeader>
            </Card>

            <p className="text-xs text-center text-muted-foreground mt-4">
              Institutional pricing available for universities. <a href="#" className="underline">Learn more</a>
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
