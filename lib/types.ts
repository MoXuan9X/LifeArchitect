export interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: number
  isStreaming?: boolean
}

export interface Categories {
  pendingThings: string[]
  happyThings: string[]
  gratefulThings: string[]
}

export interface ConversationProgress {
  currentCategory: 'pendingThings' | 'happyThings' | 'gratefulThings' | 'completed'
  currentStep: number
  userName: string
  isCompleted: boolean
}

export interface ChatSession {
  id: string
  title: string
  date: string
  messages: Message[]
  lastUpdated: number
  analysisReports?: AnalysisReport[]
}

export interface AppState {
  conversationHistory: Message[]
  categories: Categories
  conversationProgress: ConversationProgress
  lastSessionDate: string
}

export const INITIAL_STATE: AppState = {
  conversationHistory: [],
  categories: {
    pendingThings: [],
    happyThings: [],
    gratefulThings: []
  },
  conversationProgress: {
    currentCategory: 'pendingThings',
    currentStep: 0,
    userName: '',
    isCompleted: false
  },
  lastSessionDate: ''
}

// Analysis Report Types
export interface AnalysisTrait {
  title: string
  description: string
}

export interface DiagnosisResult {
  positive_traits: AnalysisTrait[]
  areas_for_improvement: AnalysisTrait[]
}

export interface RoadmapResult {
  need_to_know: string[]
  explore_together: string[]
  will_learn: string[]
  will_experience: string[]
}

export interface AnalysisReport {
  id: string
  type: 'diagnosis' | 'roadmap'
  title: string
  content: DiagnosisResult | RoadmapResult
  createdAt: number
  isRead: boolean
}
