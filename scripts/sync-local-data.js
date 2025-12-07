/**
 * 从浏览器 localStorage 同步数据到 Supabase
 * 运行: node scripts/sync-local-data.js <user_id>
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

const userId = process.argv[2] || 'default_user'

console.log('🔄 同步本地数据到 Supabase')
console.log(`   用户ID: ${userId}\n`)

async function syncData() {
  try {
    const response = await fetch('http://localhost:3000/api/sync-user-data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId: userId,
        sessions: [] // 需要从 localStorage 获取
      })
    })

    const result = await response.json()
    
    if (result.success) {
      console.log('✅ 同步成功！')
      console.log(`   已同步: ${result.synced} 个会话`)
      if (result.errors > 0) {
        console.log(`   错误: ${result.errors} 个`)
      }
    } else {
      console.error('❌ 同步失败:', result.error)
    }
  } catch (error) {
    console.error('❌ 请求失败:', error.message)
    console.log('\n💡 提示：')
    console.log('   1. 确保开发服务器正在运行: npm run dev')
    console.log('   2. 访问: http://localhost:3000/coach')
    console.log('   3. 使用浏览器中的 "同步到云端" 按钮')
  }
}

syncData()

