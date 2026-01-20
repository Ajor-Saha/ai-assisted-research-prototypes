'use client';

import { useState } from 'react';
import { TextbookUpload, UploadedTextbook, UploadedPage } from '@/components/textbook-upload';
import { MedicalChatInterface } from '@/components/medical-chat-interface';
import { Stethoscope, BookMarked, AlertTriangle } from 'lucide-react';

// Mock data generator - in a real app, this would call an AI API with medical textbook RAG
function generateMedicalAnswer(question: string, languageMode: 'technical' | 'simplified', textbooks: UploadedTextbook[], pages: UploadedPage[]) {
  const sources = [...textbooks, ...pages];
  
  // Technical vs Simplified content
  const technicalContent = `The cardiovascular system consists of the heart, blood vessels, and blood. The heart functions as a muscular pump with four chambers: two atria (upper chambers) and two ventricles (lower chambers).

The cardiac cycle involves systole (contraction) and diastole (relaxation). During ventricular systole, the ventricles contract, forcing blood into the pulmonary artery and aorta. During diastole, the chambers relax and fill with blood. The sinoatrial (SA) node acts as the natural pacemaker, initiating electrical impulses that coordinate cardiac contractions.

Blood flow follows this path: deoxygenated blood enters the right atrium via superior and inferior vena cava → right ventricle → pulmonary arteries → lungs (gas exchange) → pulmonary veins → left atrium → left ventricle → aorta → systemic circulation.`;

  const simplifiedContent = `The heart is like a pump that moves blood throughout your body. It has four main rooms called chambers - two on top (atria) and two on bottom (ventricles).

The heart beats in a rhythm: first it squeezes (contracts) to push blood out, then it relaxes to fill back up with blood. A special area called the SA node acts like a timer, telling the heart when to beat.

Blood travels in a circle through your body: Used blood (low in oxygen) comes back to the heart → goes to the lungs to get fresh oxygen → returns to the heart → gets pumped out to the whole body to deliver oxygen.`;

  const mockAnswer = {
    content: languageMode === 'technical' ? technicalContent : simplifiedContent,
    references: sources.slice(0, Math.min(2, sources.length)).map((source, idx) => ({
      textbookId: 'id' in source ? source.id : undefined,
      textbookName: source.name,
      pageNumber: 'pageCount' in source ? Math.floor(Math.random() * (source.pageCount || 100)) + 1 : (source as UploadedPage).pageNumber || 1,
      excerpt: languageMode === 'technical' 
        ? "The myocardium is composed of specialized cardiac muscle tissue that exhibits unique properties of automaticity, rhythmicity, and conductivity. The coronary circulation provides the metabolic requirements of the cardiac tissue through the right and left coronary arteries."
        : "The heart muscle is made of special tissue that can contract rhythmically on its own. Blood vessels called coronary arteries bring oxygen and nutrients to the heart muscle to keep it working properly.",
      hasImage: idx === 0,
      imageDescription: idx === 0 ? "Detailed anatomical diagram showing the four chambers of the heart, major blood vessels (aorta, vena cava, pulmonary arteries and veins), and the direction of blood flow indicated by arrows." : undefined,
    })),
    summary: languageMode === 'technical'
      ? "The cardiovascular system operates through coordinated mechanical and electrical mechanisms. Understanding cardiac anatomy, the cardiac cycle, and hemodynamic principles is essential for comprehending cardiovascular physiology and pathophysiology."
      : "The heart is a powerful pump that keeps blood flowing through your body. Learning how it works helps you understand how to keep it healthy and what can go wrong with it.",
    technicalLevel: languageMode,
    medicalTerms: languageMode === 'technical' ? [
      { term: "Systole", definition: "The phase of the cardiac cycle when the heart muscle contracts and pumps blood" },
      { term: "Diastole", definition: "The phase of the cardiac cycle when the heart muscle relaxes and chambers fill with blood" },
      { term: "Sinoatrial (SA) Node", definition: "The natural pacemaker of the heart located in the right atrium that initiates electrical impulses" },
      { term: "Hemodynamics", definition: "The study of blood flow and the forces involved in circulation" },
    ] : undefined,
  };

  return mockAnswer;
}

export default function Home() {
  const [textbooks, setTextbooks] = useState<UploadedTextbook[]>([]);
  const [pages, setPages] = useState<UploadedPage[]>([]);

  const handleAskQuestion = async (question: string, languageMode: 'technical' | 'simplified') => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const answer = generateMedicalAnswer(question, languageMode, textbooks, pages);
    return answer;
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-background via-background to-blue-500/5 flex flex-col">
      {/* Header */}
      <div className="border-b border-border/40 bg-background/95 backdrop-blur sticky top-0 z-20">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Stethoscope className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Medical Study Assistant</h1>
                <p className="text-xs text-muted-foreground">Textbook-based learning for medical students</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {(textbooks.length > 0 || pages.length > 0) && (
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 rounded-full">
                  <BookMarked className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                  <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                    {textbooks.length} book{textbooks.length !== 1 ? 's' : ''}, {pages.length} page{pages.length !== 1 ? 's' : ''}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="bg-amber-500/10 border-b border-amber-500/20">
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center justify-center gap-2 text-xs text-amber-700 dark:text-amber-300">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            <p>
              <span className="font-semibold">Educational Use Only:</span> This tool supports learning and does not replace professional medical advice or clinical judgment.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Textbook Upload Sidebar - Fixed Left */}
        <div className="w-80 shrink-0 border-r border-border/40 bg-background/50 overflow-y-auto">
          <div className="p-4">
            <TextbookUpload 
              textbooks={textbooks}
              pages={pages}
              onTextbooksChange={setTextbooks}
              onPagesChange={setPages}
            />
          </div>
        </div>

        {/* Chat Interface - Remaining Area */}
        <div className="flex-1">
          <MedicalChatInterface 
            textbooks={textbooks}
            pages={pages}
            onAskQuestion={handleAskQuestion}
          />
        </div>
      </div>

      {/* Footer Info */}
      <div className="border-t border-border/40 bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 py-3">
          <p className="text-xs text-center text-muted-foreground">
            HCI Research Prototype • Textbook-Only Answering • Medical Education Support • Accuracy-Focused
          </p>
        </div>
      </div>
    </div>
  );
}
