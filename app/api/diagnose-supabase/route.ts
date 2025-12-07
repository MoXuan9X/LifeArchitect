import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({
        success: false,
        error: '环境变量未配置',
        env: {
          url: !!supabaseUrl,
          serviceKey: !!supabaseServiceKey,
          anonKey: !!supabaseAnonKey
        }
      }, { status: 500 })
    }

    // 使用 service role key 创建客户端（有完全权限）
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    const diagnosis: any = {
      timestamp: new Date().toISOString(),
      supabaseUrl,
      tables: {},
      operations: {},
      summary: {
        allTablesExist: false,
        canRead: false,
        canWrite: false
      }
    }

    // 检查每个表
    const tables = ['users', 'user_conversations', 'conversation_analysis', 'user_analysis_reports']
    
    for (const table of tables) {
      console.log(`[Diagnose] Checking table: ${table}`)
      
      // 测试读取
      const { data: selectData, error: selectError } = await supabase
        .from(table)
        .select('*')
        .limit(1)

      if (selectError) {
        diagnosis.tables[table] = {
          exists: false,
          canRead: false,
          error: selectError.message,
          errorCode: selectError.code,
          errorDetails: selectError.details
        }
        console.error(`[Diagnose] Table ${table} error:`, selectError)
      } else {
        diagnosis.tables[table] = {
          exists: true,
          canRead: true,
          rowCount: selectData?.length || 0
        }
        console.log(`[Diagnose] Table ${table} OK, ${selectData?.length || 0} rows`)
      }
    }

    // 测试写入（users 表）
    try {
      const testUserId = 'test_diagnose_' + Date.now()
      const { data: insertData, error: insertError } = await supabase
        .from('users')
        .upsert({
          user_id: testUserId,
          username: testUserId,
          password_hash: 'test_hash'
        })
        .select()

      if (insertError) {
        diagnosis.operations.write = {
          success: false,
          error: insertError.message
        }
      } else {
        diagnosis.operations.write = {
          success: true,
          message: '测试写入成功'
        }

        // 删除测试数据
        await supabase
          .from('users')
          .delete()
          .eq('user_id', testUserId)
      }
    } catch (err) {
      diagnosis.operations.write = {
        success: false,
        error: err instanceof Error ? err.message : String(err)
      }
    }

    // 汇总
    const allTablesExist = Object.values(diagnosis.tables).every((t: any) => t.exists)
    const allTablesCanRead = Object.values(diagnosis.tables).every((t: any) => t.canRead)
    
    diagnosis.summary = {
      allTablesExist,
      canRead: allTablesCanRead,
      canWrite: diagnosis.operations.write?.success || false,
      missingTables: Object.entries(diagnosis.tables)
        .filter(([_, v]: [string, any]) => !v.exists)
        .map(([k, _]) => k)
    }

    const success = allTablesExist && allTablesCanRead && diagnosis.summary.canWrite

    return NextResponse.json({
      success,
      message: success 
        ? '✅ Supabase 连接完全正常' 
        : '⚠️ Supabase 存在问题',
      diagnosis
    })

  } catch (error) {
    console.error('[Diagnose] Error:', error)
    return NextResponse.json({
      success: false,
      error: '诊断失败',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}

