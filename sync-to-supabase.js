/**
 * 直接同步本地数据到 Supabase
 * 使用方法：node sync-to-supabase.js
 */

const http = require('http');

// 模拟从 localStorage 读取的数据（需要您手动提供）
// 您需要打开浏览器控制台，执行以下命令获取数据：
// console.log(JSON.stringify({
//   userId: localStorage.getItem('lifearchitect_current_user'),
//   sessions: JSON.parse(localStorage.getItem('lifearchitect_sessions_map') || '{}')
// }))

console.log('🚀 Supabase 数据同步工具\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// 检查服务器是否运行
console.log('1️⃣ 检查开发服务器...');

const checkServer = () => {
  return new Promise((resolve, reject) => {
    const req = http.get('http://localhost:3000/api/test-connection', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve(result);
        } catch (err) {
          reject(new Error('服务器响应无效'));
        }
      });
    });
    
    req.on('error', (err) => {
      reject(new Error('服务器未运行或连接失败'));
    });
    
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('连接超时'));
    });
  });
};

const syncData = (userId, sessions) => {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ userId, sessions });
    
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/sync-user-data',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (res.statusCode === 200 && result.success) {
            resolve(result);
          } else {
            reject(new Error(result.error || result.details || '同步失败'));
          }
        } catch (err) {
          reject(new Error('服务器响应无效: ' + data));
        }
      });
    });
    
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
};

async function main() {
  try {
    // 检查服务器
    await checkServer();
    console.log('   ✅ 开发服务器正常运行\n');
    
    console.log('2️⃣ 获取本地数据...\n');
    console.log('   ⚠️  需要从浏览器获取数据！\n');
    console.log('   请按照以下步骤操作：\n');
    console.log('   步骤 1：打开浏览器访问 http://localhost:3000/coach');
    console.log('   步骤 2：按 F12 打开开发者工具，切换到 Console 标签');
    console.log('   步骤 3：复制并执行以下代码：\n');
    console.log('   ┌─────────────────────────────────────────────────────────┐');
    console.log('   │ const userId = localStorage.getItem(\'lifearchitect_current_user\') || \'default_user\';');
    console.log('   │ const sessionsMap = JSON.parse(localStorage.getItem(\'lifearchitect_sessions_map\') || \'{}\');');
    console.log('   │ const sessions = sessionsMap[userId] || [];');
    console.log('   │ console.log(\'用户ID:\', userId);');
    console.log('   │ console.log(\'会话数量:\', sessions.length);');
    console.log('   │ copy(JSON.stringify({ userId, sessions }));');
    console.log('   │ console.log(\'✅ 数据已复制到剪贴板！\');');
    console.log('   └─────────────────────────────────────────────────────────┘\n');
    console.log('   步骤 4：数据会自动复制到剪贴板');
    console.log('   步骤 5：编辑本文件，将数据粘贴到下面的 DATA 变量中');
    console.log('   步骤 6：重新运行 node sync-to-supabase.js\n');
    
    // 在这里粘贴从浏览器复制的数据
    const DATA = null; // 替换为: JSON.parse('粘贴的数据')
    
    if (!DATA) {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      console.log('⏸️  等待数据输入...\n');
      process.exit(0);
    }
    
    console.log('3️⃣ 开始同步...\n');
    console.log(`   用户: ${DATA.userId}`);
    console.log(`   会话: ${DATA.sessions.length} 个\n`);
    
    const result = await syncData(DATA.userId, DATA.sessions);
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('✅ 同步成功！\n');
    console.log(`   已同步: ${result.synced} 个会话`);
    if (result.errors > 0) {
      console.log(`   失败: ${result.errors} 个会话`);
    }
    console.log(`\n   ${result.message}\n`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
  } catch (error) {
    console.error('\n❌ 错误:', error.message, '\n');
    
    if (error.message.includes('服务器未运行')) {
      console.log('💡 解决方案：');
      console.log('   1. 在另一个终端运行: npm run dev');
      console.log('   2. 等待启动完成');
      console.log('   3. 重新运行本脚本\n');
    }
    
    process.exit(1);
  }
}

main();

