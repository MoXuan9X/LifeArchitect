import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  console.log('🔍 检查环境变量...')
  console.log('URL:', supabaseUrl)
  console.log('Key 存在:', !!supabaseKey)

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({
      success: false,
      error: '环境变量未设置',
      details: {
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseKey
      }
    }, { status: 500 })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey)

    // 测试连接 - 查询每个表
    const tables = [
      'users',
      'user_conversations',
      'conversation_analysis',
      'user_analysis_reports'
    ]

    const results: any = {
      success: true,
      supabaseUrl,
      tables: {}
    }

    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('count')
          .limit(1)

        if (error) {
          results.tables[table] = {
            exists: false,
            error: error.message
          }
        } else {
          results.tables[table] = {
            exists: true,
            status: 'ok'
          }
        }
      } catch (err) {
        results.tables[table] = {
          exists: false,
          error: err instanceof Error ? err.message : String(err)
        }
      }
    }

    // 检查是否所有表都存在
    const allTablesExist = Object.values(results.tables).every(
      (t: any) => t.exists
    )

    if (!allTablesExist) {
      results.success = false
      results.message = '部分表不存在，请运行 SQL 迁移'
    } else {
      results.message = '✅ 所有表都已创建！连接成功！'
    }

    return NextResponse.json(results)

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: '连接失败',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}

