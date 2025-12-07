'use client'

import { useEffect, useMemo, useState, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { MoreVertical, ChevronDown, ChevronRight, Trophy, Lock, CheckCircle2, Circle, Loader2, PieChart, ScanFace, Zap, Sparkles } from 'lucide-react'
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

type SessionStore = Record<string, ChatSession[] | undefined | null>

const dedupeReports = (reports: AnalysisReport[] = []) => {
  const seen = new Set<string>()
  return reports.filter(report => {
    if (seen.has(report.id)) return false
    seen.add(report.id)
    return true
  })
}

const parseSessionsMapString = (raw: string | null): SessionStore => {
  if (!raw) return {}
  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) {
      return { [DEFAULT_USER_ID]: parsed as ChatSession[] }
    }
    if (parsed && typeof parsed === 'object') {
      return Object.entries(parsed).reduce((acc, [userId, value]) => {
        // Handle legacy shapes:
        // - Array of sessions
        // - Object with { sessions, analysisReports }
        if (Array.isArray(value)) {
          acc[userId] = value as ChatSession[]
        } else if (value && typeof value === 'object' && Array.isArray((value as any).sessions)) {
          const sessions = (value as any).sessions as ChatSession[]
          const extraReports = Array.isArray((value as any).analysisReports) ? dedupeReports((value as any).analysisReports) : []
          if (extraReports.length > 0 && sessions.length > 0) {
            // Attach any previously stored user-level reports to the most recent session to avoid data loss
            const targetIndex = sessions.reduce((bestIndex, s, idx, arr) => {
              if (!arr[bestIndex]) return idx
              return (s.lastUpdated || 0) > (arr[bestIndex].lastUpdated || 0) ? idx : bestIndex
            }, 0)
            const targetSession = sessions[targetIndex] || sessions[0]
            sessions[targetIndex] = {
              ...targetSession,
              analysisReports: dedupeReports([...(targetSession.analysisReports || []), ...extraReports])
            }
          }
          acc[userId] = sessions
        } else {
          acc[userId] = []
        }
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
  const [isAnalysisExpanded, setIsAnalysisExpanded] = useState(true)

  const totalUserMessageCount = useMemo(() => {
    return sessions.reduce((sum, session) => {
      return sum + session.messages.filter(m => m.role === 'user').length
    }, 0)
  }, [sessions])

  // Watch for newly unlocked stages
  useEffect(() => {
    // Check if we have any *newly* unlocked stages that are not in our read history
    // For simplicity, we'll check if we have a new report generated that is unread
    const hasNewUnreadReport = analysisReports.some(r => !r.isRead)
    
      if (hasNewUnreadReport) {
        // Play success sound
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3') // Success / Achievement sound
        audio.volume = 0.6
        audio.play().catch(e => console.log('Audio play failed', e))
      }
    }, [analysisReports]) // Trigger when reports update

  // Mark reports as read when expanding analysis section
  useEffect(() => {
    if (isAnalysisExpanded && analysisReports.some(r => !r.isRead)) {
      const updatedReports = analysisReports.map(r => ({ ...r, isRead: true }))
      setAnalysisReports(updatedReports)
      
      if (currentSessionId) {
        updateSession(currentSessionId, { analysisReports: updatedReports })
      }
    }
  }, [isAnalysisExpanded, analysisReports])
  
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
      const userSessions = (store[currentUserId] || []) as ChatSession[]
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
    
    // Also sync to Supabase in the background
    syncToSupabase(currentUserId, sessions)
  }, [sessions, currentUserId, hasHydratedSessions])

  const [isSyncing, setIsSyncing] = useState(false)
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null)

  const syncToSupabase = async (userId: string, sessions: ChatSession[]) => {
    try {
      const response = await fetch('/api/sync-user-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, sessions })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        console.error('Sync to Supabase failed:', data)
        throw new Error(data.error || 'Sync failed')
      } else {
        console.log('Successfully synced to Supabase:', data)
        setLastSyncTime(Date.now())
        return data
      }
    } catch (error) {
      console.error('Error syncing to Supabase:', error)
      throw error
    }
  }

  const handleManualSync = async () => {
    setIsSyncing(true)
    try {
      // 直接从 localStorage 读取最新数据，避免闭包问题
      const store = loadSessionsStore()
      const latestSessions = (store[currentUserId] || []) as ChatSession[]
      
      console.log(`[Manual Sync] User: ${currentUserId}, Sessions from state: ${sessions.length}, Sessions from storage: ${latestSessions.length}`)
      
      // 使用 localStorage 中的数据（更可靠）
      const sessionsToSync = latestSessions.length > 0 ? latestSessions : sessions
      
      if (sessionsToSync.length === 0) {
        toast({
          title: '没有数据需要同步',
          description: '本地没有找到会话记录',
          variant: 'destructive'
        })
        return
      }
      
      const result = await syncToSupabase(currentUserId, sessionsToSync)
      toast({
        title: '同步成功',
        description: `已同步 ${result.synced} 个会话到云端`,
      })
    } catch (error) {
      toast({
        title: '同步失败',
        description: error instanceof Error ? error.message : '请检查网络连接',
        variant: 'destructive'
      })
    } finally {
      setIsSyncing(false)
    }
  }

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
      let updatedSessions: ChatSession[] = []
      setSessions(prev => {
        updatedSessions = prev.map(session => {
          if (session.id === sendingSessionId) {
            return { ...session, messages: finalMessages, lastUpdated: Date.now() }
          }
          return session
        })
        return updatedSessions
      })

      // Check for analysis triggers based on user's total message count (exclude assistant)
      const activeSessionAfterUpdate = updatedSessions.find(s => s.id === sendingSessionId)
      const sessionReports = activeSessionAfterUpdate?.analysisReports || []
      const sessionHistory = activeSessionAfterUpdate?.messages || []
      const sessionUserMessageCount = sessionHistory.filter(m => m.role === 'user').length
      
      // Per-session triggers
      if (sessionUserMessageCount >= 5 && !sessionReports.some(r => r.type === 'diagnosis')) {
        generateAnalysis(sendingSessionId, sessionHistory, 'diagnosis')
      }
      
      if (sessionUserMessageCount >= 10 && !sessionReports.some(r => r.type === 'roadmap')) {
        generateAnalysis(sendingSessionId, sessionHistory, 'roadmap')
      }

      // Generate title if it's a new session (e.g., 2nd user message)
      const userMessageCount = finalMessages.filter(m => m.role === 'user').length
      const session = updatedSessions.find(s => s.id === sendingSessionId) || sessions.find(s => s.id === sendingSessionId)
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

      // Save report to the specific session
      setSessions(prev => prev.map(session => {
        if (session.id === sessionId) {
          const nextReports = dedupeReports([report, ...(session.analysisReports || [])])
          return { ...session, analysisReports: nextReports }
        }
        return session
      }))

      // If this session is active, update local report state and show modal
      if (activeSessionIdRef.current === sessionId) {
        setAnalysisReports(prev => dedupeReports([report, ...prev]))
        setCurrentReport(report)
        setIsAnalysisModalOpen(true)
        
        toast({
            title: '新的分析报告已生成',
            description: type === 'diagnosis' ? '查看您的问题诊断报告' : '查看您的行动路线图',
        })
      } else {
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

          {/* Analysis Section */}
          <div className="mt-2">
             <button 
                onClick={() => setIsAnalysisExpanded(!isAnalysisExpanded)}
                className="flex items-center justify-between w-full rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-white/70 transition-colors group"
             >
                <div className="flex items-center gap-3">
                  <ScanFace className="w-5 h-5 text-indigo-500" />
                  <span>Analysis</span>
                </div>
                
                {/* Status Indicators - Always visible */}
                <div className="flex items-center gap-2">
                  {analysisReports.length > 0 && analysisReports.some(r => !r.isRead) ? (
                    <div className="flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-[10px] font-bold shadow-sm animate-bounce [animation-iteration-count:3]">
                      +{analysisReports.filter(r => !r.isRead).length}
                    </div>
                  ) : (
                    /* In-progress Count */
                    (() => {
                      const len = totalUserMessageCount
                      if (len >= 100) return null
                      
                      const target = len < 50 ? 50 : len < 80 ? 80 : 100
                      const remaining = target - len
                      // Only show next target info if we don't have unread reports (handled by above condition)
                      // But also, if we just finished one stage (e.g. 50), we wait for user to read report before showing next target?
                      // User said: "收起之后呈现下一个报告的剩余消息数" implies after reading (expanding/collapsing), show next.
                      // Since we toggle isRead on expand, this condition `!r.isRead` handles the switch naturally.

                      return (
                        <div className="flex items-center gap-1.5 bg-indigo-50/80 px-2.5 py-1 rounded-full">
                          <Sparkles className="w-3 h-3 text-indigo-500 fill-indigo-500" />
                          <span className="text-[10px] font-medium tracking-tight">
                            <span className="font-bold text-indigo-600">{remaining}</span> <span className="text-indigo-400">msgs to unlock</span>
                          </span>
                        </div>
                      )
                    })()
                  )}
                </div>
             </button>
             
             {isAnalysisExpanded && (
               <div className="relative mt-2 px-2">
                 {/* Vertical Progress Line */}
                 {(() => {
                    const trackHeight = 'calc(100% - 24px)' 
                    const progressRatio = totalUserMessageCount >= 100 ? 1 : totalUserMessageCount >= 80 ? 0.5 : 0
                    return (
                      <div className="absolute left-[35px] top-3 bottom-3 w-px bg-gray-200 z-0">
                        <div 
                          className="absolute top-0 left-0 w-full bg-indigo-500 transition-all duration-500"
                          style={{ height: `${progressRatio * 100}%` }}
                        />
                      </div>
                    )
                  })()}

                 <div className="space-y-1 relative z-10">
                   {[
                     { id: 'personality', title: 'Personality', target: 50, reportType: 'diagnosis' },
                     { id: 'thought', title: 'Thought Pattern', target: 80, reportType: 'roadmap' },
                     { id: 'blindspot', title: 'Blind-Spot', target: 100, reportType: null }
                   ].map((item, index) => {
                     const isUnlocked = totalUserMessageCount >= item.target
                     const prevTarget = index === 0 ? 0 : [50, 80, 100][index - 1]
                     const isInProgress = !isUnlocked && totalUserMessageCount >= prevTarget
                     
                     return (
                       <button 
                         key={item.id}
                         onClick={() => {
                           if (!isUnlocked) return
                           const report = analysisReports.find(r => r.type === item.reportType)
                           if (report) {
                             setCurrentReport(report)
                             setIsAnalysisModalOpen(true)
                           } else {
                             toast({ 
                               title: '报告准备中', 
                               description: '该阶段的分析报告尚未生成' 
                             })
                           }
                         }}
                         className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all text-left pl-11 relative group ${
                           isUnlocked 
                             ? 'bg-transparent text-indigo-900 cursor-pointer hover:bg-white' 
                             : isInProgress
                               ? 'bg-transparent text-gray-800 cursor-default'
                               : 'bg-transparent text-gray-400 cursor-default opacity-80'
                         }`}
                         disabled={!isUnlocked}
                       >
                         {/* Custom Icon Indicator - Centered on line at ~35px */}
                         <div className={`absolute left-[27px] top-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center transition-colors z-20 bg-[#F9FAFF] ${
                           isUnlocked && 'group-hover:bg-white'
                         }`}>
                           {isUnlocked ? (
                             <CheckCircle2 className="w-4 h-4 text-indigo-500 fill-indigo-50" />
                           ) : isInProgress ? (
                             <div className="relative">
                               <div className="absolute inset-0 bg-indigo-100 rounded-full animate-ping opacity-20"></div>
                               <Lock className="w-3.5 h-3.5 text-indigo-500" />
                             </div>
                           ) : (
                             <Lock className="w-3.5 h-3.5 text-gray-300" />
                           )}
                         </div>

                         <span className={`text-xs font-medium truncate ${
                           isUnlocked ? 'font-bold' : ''
                         }`}>
                           {item.title}
                         </span>
                         
                         <div className="text-[10px] font-medium ml-2 shrink-0 min-w-[60px] text-right">
                           {isUnlocked ? (
                             <div className="flex justify-end">
                               <ChevronRight className="w-3.5 h-3.5 text-indigo-400 group-hover:text-indigo-600 transition-colors" />
                             </div>
                           ) : isInProgress ? (
                             <span className="text-indigo-600">
                               {totalUserMessageCount}/{item.target} msgs
                             </span>
                          ) : (
                             <span className="text-gray-400">{item.target} msgs</span>
                           )}
                         </div>
                       </button>
                     )
                   })}
                 </div>
               </div>
             )}
          </div>

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
                                {[...(session.analysisReports || [])]
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


          {/* Bottom User Info */}
          <div className="mt-auto pt-4 border-t border-indigo-100/80 space-y-3">
            {/* Manual Sync Button */}
            <button
              onClick={handleManualSync}
              disabled={isSyncing}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSyncing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>同步中...</span>
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>同步到云端</span>
                  {lastSyncTime && (
                    <span className="text-gray-400">
                      ({new Date(lastSyncTime).toLocaleTimeString()})
                    </span>
                  )}
                </>
              )}
            </button>
            
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
            {/* Title removed */}
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
