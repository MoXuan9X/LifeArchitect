import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { ChatSession } from '@/lib/types'
import { convertMessagesToRounds } from '@/lib/conversationUtils'

// 强制动态路由
export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// 确保 analysis_type 是有效值（数据库只允许 'diagnosis' 或 'roadmap'）
function normalizeAnalysisType(type: string): string {
  // 如果已经是有效值，直接返回
  if (type === 'diagnosis' || type === 'roadmap') {
    return type
  }
  // 中文到英文的映射
  const mapping: { [key: string]: string } = {
    '问题分析': 'diagnosis',
    '行动路线': 'roadmap'
  }
  return mapping[type] || 'diagnosis' // 默认返回 diagnosis
}

// 生成唯一 ID
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

export async function POST(request: NextRequest) {
  try {
    const { userId, sessions } = await request.json() as {
      userId: string
      sessions: ChatSession[]
    }

    if (!userId || !Array.isArray(sessions)) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      )
    }

    console.log(`[Sync] Starting sync for user ${userId}, ${sessions.length} sessions`)

    // 1. 查找或创建用户（通过 username）
    let userUuid: string
    
    // 先尝试查找现有用户
    const { data: existingUser, error: findError } = await supabase
      .from('users')
      .select('id')
      .eq('username', userId)
      .single()

    if (existingUser) {
      userUuid = existingUser.id
      console.log(`[Sync] Found existing user: ${userUuid}`)
    } else {
      // 创建新用户
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          username: userId,
          password_hash: 'temp_hash_' + Date.now(),
          last_login_at: new Date().toISOString()
        })
        .select('id')
        .single()

      if (createError || !newUser) {
        console.error('Error creating user:', createError)
        return NextResponse.json(
          { error: 'Failed to create user', details: createError?.message },
          { status: 500 }
        )
      }

      userUuid = newUser.id
      console.log(`[Sync] Created new user: ${userUuid}`)
    }

    let syncedCount = 0
    let errorCount = 0

    // 2. 处理每个会话
    for (const session of sessions) {
      try {
        // 使用 session.id 作为 conversation_id
        const conversationId = String(session.id)
        
        // 转换消息格式：旧格式 → 新格式（按轮次）
        const conversationRounds = convertMessagesToRounds(session.messages)

        console.log(`[Sync] Session ${session.id}: ${conversationRounds.length} rounds`)

        // 3. 先创建/更新对话（必须先有对话，才能创建分析）
        const { data: existingConversation } = await supabase
          .from('user_conversations')
          .select('id, conversation_id')
          .eq('conversation_id', conversationId)
          .eq('user_id', userUuid)
          .single()

        let savedConversationId: string

        if (existingConversation) {
          // 更新现有对话
          const { data: updated, error: updateError } = await supabase
            .from('user_conversations')
            .update({
              title: session.title,
              conversation_history: conversationRounds,
              round_count: conversationRounds.length
            })
            .eq('id', existingConversation.id)
            .select('id, conversation_id')
            .single()

          if (updateError) {
            console.error('Error updating conversation:', updateError)
            errorCount++
            continue
          }
          savedConversationId = updated.conversation_id
          console.log(`[Sync] Updated conversation: ${updated?.id}`)
        } else {
          // 创建新对话
          const { data: created, error: createError } = await supabase
            .from('user_conversations')
            .insert({
              conversation_id: conversationId,
              user_id: userUuid,
              title: session.title,
              conversation_history: conversationRounds,
              round_count: conversationRounds.length,
              is_deleted: false
            })
            .select('id, conversation_id')
            .single()

          if (createError) {
            console.error('Error creating conversation:', createError)
            errorCount++
            continue
          }
          savedConversationId = created.conversation_id
          console.log(`[Sync] Created conversation: ${created?.id}`)
        }

        // 4. 对话创建成功后，处理分析报告
        const analysisIds: string[] = []
        
        if (session.analysisReports && session.analysisReports.length > 0) {
          for (const report of session.analysisReports) {
            const analysisId = report.id || generateId()
            
            // 检查是否已存在相同的分析
            const { data: existingAnalysis } = await supabase
              .from('conversation_analysis')
              .select('id')
              .eq('analysis_id', analysisId)
              .single()

            if (existingAnalysis) {
              analysisIds.push(existingAnalysis.id)
              console.log(`[Sync] Analysis already exists: ${existingAnalysis.id}`)
              continue
            }

            const { data: analysisData, error: analysisError } = await supabase
              .from('conversation_analysis')
              .insert({
                analysis_id: analysisId,
                conversation_id: savedConversationId,
                analysis_type: normalizeAnalysisType(report.type),
                analysis_content: { content: report.content },
                is_read: report.isRead || false
              })
              .select('id')
              .single()

            if (analysisError) {
              console.error('Error creating conversation analysis:', analysisError)
            } else if (analysisData) {
              analysisIds.push(analysisData.id)
              console.log(`[Sync] Created analysis: ${analysisData.id}`)
            }
          }

          // 5. 更新对话的 conversation_analysis_ids
          if (analysisIds.length > 0) {
            await supabase
              .from('user_conversations')
              .update({ conversation_analysis_ids: analysisIds })
              .eq('conversation_id', savedConversationId)
              .eq('user_id', userUuid)
          }
        }

        syncedCount++

      } catch (err) {
        console.error(`Error processing session ${session.id}:`, err)
        errorCount++
      }
    }

    console.log(`[Sync] Completed: ${syncedCount} synced, ${errorCount} errors`)

    return NextResponse.json({
      success: true,
      message: `Synced ${syncedCount} sessions for user ${userId}`,
      synced: syncedCount,
      errors: errorCount
    })

  } catch (error) {
    console.error('Sync error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
