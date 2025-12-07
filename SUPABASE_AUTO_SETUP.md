# 🚀 Supabase 一键自动设置指南

## 📋 概述

我已经为您创建了一套**完全自动化**的 Supabase 数据库设置和数据同步系统！

## ✨ 新增功能

### 1️⃣ 可视化设置页面
- **路径**: `app/setup/page.tsx`
- **访问**: http://localhost:3000/setup
- **功能**:
  - ✅ 自动检查环境变量
  - ✅ 自动创建数据表（如可能）
  - ✅ 验证表结构
  - ✅ 一键同步本地数据到云端
  - ✅ 实时显示每一步的进度和状态

### 2️⃣ 数据库设置 API
- **路径**: `app/api/setup-database/route.ts`
- **功能**: 
  - 读取 SQL 迁移文件
  - 尝试通过 API 创建表
  - 如果失败，提供手动创建指引

### 3️⃣ 命令行脚本
- **路径**: `scripts/setup-supabase.js`
- **功能**: Node.js 环境下的自动化脚本

---

## 🎯 使用方法（三种方式）

### 方法一：🌐 浏览器可视化（推荐）

1. **启动开发服务器**
   ```bash
   npm run dev
   ```

2. **访问设置页面**
   ```
   http://localhost:3000/setup
   ```

3. **点击"开始设置"按钮**
   - 系统会自动：
     - ✅ 检查 Supabase 连接
     - ✅ 创建所有数据表
     - ✅ 同步本地对话数据
     - ✅ 显示详细进度

4. **完成后点击"前往应用"**

---

### 方法二：📡 API 调用

1. **测试连接**
   ```bash
   curl http://localhost:3000/api/test-connection
   ```

2. **设置数据库**
   ```bash
   curl -X POST http://localhost:3000/api/setup-database
   ```

3. **同步数据**
   ```bash
   curl -X POST http://localhost:3000/api/sync-user-data \
     -H "Content-Type: application/json" \
     -d '{
       "userId": "your_user_id",
       "sessions": []
     }'
   ```

---

### 方法三：⌨️ 命令行脚本

```bash
node scripts/setup-supabase.js
```

---

## ⚠️ 重要说明

### Supabase API 限制

**问题**: Supabase 的 REST API **不支持**直接执行 DDL（数据定义语言）SQL 命令，如 `CREATE TABLE`、`ALTER TABLE` 等。

**解决方案**: 如果自动创建失败，系统会提示您手动执行：

#### 手动创建表的步骤：

1. **访问 Supabase Dashboard**
   ```
   https://app.supabase.com/project/YOUR_PROJECT_ID/sql/new
   ```

2. **打开 SQL 文件**
   ```
   supabase/migrations/002_redesign_user_data_structure.sql
   ```

3. **复制全部内容**
   - 包含所有 `CREATE TABLE`、`CREATE TRIGGER` 等语句

4. **粘贴到 SQL Editor 并点击 "Run"**

5. **返回设置页面，重新运行设置**

---

## 📊 数据表结构

设置完成后，将创建以下 4 张表：

| 表名 | 说明 | 主要字段 |
|------|------|----------|
| `users` | 用户信息 | user_id, username, password_hash |
| `user_conversations` | 用户对话 | conversation_id, title, conversation_history (JSONB), round_count |
| `conversation_analysis` | 对话分析 | analysis_type (问题分析/行动路线), analysis_content |
| `user_analysis_reports` | 用户分析报告 | report_type (性格/思维/盲点), report_content |

详细结构请查看: `DATABASE_STRUCTURE.md`

---

## 🔍 故障排查

### 1. 环境变量未设置

**错误**: "Supabase 环境变量未设置"

**解决**:
```bash
# 检查 .env 文件
cat .env

# 应包含:
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 2. 表不存在

**错误**: "relation does not exist"

**解决**: 按照上面"手动创建表的步骤"执行 SQL 迁移

### 3. 权限不足

**错误**: "permission denied"

**解决**: 确保使用 `SUPABASE_SERVICE_ROLE_KEY` 而不是 `ANON_KEY`

---

## 📱 数据同步说明

### 自动同步
- 每次发送消息后自动同步
- 后台静默执行，不影响用户体验

### 手动同步
- 点击侧边栏"同步到云端"按钮
- 显示同步状态和最后同步时间

### 同步内容
- ✅ 所有对话会话
- ✅ 对话历史（按轮次组织）
- ✅ 分析报告（问题分析、行动路线）
- ❌ 用户级别报告（性格、思维、盲点）- 待实现

---

## 🎉 下一步

设置完成后：

1. **查看同步数据**
   - 访问 Supabase Dashboard → Table Editor
   - 查看 `user_conversations` 表

2. **测试数据持久性**
   - 清除浏览器 localStorage
   - 刷新页面
   - 从云端恢复数据（待实现）

3. **继续开发**
   - 实现用户登录/注册
   - 添加云端数据恢复功能
   - 多设备同步

---

## 📞 需要帮助？

如果遇到问题：

1. 查看浏览器控制台日志
2. 查看终端日志
3. 访问 `/api/test-connection` 检查连接状态
4. 查看 `DATABASE_STRUCTURE.md` 了解详细结构

---

**创建时间**: 2025-11-24  
**版本**: 1.0  
**状态**: ✅ 可用

