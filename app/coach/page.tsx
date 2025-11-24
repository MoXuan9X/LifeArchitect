'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { MoreVertical } from 'lucide-react'
import WelcomeDialog from '@/components/WelcomeDialog'
import AnalysisModal from '@/components/AnalysisModal'
import { Message, AnalysisReport, ChatSession } from '@/lib/types'
import { streamChatResponse, generateAnalysisReport, generateChatTitle } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

const GREETING_MESSAGE = '你好！我是你的专属人生导师「小启」。我会陪伴你走出迷茫，找回掌控感。最近遇到了什么问题吗？'
const SESSIONS_STORAGE_KEY = 'chatSessionsByUser'
const LEGACY_SESSIONS_STORAGE_KEY = 'chatSessions'
const DEFAULT_USER_ID = 'guest-user'
const SHOW_SEARCH = false

type SessionStore = Record<string, ChatSession[]>

const parseSessionsMapString = (raw: string | null): SessionStore => {
  if (!raw) return {}
  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) {
      return { [DEFAULT_USER_ID]: parsed as ChatSession[] }
    }
    if (parsed && typeof parsed === 'object') {
      return Object.entries(parsed).reduce((acc, [userId, value]) => {
        acc[userId] = Array.isArray(value) ? value as ChatSession[] : []
        return acc
      }, {} as SessionStore)
    }
  } catch (error) {
    console.error('Failed to parse chat sessions from storage', error)
  }
  return {}
}

const loadSessionsStore = (): SessionStore => {
  if (typeof window === 'undefined') return {}
  const byUserStore = parseSessionsMapString(localStorage.getItem(SESSIONS_STORAGE_KEY))
  if (Object.keys(byUserStore).length > 0) {
    return byUserStore
  }
  return parseSessionsMapString(localStorage.getItem(LEGACY_SESSIONS_STORAGE_KEY))
}

const persistSessionsForUser = (userId: string, sessions: ChatSession[]) => {
  if (typeof window === 'undefined') return
  const store = loadSessionsStore()
  store[userId] = sessions
  localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(store))
  localStorage.removeItem(LEGACY_SESSIONS_STORAGE_KEY)
}

