import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

/**
 * API 端点：自动设置 Supabase 数据库
 * 访问: http://localhost:3000/api/setup-database
 */
export async function POST() {
  try {
    console.log('🚀 开始设置 Supabase 数据库...')
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: '环境变量未配置', details: 'NEXT_PUBLIC_SUPABASE_URL 或 SUPABASE_SERVICE_ROLE_KEY 缺失' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // 读取 SQL 文件
    const sqlPath = path.join(process.cwd(), 'supabase', 'migrations', '002_redesign_user_data_structure.sql')
    
    if (!fs.existsSync(sqlPath)) {
      return NextResponse.json(
        { error: 'SQL 文件不存在', path: sqlPath },
        { status: 404 }
      )
    }

    const sqlContent = fs.readFileSync(sqlPath, 'utf8')
    
    // 将 SQL 分解为多个语句
    const statements = sqlContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))

    console.log(`📄 找到 ${statements.length} 条 SQL 语句`)

    const results = []
    let successCount = 0
    let errorCount = 0

    // 逐条执行 SQL（使用 Supabase 的 rpc 或直接执行）
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';'
      
      try {
        // Supabase REST API 不支持直接执行 DDL
        // 我们需要使用 PostgREST 的 rpc 功能
        // 但这需要先创建一个执行函数
        
        console.log(`执行语句 ${i + 1}/${statements.length}`)
        
        // 尝试通过检查表是否存在来判断
        if (statement.includes('CREATE TABLE')) {
          const tableMatch = statement.match(/CREATE TABLE (\w+)/i)
          if (tableMatch) {
            const tableName = tableMatch[1]
            const { error } = await supabase.from(tableName).select('count').limit(1)
            
            if (!error) {
              console.log(`✅ 表 ${tableName} 已存在`)
              successCount++
              results.push({ statement: `Table ${tableName}`, success: true, message: '已存在' })
              continue
            }
          }
        }
        
        results.push({ statement: statement.substring(0, 50) + '...', success: false, message: '需要手动执行' })
        errorCount++
        
      } catch (err) {
        console.error(`❌ 执行失败:`, err)
        results.push({ 
          statement: statement.substring(0, 50) + '...', 
          success: false, 
          error: err instanceof Error ? err.message : String(err) 
        })
        errorCount++
      }
    }

    // 验证表是否存在
    const tables = ['users', 'user_conversations', 'conversation_analysis', 'user_analysis_reports']
    const tableStatus: { [key: string]: boolean } = {}
    
    for (const table of tables) {
      const { error } = await supabase.from(table).select('count').limit(1)
      tableStatus[table] = !error || error.code !== '42P01'
    }

    const allTablesExist = Object.values(tableStatus).every(exists => exists)

    if (!allTablesExist) {
      return NextResponse.json({
        success: false,
        message: '⚠️ 无法通过 API 直接创建表。Supabase REST API 不支持 DDL 操作。',
        instruction: '请访问 Supabase Dashboard → SQL Editor，复制并执行 SQL 文件',
        sqlPath: 'supabase/migrations/002_redesign_user_data_structure.sql',
        dashboardUrl: supabaseUrl.replace('/rest/v1', '') + '/project/_/sql/new',
        tableStatus,
        results
      }, { status: 200 })
    }

    return NextResponse.json({
      success: true,
      message: '✅ 所有表都已创建！',
      tableStatus,
      stats: {
        total: statements.length,
        success: successCount,
        errors: errorCount
      }
    })

  } catch (error) {
    console.error('❌ 设置数据库失败:', error)
    return NextResponse.json(
      { 
        error: '设置失败', 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return POST()
}

