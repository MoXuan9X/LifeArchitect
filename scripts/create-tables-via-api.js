/**
 * 通过 Supabase Management API 创建数据表
 * 
 * 需要：
 * 1. Supabase Access Token (从 Dashboard → Account → Access Tokens 获取)
 * 2. 或者使用 SQL 执行端点
 */

const fs = require('fs')
const path = require('path')
const https = require('https')

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

console.log('🚀 Supabase 数据表创建工具\n')
console.log('📌 Supabase URL:', SUPABASE_URL)
console.log('📌 Service Role Key:', SERVICE_ROLE_KEY ? '✅ 已配置' : '❌ 未配置')

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('\n❌ 错误：环境变量未设置！')
  process.exit(1)
}

// 提取项目 ID
const projectRef = SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1]
console.log('📌 项目 ID:', projectRef)

// 读取 SQL 文件
const sqlPath = path.join(__dirname, '..', 'supabase', 'migrations', '002_redesign_user_data_structure.sql')
const sqlContent = fs.readFileSync(sqlPath, 'utf8')

console.log(`\n📄 读取 SQL 文件: ${sqlContent.length} 字符\n`)

// 分解 SQL 为多个语句
const statements = sqlContent
  .split(';')
  .map(s => s.trim())
  .filter(s => s.length > 0 && !s.startsWith('--'))

console.log(`📊 共 ${statements.length} 条 SQL 语句\n`)

console.log('⚠️  注意：Supabase REST API 不支持直接执行 DDL 命令！\n')
console.log('请使用以下方法之一：\n')

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('方法 1：使用 Supabase Dashboard（推荐）')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

console.log('1. 访问 SQL Editor:')
console.log(`   https://supabase.com/dashboard/project/${projectRef}/sql/new\n`)

console.log('2. 复制并执行以下 SQL:\n')
console.log('━'.repeat(60))
console.log(sqlContent.substring(0, 800) + '\n   ...(省略，完整内容见文件)\n')
console.log('━'.repeat(60))

console.log('\n3. 点击 "Run" 按钮\n')

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('方法 2：使用 Supabase CLI（如已安装）')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

console.log('npm install -g supabase')
console.log('supabase login')
console.log(`supabase db push --db-url "${SUPABASE_URL}"\n`)

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('方法 3：使用 psql 直接连接（如有数据库直连权限）')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

console.log('从 Supabase Dashboard → Project Settings → Database 获取连接字符串\n')
console.log(`psql "postgresql://postgres:[PASSWORD]@db.${projectRef}.supabase.co:5432/postgres" < ${sqlPath}\n`)

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

console.log('✅ 完成后，运行以下命令验证：\n')
console.log('   curl http://localhost:3000/api/test-connection\n')
console.log('   或访问: http://localhost:3000/setup\n')

// 自动打开 Dashboard
console.log('🌐 正在尝试打开 Supabase Dashboard...\n')

const dashboardUrl = `https://supabase.com/dashboard/project/${projectRef}/sql/new`

// 根据操作系统打开浏览器
const { exec } = require('child_process')
const opener = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open'

exec(`${opener} "${dashboardUrl}"`, (error) => {
  if (error) {
    console.log(`请手动访问: ${dashboardUrl}`)
  } else {
    console.log(`✅ 已在浏览器中打开 SQL Editor`)
  }
})