export default function CoachPage() {
  // State
  const [currentUserId, setCurrentUserId] = useState<string>(DEFAULT_USER_ID)
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [currentSessionId, setCurrentSessionId] = useState<string>('')
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [analysisReports, setAnalysisReports] = useState<AnalysisReport[]>([])
  const [currentReport, setCurrentReport] = useState<AnalysisReport | null>(null)
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false)
  const [sessionToDelete, setSessionToDelete] = useState<ChatSession | null>(null)
  
  // Refs
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const [hasHydratedSessions, setHasHydratedSessions] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioStreamRef = useRef<MediaStream | null>(null)
  const recordedChunksRef = useRef<Blob[]>([])
  const shouldTranscribeRef = useRef(false)
  const { toast } = useToast()
  const activeSessionIdRef = useRef<string>('')

  // Derived state
  const isCurrentSessionLoading = messages.length > 0 && messages[messages.length - 1].role === 'assistant' && !!messages[messages.length - 1].isStreaming

  // Keep activeSessionIdRef in sync with currentSessionId
  useEffect(() => {
    activeSessionIdRef.current = currentSessionId
  }, [currentSessionId])

  // Restore current user id for future login support
  useEffect(() => {
    const storedUserId = localStorage.getItem('activeUserId')
    if (storedUserId) {
      setCurrentUserId(storedUserId)
    } else {
      localStorage.setItem('activeUserId', DEFAULT_USER_ID)
    }
  }, [])

  // Load sessions for current user
  useEffect(() => {
    setHasHydratedSessions(false)

    const initializeSessions = () => {
      const store = loadSessionsStore()
      const userSessions = store[currentUserId] || []
      setSessions(userSessions)
      
      if (userSessions.length > 0) {
        const sorted = [...userSessions].sort((a, b) => b.lastUpdated - a.lastUpdated)
        const sessionToLoad = sorted[0]
        if (sessionToLoad && sessionToLoad.id) {
          loadSession(sessionToLoad)
        } else {
          createNewSession()
        }
      } else {
        createNewSession()
      }
    }

    initializeSessions()
    setHasHydratedSessions(true)
  }, [currentUserId])

  // Save sessions to localStorage whenever they change
  useEffect(() => {
    if (!hasHydratedSessions) return
    persistSessionsForUser(currentUserId, sessions)
  }, [sessions, currentUserId, hasHydratedSessions])

  // Auto-scroll logic
  const userScrolledRef = useRef(false)
  const prevSessionIdRef = useRef(currentSessionId)

  const handleScroll = () => {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 50
      
      // Update user scroll state based on whether they're at bottom
      userScrolledRef.current = !isAtBottom
    }
  }

  useEffect(() => {
    if (messagesContainerRef.current) {
      const container = messagesContainerRef.current
      
      // If session changed, reset scroll state and scroll to bottom
      if (prevSessionIdRef.current !== currentSessionId) {
        userScrolledRef.current = false
        prevSessionIdRef.current = currentSessionId
        container.scrollTo({
          top: container.scrollHeight,
          behavior: 'auto'
        })
        return
      }
      
      // Only auto-scroll if user hasn't manually scrolled up
      if (!userScrolledRef.current) {
        container.scrollTo({
          top: container.scrollHeight,
          behavior: isCurrentSessionLoading ? 'smooth' : 'auto'
        })
      }
    }
  }, [messages, isCurrentSessionLoading, currentSessionId])

  const createNewSession = () => {
    // Check if there's already a new session with no user messages
    const existingNewSession = sessions.find(session => {
      // Check if session has only the greeting message (no user messages)
      return session.messages.length === 1 && 
             session.messages[0].role === 'assistant' &&
             session.messages[0].content === GREETING_MESSAGE
    })
    
    if (existingNewSession) {
      // Switch to existing new session instead of creating a new one
      loadSession(existingNewSession)
      return
    }
    
    // Create new session only if no empty session exists
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: '新会话',
      date: new Date().toLocaleDateString(),
      messages: [{
        role: 'assistant',
        content: GREETING_MESSAGE,
        timestamp: Date.now()
      }],
      lastUpdated: Date.now(),
      analysisReports: []
    }
    
    setSessions(prev => [newSession, ...prev])
    // Ensure session ID is set before loading
    if (newSession.id) {
      loadSession(newSession)
    }
    
    toast({
      title: '已开始新会话',
      description: '之前的对话已自动保存'
    })
  }

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('activeUserId')
    }
    setCurrentUserId(DEFAULT_USER_ID)
    toast({
      title: '已退出登录',
      description: '登录功能即将上线，敬请期待'
    })
  }

  const loadSession = (session: ChatSession) => {
    setCurrentSessionId(session.id)
    // Directly update ref here to avoid sync issues
    activeSessionIdRef.current = session.id
    // Ensure no messages are in streaming state when loading a session
    const cleanedMessages = session.messages.map(msg => ({
      ...msg,
      isStreaming: false
    }))
    setMessages(cleanedMessages)
    setAnalysisReports(session.analysisReports || [])
    setInputValue('')
  }

  const deleteSession = (sessionId: string) => {
    // Prevent deleting the final session to avoid duplicate re-creation bugs
    if (sessions.length <= 1) {
      setSessionToDelete(null)
      return
    }

    setSessions(prev => {
      const newSessions = prev.filter(s => s.id !== sessionId)
      
      // If we deleted the current session, load another one or create new
      if (sessionId === currentSessionId) {
        if (newSessions.length > 0) {
          // Sort by lastUpdated desc
          const sorted = newSessions.sort((a, b) => b.lastUpdated - a.lastUpdated)
          loadSession(sorted[0])
        } else {
          // We can't call createNewSession here directly because it depends on state that's being updated
          // So we'll handle empty state in the effect or use a timeout, but better:
          // Just manually construct a new session state
           setTimeout(() => createNewSession(), 0)
        }
      }
      return newSessions
    })
    
    setSessionToDelete(null)
    toast({
      title: '会话已删除',
    })
  }

  const updateSession = (sessionId: string, updatedFields: Partial<ChatSession>) => {
    setSessions(prev => prev.map(session => {
      if (session.id === sessionId) {
        return { ...session, ...updatedFields, lastUpdated: Date.now() }
      }
      return session
    }))
  }

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isCurrentSessionLoading || !currentSessionId) return

    const sendingSessionId = currentSessionId // Capture current session ID for this message exchange

    const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
    const typingDelayFor = (char: string) => {
      if (char === ' ' || char === '\n') return 0
      return 18
    }

    const userMessage: Message = {
      role: 'user',
      content: inputValue.trim(),
      timestamp: Date.now()
    }

    const typingPlaceholder: Message = {
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      isStreaming: true
    }

    // Update UI immediately if active session matches
    const newMessages = [...messages, userMessage]
    if (activeSessionIdRef.current === sendingSessionId) {
      setMessages([...newMessages, typingPlaceholder])
      setInputValue('')
    } else {
      // Even if we switched, we might want to clear input if we were on that session?
      // But if we switched, input value is now for the NEW session.
      // Actually, handleSendMessage is async. The check at top used current state.
      // So we are definitely on the sending session when this function starts.
      setInputValue('')
    }

    // Update session storage immediately with user message + placeholder
    // Note: We include placeholder in session storage so switching away and back shows the placeholder
    updateSession(sendingSessionId, { messages: [...newMessages, typingPlaceholder] })

    try {
      let streamedContent = ''
      let finalMessages = [...newMessages] // Track messages including the final assistant response

      const updateStreamingMessage = (content: string, isStreaming: boolean) => {
        // Always update session state so switching back works
        // We reconstruct the full message history with the updated last message
        const updatedHistory = [...newMessages]
        const lastMessage: Message = {
            role: 'assistant',
            content,
            isStreaming,
            timestamp: Date.now() // Timestamp updates on stream? Maybe better to keep original timestamp
        }
        updatedHistory.push(lastMessage)
        
        // Important: Update the session in the background
        // We throttle this or just update? React might batch state updates.
        // For now, let's update it.
        updateSession(sendingSessionId, { messages: updatedHistory })

        // Only update UI state if this session is currently active
        if (activeSessionIdRef.current === sendingSessionId) {
          setMessages(prev => {
            const history = [...prev]
            const lastIndex = history.length - 1

            if (lastIndex >= 0 && history[lastIndex].role === 'assistant') {
              history[lastIndex] = {
                ...history[lastIndex],
                content,
                isStreaming,
                timestamp: history[lastIndex].timestamp
              }
            }
            return history
          })
        }
      }

      const assistantResponse = await streamChatResponse(newMessages, async delta => {
        for (const char of delta) {
          streamedContent += char
          updateStreamingMessage(streamedContent, true)
          const delay = typingDelayFor(char)
          if (delay > 0) {
            await sleep(delay)
          }
        }
      })

      updateStreamingMessage(assistantResponse, false)
      
      // Finalize messages for this turn
      const assistantMessage: Message = {
        role: 'assistant',
        content: assistantResponse,
        timestamp: Date.now()
      }
      finalMessages = [...newMessages, assistantMessage]
      
      // Update session with complete exchange
      updateSession(sendingSessionId, { messages: finalMessages })

      // Check for analysis triggers
      const assistantMessageCount = finalMessages.filter(m => m.role === 'assistant').length
      if (assistantMessageCount === 5) {
        generateAnalysis(sendingSessionId, finalMessages, 'diagnosis')
      } else if (assistantMessageCount === 10) {
        generateAnalysis(sendingSessionId, finalMessages, 'roadmap')
      }

      // Generate title if it's a new session (e.g., 2nd user message)
      const userMessageCount = finalMessages.filter(m => m.role === 'user').length
      const session = sessions.find(s => s.id === sendingSessionId)
      if (session && session.title === '新会话' && userMessageCount >= 1) {
        generateTitle(sendingSessionId, finalMessages)
      }

    } catch (error) {
      console.error('Error sending message:', error)
      
      const errorMessage: Message = {
        role: 'assistant',
        content: '抱歉，我遇到了一些问题，请再说一次好吗？',
        timestamp: Date.now(),
        isStreaming: false
      }
      
      // Handle error in UI if active
      if (activeSessionIdRef.current === sendingSessionId) {
        setMessages(prev => {
            const history = [...prev]
            const lastIndex = history.length - 1
            if (lastIndex >= 0 && history[lastIndex].role === 'assistant' && history[lastIndex].isStreaming) {
              history[lastIndex] = errorMessage
            } else {
              history.push(errorMessage)
            }
            return history
        })
      }
      
      // Update session with error message
      updateSession(sendingSessionId, {
          messages: [...newMessages, errorMessage]
      })

      toast({
        title: '发送失败',
        description: '网络连接出现问题，请检查网络后重试',
        variant: 'destructive'
      })
    } 
  }

  const generateTitle = async (sessionId: string, currentMessages: Message[]) => {
    try {
      const title = await generateChatTitle(currentMessages)
      updateSession(sessionId, { title })
    } catch (error) {
      console.error('Title generation failed', error)
    }
  }

  const generateAnalysis = async (sessionId: string, history: Message[], type: 'diagnosis' | 'roadmap') => {
    try {
      const report = await generateAnalysisReport(history, type)
      
      // Save report to session
      setSessions(prev => prev.map(session => {
        if (session.id === sessionId) {
          const updatedReports = [report, ...(session.analysisReports || [])]
          return { ...session, analysisReports: updatedReports }
        }
        return session
      }))
      
      // Only show modal if we are on the active session
      if (activeSessionIdRef.current === sessionId) {
        setAnalysisReports(prev => [report, ...prev])
        setCurrentReport(report)
        setIsAnalysisModalOpen(true)
        
        toast({
            title: '新的分析报告已生成',
            description: type === 'diagnosis' ? '查看您的问题诊断报告' : '查看您的行动路线图',
        })
      } else {
          // Optional: toast notification for background completion?
          toast({
            title: '新的分析报告已生成',
            description: '请切换回该会话查看报告',
        })
      }

    } catch (error) {
      console.error('Error generating analysis:', error)
      if (activeSessionIdRef.current === sessionId) {
        toast({
            title: '分析生成失败',
            description: '请稍后重试',
            variant: 'destructive'
        })
      }
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  // Audio handling
  const stopStream = () => {
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach(track => track.stop())
      audioStreamRef.current = null
    }
  }

  const transcribeAudio = async (audioBlob: Blob) => {
    const transcriptionApiKey = process.env.NEXT_PUBLIC_SILICONFLOW_API_KEY || ''
    if (!transcriptionApiKey) {
      toast({
        title: '转录失败',
        description: '缺少语音识别 API Key',
        variant: 'destructive'
      })
      return
    }
    setIsTranscribing(true)
    try {
      const formData = new FormData()
      formData.append('file', audioBlob, 'recording.webm')
      formData.append('model', 'FunAudioLLM/SenseVoiceSmall')

      const response = await fetch('https://api.siliconflow.cn/v1/audio/transcriptions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${transcriptionApiKey}` },
        body: formData
      })

      if (!response.ok) throw new Error(`转录请求失败: ${response.status}`)
      const data = await response.json()
      const transcribedText = data.text || ''

      if (transcribedText.trim()) {
        setInputValue(transcribedText)
      } else {
        toast({
          title: '未识别到语音',
          description: '请重试或直接输入文字',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('转录错误:', error)
      toast({
        title: '转录失败',
        description: '语音识别出现问题，请重试',
        variant: 'destructive'
      })
    } finally {
      setIsTranscribing(false)
      shouldTranscribeRef.current = false
    }
  }

  const handleStartRecording = async () => {
    if (isRecording || isTranscribing || isCurrentSessionLoading) return
    const transcriptionApiKey = process.env.NEXT_PUBLIC_SILICONFLOW_API_KEY || ''
    if (!transcriptionApiKey) {
      toast({
        title: '功能不可用',
        description: '语音录音功能需要配置 API Key',
        variant: 'destructive'
      })
      return
    }
    if (typeof window === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      toast({ title: '浏览器不支持', description: '您的浏览器不支持语音录音', variant: 'destructive' })
      return
    }

    shouldTranscribeRef.current = false
    setIsTranscribing(false)

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      audioStreamRef.current = stream
      recordedChunksRef.current = []
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder

      mediaRecorder.ondataavailable = (event: BlobEvent) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onerror = () => {
        setIsRecording(false)
        mediaRecorderRef.current = null
        stopStream()
        toast({ title: '录音错误', description: '录音过程中出现问题', variant: 'destructive' })
      }

      mediaRecorder.onstop = () => {
        const shouldTranscribe = shouldTranscribeRef.current
        setIsRecording(false)
        stopStream()
        mediaRecorderRef.current = null
        const audioBlob = new Blob(recordedChunksRef.current, { type: 'audio/webm' })
        recordedChunksRef.current = []
        if (shouldTranscribe) transcribeAudio(audioBlob)
        else shouldTranscribeRef.current = false
      }

      mediaRecorder.start()
      setIsRecording(true)
    } catch (error) {
      console.error('麦克风访问错误:', error)
      setIsRecording(false)
      mediaRecorderRef.current = null
      stopStream()
      toast({ title: '麦克风访问失败', description: '无法访问麦克风，请检查权限设置', variant: 'destructive' })
    }
  }

  const handleStopRecording = () => {
    if (!isRecording || !mediaRecorderRef.current) return
    shouldTranscribeRef.current = true
    mediaRecorderRef.current.stop()
  }

  const handleCancelRecording = () => {
    if (!isRecording || !mediaRecorderRef.current) return
    shouldTranscribeRef.current = false
    mediaRecorderRef.current.stop()
  }

  // Group sessions by date label for display
  const getGroupedSessions = () => {
    const groups: { [key: string]: ChatSession[] } = {}
    // Sort by lastUpdated descending
    const sortedSessions = [...sessions].sort((a, b) => b.lastUpdated - a.lastUpdated)
    
    sortedSessions.forEach(session => {
      // Simple date grouping logic (Today, Yesterday, Older)
      const date = new Date(session.lastUpdated)
      const today = new Date()
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)
      
      let label = date.toLocaleDateString()
      if (date.toDateString() === today.toDateString()) {
        label = '今天'
      } else if (date.toDateString() === yesterday.toDateString()) {
        label = '昨天'
      }
      
      if (!groups[label]) groups[label] = []
      groups[label].push(session)
    })
    
    return groups
  }

  const groupedSessions = getGroupedSessions()
  const canDeleteSessions = sessions.length > 1

  return (
    <>
      <WelcomeDialog />
      <AnalysisModal 
        report={currentReport} 
        isOpen={isAnalysisModalOpen} 
        onClose={() => setIsAnalysisModalOpen(false)} 
      />

      <AlertDialog open={!!sessionToDelete} onOpenChange={(open) => !open && setSessionToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>删除会话</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除会话 "{sessionToDelete?.title}" 吗？此操作无法撤销，聊天记录将被永久删除。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => sessionToDelete && deleteSession(sessionToDelete.id)}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="flex h-screen w-full relative overflow-hidden font-[Inter,sans-serif] text-gray-800 bg-[#F9FAFF]">
        {/* Background gradients */}
        <div className="absolute -top-1/4 -left-[10%] w-[60%] h-[60%] bg-gradient-to-br from-purple-200/50 via-pink-200/50 to-rose-100/50 rounded-full opacity-20 blur-[120px]"></div>
        <div className="absolute -bottom-1/4 -right-[10%] w-[60%] h-[60%] bg-gradient-to-tl from-cyan-100/50 to-sky-300/50 rounded-full opacity-20 blur-[120px]"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1/3 h-1/3 bg-gradient-to-tr from-indigo-100/50 to-purple-100/50 rounded-full opacity-10 blur-[100px]"></div>

        {/* Sidebar */}
        <aside className="flex h-full w-[280px] shrink-0 flex-col bg-indigo-50/50 p-4 z-10 border-r border-indigo-100/80">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/site-icon.png"
                alt="LifeArchitect Logo"
                width={32}
                height={32}
                className="h-8 w-8"
              />
              <span className="text-lg font-bold text-gray-800">LifeArchitect</span>
            </Link>
          </div>

          {SHOW_SEARCH && (
            <div className="mt-8">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border-none bg-white/70 py-2.5 pl-10 pr-4 text-sm text-gray-700 placeholder-gray-500 focus:ring-2 focus:ring-indigo-400"
                  placeholder="Search"
                />
              </div>
            </div>
          )}

          <nav className="mt-8 space-y-2">
            <button 
              onClick={createNewSession}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-white/70 w-full text-left transition-colors"
            >
              <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span>New Chat</span>
            </button>
          </nav>

          {/* History Chats and Analysis */}
          <div className="mt-6 flex-grow overflow-y-auto">
            <h3 className="px-3 text-xs font-semibold uppercase tracking-wider text-gray-500">CHAT</h3>
            <div className="mt-4 space-y-1">
              {[...sessions]
                .sort((a, b) => b.lastUpdated - a.lastUpdated)
                .map((session) => (
                  <div key={session.id} className="relative">
                        <div className="group relative">
                            <button
                                onClick={() => loadSession(session)}
                                className={`block rounded-lg w-full text-left px-3 py-2 text-sm truncate transition-colors pr-8 ${
                                currentSessionId === session.id
                                    ? 'bg-indigo-500/10 text-indigo-900 font-medium'
                                    : 'text-gray-600 hover:bg-white/70'
                                }`}
                            >
                                {session.title}
                            </button>
                            {canDeleteSessions && (
                                <button
                                onClick={(e) => {
                                    e.stopPropagation()
                                    setSessionToDelete(session)
                                }}
                                className="absolute right-2 top-1/2 -translate-y-1/2 px-1.5 py-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-red-100 text-gray-400 hover:text-red-500 transition-all text-sm font-bold leading-none"
                                title="删除会话"
                                aria-label="删除会话"
                                >
                                ×
                                </button>
                            )}
                        </div>
                        
                        {/* Session Analysis Reports */}
                        {session.id === currentSessionId && session.analysisReports && session.analysisReports.length > 0 && (
                            <div className="ml-4 pl-2 border-l border-indigo-100 space-y-1 mt-1">
                                {[...session.analysisReports]
                                    .sort((a, b) => {
                                        // Sort: diagnosis (问题分析) first, then roadmap (行动路线)
                                        if (a.type === 'diagnosis' && b.type === 'roadmap') return -1
                                        if (a.type === 'roadmap' && b.type === 'diagnosis') return 1
                                        return 0
                                    })
                                    .map((report) => (
                                    <button
                                        key={report.id}
                                        onClick={() => {
                                            // Switch to this session if needed
                                            if (currentSessionId !== session.id) {
                                                loadSession(session)
                                            }
                                            // Open report modal
                                            setCurrentReport(report)
                                            setIsAnalysisModalOpen(true)
                                        }}
                                        className="flex items-center gap-2 w-full px-2 py-1 text-xs text-left text-gray-500 hover:text-indigo-600 hover:bg-white/50 rounded transition-colors truncate"
                                    >
                                        <div className={`h-1.5 w-1.5 rounded-full shrink-0 ${report.type === 'diagnosis' ? 'bg-blue-400' : 'bg-green-400'}`}></div>
                                        <span className="truncate">{report.type === 'diagnosis' ? '问题分析' : '行动路线'}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
              ))}
            </div>
          </div>

          {/* Analysis Progress */}
          <div className="mt-6 mb-8 px-1">
            <h3 className="px-2 text-xs font-semibold uppercase tracking-wider text-gray-500 mb-4">Analysis</h3>
            <div className="relative pl-4">
              {/* Continuous vertical progress line from first to third circle centers */}
              {(() => {
                const trackHeight = 'calc(100% - 1rem)' // subtract first + last circle radius (0.5rem each)
                const progressRatio = messages.length >= 100 ? 1 : messages.length >= 80 ? 0.5 : 0
                return (
                  <>
                    <div
                      className="absolute left-[23px] w-0.5 bg-gray-200"
                      style={{
                        top: '0.5rem',
                        height: trackHeight
                      }}
                    />
                    <div
                      className="absolute left-[23px] w-0.5 bg-indigo-500 transition-all duration-500"
                      style={{
                        top: '0.5rem',
                        height: `calc(${progressRatio} * (${trackHeight}))`
                      }}
                    />
                  </>
                )
              })()}

              <div className="space-y-6">
                {/* Item 1: Personality Analysis */}
                <div className="relative flex items-center group">
                  <div className={`absolute left-0 w-4 h-4 rounded-full border-2 z-10 bg-white ${
                    messages.length >= 50 ? 'border-indigo-500' : 'border-gray-300'
                  }`}>
                    {messages.length >= 50 && <div className="w-2 h-2 bg-indigo-500 rounded-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />}
                  </div>
                  <div className="ml-8 w-full flex items-center justify-between">
                    <div>
                      <div className={`text-sm font-medium mb-0.5 ${
                        messages.length >= 50 ? 'text-gray-800' : 'text-gray-400'
                      }`}>Personality Analysis</div>
                      <p className="text-xs text-gray-400">性格分析</p>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded-full">50</span>
                  </div>
                </div>

                {/* Item 2: Thought Pattern */}
                <div className="relative flex items-center group">
                  <div className={`absolute left-0 w-4 h-4 rounded-full border-2 z-10 bg-white ${
                    messages.length >= 80 ? 'border-indigo-500' : 'border-gray-300'
                  }`}>
                    {messages.length >= 80 && <div className="w-2 h-2 bg-indigo-500 rounded-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />}
                  </div>
                  <div className="ml-8 w-full flex items-center justify-between">
                    <div>
                      <div className={`text-sm font-medium mb-0.5 ${
                        messages.length >= 80 ? 'text-gray-800' : 'text-gray-400'
                      }`}>Thought Pattern</div>
                      <p className="text-xs text-gray-400">思维模式</p>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded-full">80</span>
                  </div>
                </div>

                {/* Item 3: Blind-Spot Analysis */}
                <div className="relative flex items-center group">
                  <div className={`absolute left-0 w-4 h-4 rounded-full border-2 z-10 bg-white ${
                    messages.length >= 100 ? 'border-indigo-500' : 'border-gray-300'
                  }`}>
                    {messages.length >= 100 && <div className="w-2 h-2 bg-indigo-500 rounded-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />}
                  </div>
                  <div className="ml-8 w-full flex items-center justify-between">
                    <div>
                      <div className={`text-sm font-medium mb-0.5 ${
                        messages.length >= 100 ? 'text-gray-800' : 'text-gray-400'
                      }`}>Blind-Spot Analysis</div>
                      <p className="text-xs text-gray-400">盲点分析</p>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded-full">100</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom User Info */}
          <div className="mt-auto pt-4 border-t border-indigo-100/80">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-500 flex items-center justify-center text-white font-semibold shadow-sm">
                  U
                </div>
                <p className="font-semibold text-gray-800">用户</p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    aria-label="更多操作"
                    className="rounded-lg p-2 text-gray-400 hover:text-gray-600 hover:bg-indigo-100/60 transition-colors"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" sideOffset={4} className="w-32">
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="text-red-600 focus:text-red-600"
                  >
                    退出登录
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex flex-1 flex-col bg-transparent relative">
          {/* Header */}
          <header className="flex h-16 shrink-0 items-center justify-between border-b border-gray-200/80 px-8 backdrop-blur-sm z-10">
            <h1 className="text-xl font-bold text-gray-900">AI逆袭师</h1>
          </header>

          {/* Messages Area */}
          <div 
            ref={messagesContainerRef} 
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto p-8 relative"
          >
            <div className="mx-auto max-w-3xl">
              <div className="space-y-8">
                {messages.map((message, index) => (
                  <div key={index}>
                    {message.role === 'assistant' ? (
                      message.isStreaming && !message.content ? (
                        // Loading Animation
                        <div className="flex items-start gap-4">
                          <div className="h-10 w-10 shrink-0 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-500 flex items-center justify-center shadow-md shadow-indigo-200">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                          </div>
                          <div className="p-4">
                            <div className="flex items-center gap-1 h-6">
                              <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.3s]"></div>
                              <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.15s]"></div>
                              <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400"></div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        // AI Message
                        <div className="flex items-start gap-4">
                          <div className="h-10 w-10 shrink-0 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-500 flex items-center justify-center shadow-md shadow-indigo-200">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                          </div>
                          <div className="rounded-lg rounded-tl-none bg-white p-4 text-gray-700 shadow-sm shadow-gray-100/50">
                            <div className="prose prose-base max-w-none prose-indigo">
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {message.content}
                              </ReactMarkdown>
                            </div>
                          </div>
                        </div>
                      )
                    ) : (
                      // User Message
                      <div className="flex items-start justify-end gap-4">
                        <div className="max-w-[calc(100%-3.5rem)] rounded-lg rounded-br-none bg-indigo-600 p-4 text-white shadow-lg shadow-indigo-300">
                          <p className="whitespace-pre-wrap break-words">{message.content}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Input Area */}
          <div className="shrink-0 bg-transparent px-4 sm:px-8 pb-4 sm:pb-8 pt-2">
            <div className="mx-auto max-w-3xl">
              <div className="flex relative rounded-xl border border-gray-200/80 bg-white/80 p-2 shadow-sm transition-all focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-300">
                {/* Recording Overlay */}
                {(isRecording || isTranscribing) && (
                  <div className="absolute inset-0 flex flex-col justify-between rounded-xl bg-white/95 backdrop-blur-sm p-4 z-10">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      {isRecording ? (
                        <>
                          <div className="flex items-center gap-1">
                            <span className="h-1 w-1 rounded-full bg-indigo-500 animate-pulse"></span>
                            <span className="h-1 w-1 rounded-full bg-indigo-500 animate-pulse [animation-delay:0.15s]"></span>
                            <span className="h-1 w-1 rounded-full bg-indigo-500 animate-pulse [animation-delay:0.3s]"></span>
                          </div>
                          <span>正在录音...</span>
                        </>
                      ) : (
                        <>
                          <div className="h-4 w-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                          <span>正在转换为文字...</span>
                        </>
                      )}
                    </div>
                    
                    {isRecording && (
                      <div className="flex items-center justify-end gap-4">
                        <button
                          onClick={handleCancelRecording}
                          className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 transition-colors"
                          title="取消录音"
                        >
                          <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                        <button
                          onClick={handleStopRecording}
                          className="flex items-center justify-center w-10 h-10 rounded-full bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-200"
                          title="完成录音"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                )}

                <textarea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={isCurrentSessionLoading || isRecording || isTranscribing}
                  className="h-28 flex-1 resize-none border-0 bg-transparent px-3 py-3 text-gray-900 placeholder-gray-400 focus:ring-0 focus:outline-none"
                  placeholder="Type message..."
                  rows={1}
                />
                <div className="absolute bottom-2.5 right-2.5 flex items-center gap-3">
                  <button
                    onClick={isRecording ? handleStopRecording : handleStartRecording}
                    disabled={isCurrentSessionLoading || isTranscribing}
                    className={`p-2 transition-colors ${
                      isRecording 
                        ? 'text-indigo-600 hover:text-indigo-700' 
                        : 'text-gray-500 hover:text-indigo-500'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                    title={isRecording ? '停止录音' : '开始录音'}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                  </button>
                  <button
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim() || isCurrentSessionLoading || isRecording || isTranscribing}
                    className="rounded-lg bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-200 transition-colors hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  )
}
