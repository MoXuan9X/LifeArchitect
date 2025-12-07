import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    
    // 提取项目 ID
    const projectRef = supabaseUrl?.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] || ''
    
    // 读取 SQL 文件
    const sqlPath = path.join(process.cwd(), 'supabase', 'migrations', '002_redesign_user_data_structure.sql')
    
    if (!fs.existsSync(sqlPath)) {
      return NextResponse.json(
        { error: 'SQL 文件不存在', path: sqlPath },
        { status: 404 }
      )
    }
    
    const sqlContent = fs.readFileSync(sqlPath, 'utf8')
    
    return NextResponse.json({
      success: true,
      sqlContent,
      projectRef,
      supabaseUrl,
      dashboardUrl: `https://supabase.com/dashboard/project/${projectRef}/sql/new`
    })
    
  } catch (error) {
    console.error('Error reading SQL file:', error)
    return NextResponse.json(
      { error: '读取 SQL 文件失败', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

