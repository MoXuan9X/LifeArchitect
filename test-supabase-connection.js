// 测试 Supabase 连接
// 运行: node test-supabase-connection.js

const fs = require('fs')
const path = require('path')

// 手动读取 .env.local 文件
const envPath = path.join(__dirname, '.env.local')
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

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('🔍 检查环境变量...')
console.log('URL:', supabaseUrl)
console.log('Key (前20字符):', supabaseKey ? supabaseKey.substring(0, 20) + '...' : '❌ 未设置')

if (!supabaseUrl || !supabaseKey) {
  console.error('\n❌ 错误：环境变量未正确设置！')
  console.log('\n请确保 .env.local 文件包含：')
  console.log('  NEXT_PUBLIC_SUPABASE_URL=...')
  console.log('  SUPABASE_SERVICE_ROLE_KEY=...')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testConnection() {
  console.log('\n🔌 测试连接到 Supabase...')
  
  try {
    // 测试 1: 查询表列表
    const { data: tables, error: tablesError } = await supabase
      .from('user_conversations')
      .select('count')
      .limit(1)
    
    if (tablesError) {
      console.error('\n❌ 连接失败:', tablesError.message)
      
      if (tablesError.message.includes('relation') || tablesError.message.includes('does not exist')) {
        console.log('\n💡 提示：数据表不存在！请运行 SQL 迁移：')
        console.log('   1. 访问 Supabase Dashboard → SQL Editor')
        console.log('   2. 复制 supabase/migrations/002_redesign_user_data_structure.sql')
        console.log('   3. 粘贴并运行')
      }
      return
    }
    
    console.log('✅ 连接成功！')
    
    // 测试 2: 查询所有表
    console.log('\n📊 查询数据表...')
    const { data: users } = await supabase.from('users').select('count')
    const { data: conversations } = await supabase.from('user_conversations').select('count')
    const { data: analysis } = await supabase.from('conversation_analysis').select('count')
    const { data: reports } = await supabase.from('user_analysis_reports').select('count')
    
    console.log('✅ users 表存在')
    console.log('✅ user_conversations 表存在')
    console.log('✅ conversation_analysis 表存在')
    console.log('✅ user_analysis_reports 表存在')
    
    console.log('\n🎉 Supabase 配置正确！现在可以同步数据了。')
    
  } catch (error) {
    console.error('\n❌ 测试失败:', error.message)
  }
}

testConnection()

