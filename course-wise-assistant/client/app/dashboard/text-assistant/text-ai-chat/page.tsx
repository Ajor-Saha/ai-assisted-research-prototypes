'use client';

import { ChatInterface } from '@/components/text-asist-comp/chat-interface';
import { ThemeToggle } from '@/components/theme-toggle';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

// Mock data generator - in a real app, this would call an AI API
function generateExplanation(topic: string) {
  // This is demo data - in production, you'd call your AI backend
  const photosynthesisExample = {
    topic: topic,
    steps: [
      {
        id: 1,
        title: 'Understanding the Basics',
        content: `Photosynthesis is the process by which plants, algae, and some bacteria convert light energy from the sun into chemical energy stored in glucose (sugar). This process is fundamental to life on Earth as it produces oxygen and serves as the primary source of energy for most living organisms.\n\nThe word "photosynthesis" comes from Greek: "photo" meaning light, and "synthesis" meaning putting together. Essentially, plants are using light to put together molecules.`,
        visualType: 'diagram' as const,
        keyPoints: [
          'Photosynthesis converts light energy into chemical energy',
          'Takes place primarily in plant leaves',
          'Produces oxygen as a byproduct',
          'Creates glucose (sugar) for plant energy'
        ],
        relatedConcepts: ['Cellular Respiration', 'Chloroplast', 'ATP Production']
      },
      {
        id: 2,
        title: 'The Chemical Equation',
        content: `The overall chemical equation for photosynthesis is:\n\n6CO₂ + 6H₂O + Light Energy → C₆H₁₂O₆ + 6O₂\n\nBreaking this down:\n• Carbon dioxide (CO₂) from the air\n• Water (H₂O) from the soil\n• Light energy from the sun\n\nThese combine to produce:\n• Glucose (C₆H₁₂O₆) for energy\n• Oxygen (O₂) released into the air\n\nThis equation shows that photosynthesis requires six molecules of carbon dioxide and six molecules of water to produce one molecule of glucose and six molecules of oxygen.`,
        visualType: 'graph' as const,
        keyPoints: [
          'Requires carbon dioxide, water, and light',
          'Produces glucose and oxygen',
          'The equation must be balanced',
          'Oxygen is released as a waste product'
        ],
        relatedConcepts: ['Chemical Reactions', 'Molecular Biology', 'Gas Exchange']
      },
      {
        id: 3,
        title: 'Light-Dependent Reactions',
        content: `The first stage of photosynthesis occurs in the thylakoid membranes of chloroplasts and requires light.\n\nKey processes:\n1. Light is absorbed by chlorophyll (the green pigment)\n2. Water molecules are split (photolysis), releasing oxygen\n3. Energy is captured and stored in molecules called ATP and NADPH\n4. These energy-carrying molecules will be used in the next stage\n\nThink of this stage as "charging batteries" - the plant is converting light energy into a form it can use later. The oxygen you breathe is actually a waste product from this stage!`,
        visualType: 'animation' as const,
        keyPoints: [
          'Takes place in thylakoid membranes',
          'Requires sunlight to occur',
          'Water is split, producing oxygen',
          'Creates energy carriers (ATP and NADPH)'
        ],
        relatedConcepts: ['Chlorophyll', 'Electron Transport Chain', 'Thylakoid']
      },
      {
        id: 4,
        title: 'Light-Independent Reactions (Calvin Cycle)',
        content: `The second stage occurs in the stroma of chloroplasts and does not directly require light (though it uses products from the light-dependent reactions).\n\nThe Calvin Cycle process:\n1. Carbon dioxide from the air is captured (carbon fixation)\n2. The energy from ATP and NADPH is used to convert CO₂ into glucose\n3. The cycle regenerates, ready to capture more carbon dioxide\n\nThis stage is like a factory assembly line - it takes the energy "batteries" from stage one and uses them to build glucose molecules from carbon dioxide. This glucose is what the plant uses for growth and energy, and what we get when we eat plants!`,
        visualType: 'diagram' as const,
        keyPoints: [
          'Takes place in the stroma',
          'Does not directly need light',
          'Uses ATP and NADPH from light reactions',
          'Converts CO₂ into glucose (sugar)'
        ],
        relatedConcepts: ['Carbon Fixation', 'Stroma', 'Glucose Production']
      },
      {
        id: 5,
        title: 'The Role of Chloroplasts',
        content: `Chloroplasts are the specialized organelles where photosynthesis occurs. Think of them as the "solar panels" of the plant cell.\n\nStructure and function:\n• Outer and inner membranes protect the chloroplast\n• Thylakoids are disc-shaped structures stacked in grana\n• Chlorophyll in thylakoids captures light energy\n• Stroma (the fluid) contains enzymes for the Calvin Cycle\n\nChloroplasts can move within the cell to optimize light capture. On bright days, they may move to avoid too much light, while on cloudy days, they position themselves to catch as much light as possible.`,
        visualType: 'example' as const,
        keyPoints: [
          'Chloroplasts are specialized organelles',
          'Contain thylakoids and stroma',
          'Chlorophyll gives plants their green color',
          'Can move within cells to optimize light'
        ],
        relatedConcepts: ['Cell Organelles', 'Plant Cell Structure', 'Chlorophyll']
      },
      {
        id: 6,
        title: 'Factors Affecting Photosynthesis',
        content: `Several environmental factors can speed up or slow down photosynthesis:\n\n1. Light Intensity\n   • More light = faster photosynthesis (up to a point)\n   • Too much light can damage chlorophyll\n\n2. Carbon Dioxide Concentration\n   • Higher CO₂ levels increase the rate\n   • Limited by other factors at high concentrations\n\n3. Temperature\n   • Enzymes work best at optimal temperatures (25-35°C)\n   • Too hot or cold slows down the process\n\n4. Water Availability\n   • Essential reactant for photosynthesis\n   • Drought conditions limit the process\n\nUnderstanding these factors helps farmers and gardeners create optimal growing conditions for plants!`,
        visualType: 'graph' as const,
        keyPoints: [
          'Light, CO₂, temperature, and water all affect rate',
          'Multiple factors often interact',
          'Each factor has an optimal range',
          'Limiting factors determine overall rate'
        ],
        relatedConcepts: ['Limiting Factors', 'Plant Growth', 'Environmental Science']
      }
    ],
    summary: `Photosynthesis is a two-stage process that converts light energy into chemical energy. In the light-dependent reactions occurring in thylakoids, light energy is captured and water is split to produce oxygen and energy carriers (ATP and NADPH). In the light-independent reactions (Calvin Cycle) in the stroma, these energy carriers are used to convert carbon dioxide into glucose. The process takes place in chloroplasts and is affected by environmental factors like light intensity, CO₂ concentration, temperature, and water availability. This fundamental process not only sustains plant life but also produces the oxygen we breathe and forms the base of most food chains on Earth.`,
    keywords: [
      'Photosynthesis',
      'Chloroplast',
      'Chlorophyll',
      'Light-dependent reactions',
      'Calvin Cycle',
      'Carbon fixation',
      'Glucose',
      'Oxygen production',
      'Thylakoid',
      'Stroma',
      'ATP',
      'NADPH'
    ],
    externalResources: [
      {
        title: 'Khan Academy: Photosynthesis Overview',
        url: 'https://www.khanacademy.org/science/biology/photosynthesis-in-plants',
        type: 'video' as const
      },
      {
        title: 'Nature Education: Photosynthesis',
        url: 'https://www.nature.com/scitable/topicpage/photosynthesis-14218963/',
        type: 'article' as const
      },
      {
        title: 'Interactive Photosynthesis Simulator',
        url: 'https://phet.colorado.edu/en/simulations/photosynthesis',
        type: 'interactive' as const
      },
      {
        title: 'Research Paper: Mechanisms of Photosynthesis',
        url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6218289/',
        type: 'research' as const
      },
      {
        title: 'CrashCourse Biology: Photosynthesis',
        url: 'https://www.youtube.com/watch?v=uixA8ZXx0KU',
        type: 'video' as const
      }
    ]
  };

  return photosynthesisExample;
}

export default function Home() {
  const handleSendMessage = async (message: string) => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const generated = generateExplanation(message);
    return generated;
  };

  return (
    <>
      {/* Header */}
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 border-b">
        <div className="flex items-center gap-2 px-4 w-full justify-between">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/">Home</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>AI Text Assistant</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <ChatInterface onSendMessage={handleSendMessage} />
      </div>
    </>
  );
}
