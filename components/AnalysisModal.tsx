'use client'

import { useState, useEffect } from 'react'
import { AnalysisReport, DiagnosisResult, RoadmapResult, AnalysisTrait } from '@/lib/types'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { CheckCircle2, TrendingUp, ArrowRight, ArrowLeft, Lightbulb, Compass, BookOpen, Sparkles, X } from 'lucide-react'

interface AnalysisModalProps {
  report: AnalysisReport | null
  isOpen: boolean
  onClose: () => void
}

interface Step {
  title: string
  subtitle: string
  content: React.ReactNode
}

export default function AnalysisModal({ report, isOpen, onClose }: AnalysisModalProps) {
  const [currentStep, setCurrentStep] = useState(0)

  // Reset step when modal opens with a new report
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0)
    }
  }, [isOpen, report])

  if (!report) return null

  const renderDiagnosisSteps = (content: DiagnosisResult): Step[] => {
    return [
      {
        title: 'Your Positive Traits',
        subtitle: 'Here are some strengths I\'ve noticed in our conversation.',
        content: (
          <div className="space-y-4">
            {content.positive_traits.map((item, index) => (
              <div key={index} className="flex gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                <div className="shrink-0 pt-1">
                  <CheckCircle2 className="w-6 h-6 text-green-500" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">{item.title}</h4>
                  <p className="text-sm text-gray-600 leading-relaxed">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        )
      },
      {
        title: 'Areas for Improvement',
        subtitle: 'These are some areas where we can work together for growth.',
        content: (
          <div className="space-y-4">
            {content.areas_for_improvement.map((item, index) => (
              <div key={index} className="flex gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                <div className="shrink-0 pt-1">
                  <TrendingUp className="w-6 h-6 text-orange-500" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">{item.title}</h4>
                  <p className="text-sm text-gray-600 leading-relaxed">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        )
      }
    ]
  }

  const renderRoadmapSteps = (content: RoadmapResult): Step[] => {
    return [
      {
        title: '我需要了解什么',
        subtitle: 'What I Need to Know',
        content: (
          <div className="space-y-4">
            {content.need_to_know.map((item, index) => (
              <div key={index} className="flex items-start gap-3 p-4 bg-yellow-50 rounded-xl border border-yellow-100">
                <Lightbulb className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
                <p className="text-gray-700 leading-relaxed">{item}</p>
              </div>
            ))}
          </div>
        )
      },
      {
        title: '我们将共同探索什么',
        subtitle: 'What We\'ll Explore Together',
        content: (
          <div className="space-y-4">
            {content.explore_together.map((item, index) => (
              <div key={index} className="flex items-start gap-3 p-4 bg-blue-50 rounded-xl border border-blue-100">
                <Compass className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                <p className="text-gray-700 leading-relaxed">{item}</p>
              </div>
            ))}
          </div>
        )
      },
      {
        title: '我将学习到什么',
        subtitle: 'What You\'ll Learn',
        content: (
          <div className="space-y-4">
            {content.will_learn.map((item, index) => (
              <div key={index} className="flex items-start gap-3 p-4 bg-green-50 rounded-xl border border-green-100">
                <BookOpen className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                <p className="text-gray-700 leading-relaxed">{item}</p>
              </div>
            ))}
          </div>
        )
      },
      {
        title: '我将体验到什么',
        subtitle: 'What You\'ll Experience',
        content: (
          <div className="space-y-4">
            {content.will_experience.map((item, index) => (
              <div key={index} className="flex items-start gap-3 p-4 bg-purple-50 rounded-xl border border-purple-100">
                <Sparkles className="w-5 h-5 text-purple-500 shrink-0 mt-0.5" />
                <p className="text-gray-700 leading-relaxed">{item}</p>
              </div>
            ))}
          </div>
        )
      }
    ]
  }

  const steps = report.type === 'diagnosis'
    ? renderDiagnosisSteps(report.content as DiagnosisResult)
    : renderRoadmapSteps(report.content as RoadmapResult)

  const isLastStep = currentStep === steps.length - 1
  const isFirstStep = currentStep === 0

  const handleNext = () => {
    if (!isLastStep) {
      setCurrentStep(prev => prev + 1)
    } else {
      onClose()
    }
  }

  const handleBack = () => {
    if (!isFirstStep) {
      setCurrentStep(prev => prev - 1)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md md:max-w-lg bg-white border-none shadow-2xl p-0 overflow-hidden flex flex-col h-[600px]">
        {/* Top Navigation / Progress */}
        <div className="px-6 pt-6 pb-2 bg-white z-10 relative">
          <button 
            onClick={onClose}
            className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex justify-center items-center gap-2 mb-4">
            {steps.map((_, idx) => (
              <div 
                key={idx}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  idx === currentStep 
                    ? 'w-8 bg-indigo-600' 
                    : idx < currentStep 
                      ? 'w-8 bg-indigo-200' 
                      : 'w-2 bg-gray-200'
                }`}
              />
            ))}
          </div>
          
          <div className="text-center space-y-1">
            <div className="text-xs font-medium text-indigo-600 uppercase tracking-wider">
              Step {currentStep + 1} of {steps.length}
            </div>
            <h2 className="text-xl font-bold text-gray-900">{steps[currentStep].title}</h2>
            <p className="text-sm text-gray-500">{steps[currentStep].subtitle}</p>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {steps[currentStep].content}
        </div>

        {/* Bottom Navigation */}
        <div className="p-6 bg-gray-50 border-t border-gray-100 flex items-center justify-between shrink-0">
          <button
            onClick={handleBack}
            disabled={isFirstStep}
            className={`flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg transition-colors ${
              isFirstStep 
                ? 'text-gray-300 cursor-not-allowed' 
                : 'text-gray-600 hover:bg-gray-200/50 hover:text-gray-900'
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          <button
            onClick={handleNext}
            className={`flex items-center gap-2 text-sm font-medium px-6 py-2.5 rounded-lg shadow-sm transition-all ${
              isLastStep
                ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200'
                : 'bg-white text-gray-900 border border-gray-200 hover:bg-gray-50 hover:border-gray-300'
            }`}
          >
            {isLastStep ? (
              <>
                Keep Chatting
                <ArrowRight className="w-4 h-4" />
              </>
            ) : (
              <>
                Next
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
