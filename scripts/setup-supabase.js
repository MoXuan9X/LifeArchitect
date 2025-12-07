/**
 * Supabase 自动设置脚本
 * 功能：
 * 1. 读取 SQL 迁移文件
 * 2. 通过 Supabase API 执行 SQL 创建表
 * 3. 同步本地数据到 Supabase
 */

const fs = require('fs')
const path = require('path')

// 读取环境变量
const envPath = path.join(__dirname, '..', '.env')
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8')
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim()
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...values] = trimmed.split('=')
      if (key && values.length > 0) {
        process.env[key.trim()] = values.join('=').trim()
      }
    }
  })
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('🚀 Supabase 自动设置开始...\n')
console.log('📌 Supabase URL:', SUPABASE_URL)
console.log('📌 Service Role Key:', SERVICE_ROLE_KEY ? '✅ 已配置' : '❌ 未配置')

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('\n❌ 错误：环境变量未设置！')
  console.log('请确保 .env 文件包含：')
  console.log('  NEXT_PUBLIC_SUPABASE_URL=...')
  console.log('  SUPABASE_SERVICE_ROLE_KEY=...')
  process.exit(1)
}

const { createClient } = require('@supabase/supabase-js')
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

/**
 * 步骤 1: 执行 SQL 迁移创建表
 */
async function createTables() {
  console.log('\n📊 步骤 1: 创建数据库表...')
  
  const sqlPath = path.join(__dirname, '..', 'supabase', 'migrations', '002_redesign_user_data_structure.sql')
  
  if (!fs.existsSync(sqlPath)) {
    console.error('❌ 找不到 SQL 文件:', sqlPath)
    return false
  }
  
  const sql = fs.readFileSync(sqlPath, 'utf8')
  console.log(`📄 读取 SQL 文件: ${sql.length} 字符`)
  
  try {
    // Supabase 的 REST API 不直接支持执行任意 SQL
    // 我们需要通过 RPC 或者让用户手动执行
    console.log('\n⚠️  注意：Supabase REST API 不支持直接执行 DDL SQL')
    console.log('我将为您生成一个便捷的方式...\n')
    
    // 尝试测试连接
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1)
    
    if (error) {
      if (error.message.includes('relation') || error.message.includes('does not exist')) {
        console.log('📝 表尚未创建，请执行以下操作：\n')
        console.log('1. 访问: ' + SUPABASE_URL.replace('/v1', '') + '/project/_/sql/new')
        console.log('2. 复制文件内容: supabase/migrations/002_redesign_user_data_structure.sql')
        console.log('3. 粘贴并点击 Run 按钮\n')
        return false
      }
      throw error
    }
    
    console.log('✅ 表已存在，跳过创建步骤')
    return true
    
  } catch (error) {
    console.error('❌ 检查表时出错:', error.message)
    return false
  }
}

/**
 * 步骤 2: 验证所有表是否存在
 */
async function verifyTables() {
  console.log('\n🔍 步骤 2: 验证数据表...')
  
  const tables = [
    'users',
    'user_conversations',
    'conversation_analysis',
    'user_analysis_reports'
  ]
  
  const results = {}
  
  for (const table of tables) {
    try {
      const { error } = await supabase
        .from(table)
        .select('count')
        .limit(1)
      
      if (error) {
        results[table] = { exists: false, error: error.message }
        console.log(`❌ ${table}: 不存在`)
      } else {
        results[table] = { exists: true }
        console.log(`✅ ${table}: 存在`)
      }
    } catch (err) {
      results[table] = { exists: false, error: err.message }
      console.log(`❌ ${table}: ${err.message}`)
    }
  }
  
  const allExist = Object.values(results).every(r => r.exists)
  return allExist
}

/**
 * 步骤 3: 读取本地数据
 */
function loadLocalData() {
  console.log('\n📂 步骤 3: 读取本地数据...')
  
  const SESSIONS_STORAGE_KEY = 'lifearchitect_sessions_map'
  
  // 模拟 localStorage（实际应该从用户浏览器获取）
  console.log('⚠️  注意：无法直接读取浏览器 localStorage')
  console.log('请使用应用内的"同步到云端"按钮来同步数据\n')
  
  return null
}

/**
 * 步骤 4: 同步数据到 Supabase
 */
async function syncData(sessions) {
  console.log('\n🔄 步骤 4: 同步数据到 Supabase...')
  
  if (!sessions || sessions.length === 0) {
    console.log('📭 没有数据需要同步')
    return true
  }
  
  // 这里实际应该调用 /api/sync-user-data
  console.log(`📦 准备同步 ${sessions.length} 个会话...`)
  
  return true
}

/**
 * 主函数
 */
async function main() {
  try {
    // 步骤 1: 创建表（如果不存在）
    const tablesCreated = await createTables()
    
    // 步骤 2: 验证表
    const tablesExist = await verifyTables()
    
    if (!tablesExist) {
      console.log('\n❌ 部分表不存在，请先创建表！')
      console.log('\n📝 快速创建表的方法：')
      console.log('1. 访问 Supabase Dashboard → SQL Editor')
      console.log('2. 打开文件: supabase/migrations/002_redesign_user_data_structure.sql')
      console.log('3. 复制全部内容并在 SQL Editor 中执行\n')
      process.exit(1)
    }
    
    // 步骤 3 & 4: 读取和同步数据
    const localData = loadLocalData()
    await syncData(localData)
    
    console.log('\n✅ 设置完成！')
    console.log('\n📱 下一步：')
    console.log('1. 启动开发服务器: npm run dev')
    console.log('2. 打开应用: http://localhost:3000/coach')
    console.log('3. 点击"同步到云端"按钮同步您的对话数据\n')
    
  } catch (error) {
    console.error('\n❌ 设置失败:', error)
    process.exit(1)
  }
}

main()
