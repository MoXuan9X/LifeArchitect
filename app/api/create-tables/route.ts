import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

/**
 * API 端点：通过 Supabase Management API 创建数据表
 * 
 * 由于 Supabase REST API 不支持 DDL，我们使用以下策略：
 * 1. 读取 SQL 文件
 * 2. 使用 Supabase Management API 执行 SQL
 * 3. 验证表是否创建成功
 */
export async function POST() {
  try {
    console.log('🚀 开始通过 API 创建 Supabase 数据表...')
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { 
          success: false,
          error: '环境变量未配置', 
          details: 'NEXT_PUBLIC_SUPABASE_URL 或 SUPABASE_SERVICE_ROLE_KEY 缺失',
          hint: '请检查 .env 文件'
        },
        { status: 500 }
      )
    }

    // 提取项目 ID
    const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1]
    
    if (!projectRef) {
      return NextResponse.json(
        { 
          success: false,
          error: 'URL 格式错误', 
          details: `无法从 URL 中提取项目 ID: ${supabaseUrl}`
        },
        { status: 500 }
      )
    }

    console.log('📌 项目 ID:', projectRef)
    console.log('📌 Supabase URL:', supabaseUrl)

    // 读取 SQL 迁移文件
    const sqlPath = path.join(process.cwd(), 'supabase', 'migrations', '002_redesign_user_data_structure.sql')
    
    if (!fs.existsSync(sqlPath)) {
      return NextResponse.json(
        { 
          success: false,
          error: 'SQL 文件不存在', 
          path: sqlPath 
        },
        { status: 404 }
      )
    }

    const sqlContent = fs.readFileSync(sqlPath, 'utf8')
    console.log(`📄 读取 SQL 文件: ${sqlContent.length} 字符`)

    // 使用 Supabase Management API 执行 SQL
    // https://supabase.com/docs/reference/api/introduction
    const managementApiUrl = `https://api.supabase.com/v1/projects/${projectRef}/database/query`
    
    console.log('🔄 尝试通过 Management API 执行 SQL...')
    
    const response = await fetch(managementApiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query: sqlContent
      })
    })

    const responseText = await response.text()
    
    if (!response.ok) {
      console.error('❌ Management API 调用失败:', response.status, responseText)
      
      // Management API 可能需要不同的认证方式
      // 让我们尝试替代方案：使用 Supabase client 的 rpc
      console.log('🔄 尝试替代方案：使用 RPC 执行...')
      
      const supabase = createClient(supabaseUrl, supabaseServiceKey)
      
      // 检查是否已经有表存在
      const tables = ['users', 'user_conversations', 'conversation_analysis', 'user_analysis_reports']
      const tableStatus: { [key: string]: { exists: boolean; status?: string; error?: string } } = {}
      
      for (const tableName of tables) {
        const { error } = await supabase.from(tableName).select('id').limit(1)
        if (error && error.code === '42P01') {
          tableStatus[tableName] = { exists: false, error: error.message }
        } else if (error) {
          tableStatus[tableName] = { exists: true, status: 'error', error: error.message }
        } else {
          tableStatus[tableName] = { exists: true, status: 'ok' }
        }
      }
      
      const missingTables = Object.entries(tableStatus).filter(([_, v]) => !v.exists).map(([k, _]) => k)
      
      if (missingTables.length === 0) {
        return NextResponse.json({
          success: true,
          message: '✅ 所有表都已存在！',
          tableStatus,
          note: 'Management API 无法访问，但表已经创建完成'
        })
      }
      
      // 表不存在，需要手动创建
      return NextResponse.json({
        success: false,
        error: '无法通过 API 自动创建表',
        reason: 'Supabase Management API 需要额外的访问令牌',
        missingTables,
        tableStatus,
        solution: {
          step1: '访问 Supabase Dashboard SQL Editor',
          step2: '复制文件内容: supabase/migrations/002_redesign_user_data_structure.sql',
          step3: '粘贴并点击 Run',
          dashboardUrl: `https://supabase.com/dashboard/project/${projectRef}/sql/new`
        },
        sqlContent: sqlContent.substring(0, 500) + '...\n\n(完整内容请查看文件)'
      }, { status: 200 })
    }

    console.log('✅ SQL 执行成功')
    
    // 验证表是否创建成功
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const tables = ['users', 'user_conversations', 'conversation_analysis', 'user_analysis_reports']
    const tableStatus: { [key: string]: { exists: boolean; status?: string } } = {}
    
    for (const tableName of tables) {
      const { error } = await supabase.from(tableName).select('id').limit(1)
      tableStatus[tableName] = {
        exists: !error || error.code !== '42P01',
        status: error ? 'error' : 'ok'
      }
    }

    const allTablesExist = Object.values(tableStatus).every(t => t.exists)

    return NextResponse.json({
      success: allTablesExist,
      message: allTablesExist ? '✅ 所有表创建成功！' : '⚠️ 部分表创建失败',
      tableStatus,
      projectRef
    })

  } catch (error) {
    console.error('❌ 创建表失败:', error)
    return NextResponse.json(
      { 
        success: false,
        error: '创建表失败', 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return POST()
}

