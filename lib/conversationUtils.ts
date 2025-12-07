import { Message } from './types'

/**
 * 对话轮次接口（新格式）
 */
export interface ConversationRound {
  round: number
  user_message: {
    content: string
    timestamp: number
  }
  assistant_message: {
    content: string
    timestamp: number
  }
}

/**
 * 将旧格式的消息列表转换为新格式的轮次数组
 * 
 * 旧格式：[{role: 'user', content: '...', timestamp: 123}, {role: 'assistant', ...}, ...]
 * 新格式：[{round: 1, user_message: {...}, assistant_message: {...}}, ...]
 */
export function convertMessagesToRounds(messages: Message[]): ConversationRound[] {
  const rounds: ConversationRound[] = []
  
  for (let i = 0; i < messages.length; i += 2) {
    const userMsg = messages[i]
    const assistantMsg = messages[i + 1]
    
    // 确保配对完整（用户消息 + AI 消息）
    if (!userMsg || !assistantMsg || userMsg.role !== 'user' || assistantMsg.role !== 'assistant') {
      console.warn(`[convertMessagesToRounds] Incomplete round at index ${i}`)
      continue
    }
    
    rounds.push({
      round: Math.floor(i / 2) + 1,
      user_message: {
        content: userMsg.content,
        timestamp: userMsg.timestamp
      },
      assistant_message: {
        content: assistantMsg.content,
        timestamp: assistantMsg.timestamp
      }
    })
  }
  
  return rounds
}

/**
 * 计算对话轮数
 */
export function calculateRoundCount(messages: Message[]): number {
  // 过滤出完整的轮次（必须是用户+助手的配对）
  let count = 0
  for (let i = 0; i < messages.length; i += 2) {
    if (messages[i]?.role === 'user' && messages[i + 1]?.role === 'assistant') {
      count++
    }
  }
  return count
}

/**
 * 将新格式的轮次数组转换回旧格式的消息列表
 * （用于向后兼容）
 */
export function convertRoundsToMessages(rounds: ConversationRound[]): Message[] {
  const messages: Message[] = []
  
  for (const round of rounds) {
    messages.push({
      role: 'user',
      content: round.user_message.content,
      timestamp: round.user_message.timestamp
    })
    
    messages.push({
      role: 'assistant',
      content: round.assistant_message.content,
      timestamp: round.assistant_message.timestamp
    })
  }
  
  return messages
}

/**
 * 检测对话历史的格式
 */
export function detectConversationFormat(data: any[]): 'rounds' | 'messages' | 'unknown' {
  if (!Array.isArray(data) || data.length === 0) {
    return 'unknown'
  }
  
  const first = data[0]
  
  // 新格式：包含 round, user_message, assistant_message
  if (first?.round !== undefined && first?.user_message !== undefined && first?.assistant_message !== undefined) {
    return 'rounds'
  }
  
  // 旧格式：包含 role, content, timestamp
  if (first?.role !== undefined && first?.content !== undefined) {
    return 'messages'
  }
  
  return 'unknown'
}

