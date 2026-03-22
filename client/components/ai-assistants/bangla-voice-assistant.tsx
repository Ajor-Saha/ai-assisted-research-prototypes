"use client"

import { useState, useEffect } from "react"
import { Mic, MicOff, Volume2, Globe } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export function BanglaVoiceAssistant() {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [response, setResponse] = useState("")
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [language, setLanguage] = useState<"bn" | "en">("bn")

  // Mock voice recognition
  useEffect(() => {
    let timeout: NodeJS.Timeout

    if (isListening) {
      timeout = setTimeout(() => {
        setIsListening(false)
        const mockInput = language === "bn" 
          ? "লিনিয়ার অ্যালজেব্রা এর মূল ধারণা কি?" 
          : "What are the core concepts of Linear Algebra?"
        setTranscript(mockInput)
        
        // Generate mock response
        setTimeout(() => {
            const mockResponse = language === "bn"
            ? "লিনিয়ার অ্যালজেব্রা মূলত ভেক্টর স্পেস এবং লিনিয়ার ট্রান্সফরমেশন নিয়ে কাজ করে। এটি ম্যাট্রিক্স অপারেশন এবং সমীকরণ সমাধানের জন্য অত্যন্ত গুরুত্বপূর্ণ।"
            : "Linear algebra primarily deals with vector spaces and linear transformations. It is crucial for matrix operations and solving equations."
            setResponse(mockResponse)
            handleSpeak(mockResponse)
        }, 1000)

      }, 3000)
    }

    return () => clearTimeout(timeout)
  }, [isListening, language])

  const handleSpeak = (text: string) => {
    setIsSpeaking(true)
    // Simulate speaking duration
    setTimeout(() => {
        setIsSpeaking(false)
    }, 4000)
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
            <Mic className="h-5 w-5 text-primary" />
            Voice Assistant (ভয়েস অ্যাসিস্ট্যান্ট)
            </CardTitle>
            <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setLanguage(l => l === "bn" ? "en" : "bn")}
                className="flex items-center gap-1"
            >
                <Globe className="h-3 w-3" />
                {language === "bn" ? "বাংলা" : "English"}
            </Button>
        </div>
        <CardDescription>
          Ask questions in Bangla or English using your voice
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="h-32 bg-muted/50 rounded-lg p-4 overflow-y-auto border border-dashed border-muted-foreground/20 flex flex-col items-center justify-center text-center">
            {transcript ? (
                <>
                    <p className="font-medium text-foreground/80 mb-2">"{transcript}"</p>
                    {response && (
                        <div className="bg-primary/10 p-3 rounded-lg text-primary text-sm mt-2 animate-in fade-in slide-in-from-bottom-2">
                            {response}
                        </div>
                    )}
                </>
            ) : (
                <p className="text-muted-foreground text-sm">
                    Tap the microphone to start speaking...
                </p>
            )}
        </div>
      </CardContent>
      <CardFooter className="justify-center gap-4">
        <Button
          size="lg"
          variant={isListening ? "destructive" : "default"}
          className={`rounded-full w-16 h-16 shadow-lg transition-all duration-300 ${isListening ? "animate-pulse scale-110" : "hover:scale-105"}`}
          onClick={() => setIsListening(!isListening)}
        >
          {isListening ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
        </Button>
        {response && (
             <Button
             size="icon"
             variant="outline"
             className={`rounded-full w-12 h-12 ${isSpeaking ? "bg-primary text-primary-foreground" : ""}`}
             onClick={() => handleSpeak(response)}
           >
             <Volume2 className={`h-5 w-5 ${isSpeaking ? "animate-pulse" : ""}`} />
           </Button>
        )}
      </CardFooter>
    </Card>
  )
}
