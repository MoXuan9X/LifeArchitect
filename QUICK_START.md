# 快速开始：Supabase 配置 & 数据同步

## 🎯 第一步：创建 Supabase 项目

1. 访问 https://supabase.com/dashboard
2. 点击 "New Project"
3. 填写项目信息：
   - Name: `LifeArchitect`
   - Database Password: (设置一个强密码)
   - Region: (选择离您最近的区域)
4. 等待项目创建完成（约 2 分钟）

---

## 🗄️ 第二步：运行数据库迁移

### 方法 A：使用 SQL Editor（推荐）

1. 在 Supabase Dashboard 左侧菜单，点击 **SQL Editor**
2. 点击 **New query**
3. 复制下面的完整 SQL 代码
4. 粘贴到编辑器中
5. 点击 **Run** 或按 `Ctrl/Cmd + Enter`

**SQL 代码位置**：
```
项目根目录/supabase/migrations/002_redesign_user_data_structure.sql
```

或直接复制下面的代码：

<details>
<summary>📝 点击展开完整 SQL 代码</summary>

```sql
-- Drop old tables if they exist (WARNING: This will delete existing data)
DROP TABLE IF EXISTS analysis_reports CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS chat_sessions CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- 1. 用户信息表
-- ============================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ
);

-- ============================================
-- 2. 用户对话表
-- ============================================
CREATE TABLE user_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id TEXT UNIQUE NOT NULL,
  user_id TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  
  -- 对话历史：按轮次组织
  conversation_history JSONB NOT NULL DEFAULT '[]'::jsonb,
  round_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  
  conversation_analysis_ids TEXT[] DEFAULT '{}'::TEXT[]
);

-- ============================================
-- 3. 对话分析表
-- ============================================
CREATE TABLE conversation_analysis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  analysis_id TEXT UNIQUE NOT NULL,
  conversation_id TEXT NOT NULL REFERENCES user_conversations(conversation_id) ON DELETE CASCADE,
  analysis_type TEXT NOT NULL CHECK (analysis_type IN ('diagnosis', 'roadmap')),
  analysis_content JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_read BOOLEAN DEFAULT FALSE
);

-- ============================================
-- 4. 用户分析报告表
-- ============================================
CREATE TABLE user_analysis_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id TEXT UNIQUE NOT NULL,
  user_id TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  report_type TEXT NOT NULL CHECK (report_type IN ('personality', 'thought_pattern', 'blind_spot')),
  report_content JSONB NOT NULL,
  
  message_count_at_generation INTEGER,
  conversations_analyzed TEXT[],
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_read BOOLEAN DEFAULT FALSE
);

-- ============================================
-- 索引优化
-- ============================================
CREATE INDEX idx_users_user_id ON users(user_id);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_conversations_user_id ON user_conversations(user_id);
CREATE INDEX idx_conversations_conversation_id ON user_conversations(conversation_id);
CREATE INDEX idx_conversations_created_at ON user_conversations(created_at DESC);
CREATE INDEX idx_conversations_is_deleted ON user_conversations(is_deleted) WHERE is_deleted = FALSE;
CREATE INDEX idx_conversation_analysis_conversation_id ON conversation_analysis(conversation_id);
CREATE INDEX idx_conversation_analysis_type ON conversation_analysis(analysis_type);
CREATE INDEX idx_conversation_analysis_is_read ON conversation_analysis(is_read);
CREATE INDEX idx_user_reports_user_id ON user_analysis_reports(user_id);
CREATE INDEX idx_user_reports_type ON user_analysis_reports(report_type);
CREATE INDEX idx_user_reports_created_at ON user_analysis_reports(created_at DESC);

-- ============================================
-- 触发器：自动更新 updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_conversations_updated_at 
  BEFORE UPDATE ON user_conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_reports_updated_at 
  BEFORE UPDATE ON user_analysis_reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 触发器：软删除时自动记录删除时间
-- ============================================
CREATE OR REPLACE FUNCTION set_deleted_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_deleted = TRUE AND OLD.is_deleted = FALSE THEN
    NEW.deleted_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_conversation_deleted_at
  BEFORE UPDATE ON user_conversations
  FOR EACH ROW EXECUTE FUNCTION set_deleted_at();

-- ============================================
-- 触发器：自动更新对话轮数
-- ============================================
CREATE OR REPLACE FUNCTION update_round_count()
RETURNS TRIGGER AS $$
BEGIN
  NEW.round_count = jsonb_array_length(NEW.conversation_history);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_conversation_round_count
  BEFORE INSERT OR UPDATE OF conversation_history ON user_conversations
  FOR EACH ROW EXECUTE FUNCTION update_round_count();

-- ============================================
-- 辅助函数：查询用户的所有未删除对话
-- ============================================
CREATE OR REPLACE FUNCTION get_user_conversations(p_user_id TEXT)
RETURNS TABLE (
  conversation_id TEXT,
  title TEXT,
  created_at TIMESTAMPTZ,
  message_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    uc.conversation_id,
    uc.title,
    uc.created_at,
    uc.round_count as message_count
  FROM user_conversations uc
  WHERE uc.user_id = p_user_id 
    AND uc.is_deleted = FALSE
  ORDER BY uc.updated_at DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 辅助函数：统计用户总轮数
-- ============================================
CREATE OR REPLACE FUNCTION get_user_total_rounds(p_user_id TEXT)
RETURNS INTEGER AS $$
DECLARE
  total INTEGER;
BEGIN
  SELECT COALESCE(SUM(round_count), 0)
  INTO total
  FROM user_conversations
  WHERE user_id = p_user_id AND is_deleted = FALSE;
  
  RETURN total;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 注释
-- ============================================
COMMENT ON TABLE users IS '用户信息表：存储用户基本信息和认证数据';
COMMENT ON TABLE user_conversations IS '用户对话表：存储每个对话的完整历史';
COMMENT ON TABLE conversation_analysis IS '对话分析表：存储针对单个对话的分析结果';
COMMENT ON TABLE user_analysis_reports IS '用户分析报告表：存储跨对话的用户综合画像分析';

COMMENT ON COLUMN user_conversations.conversation_history IS '完整对话历史（按轮次组织），格式：[{round, user_message: {content, timestamp}, assistant_message: {content, timestamp}}, ...]';
COMMENT ON COLUMN user_conversations.round_count IS '对话轮数，由触发器自动计算和更新';
COMMENT ON COLUMN user_conversations.is_deleted IS '软删除标记，TRUE表示已删除但保留数据';
COMMENT ON COLUMN conversation_analysis.analysis_type IS 'diagnosis=问题诊断, roadmap=行动路线';
COMMENT ON COLUMN user_analysis_reports.report_type IS 'personality=性格分析, thought_pattern=思维模式, blind_spot=盲点分析';
```

</details>

### 方法 B：使用 Supabase CLI（可选）

```bash
# 安装 Supabase CLI
npm install -g supabase

# 链接到您的项目
supabase link --project-ref your-project-ref

# 运行迁移
supabase db push
```

---

## 🔑 第三步：获取 API 凭据

1. 在 Supabase Dashboard，点击左侧的 **Settings** (齿轮图标)
2. 选择 **API**
3. 复制以下信息：
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` ⚠️ (保密！)

---

## ⚙️ 第四步：配置环境变量

在项目根目录创建 `.env.local` 文件：

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# SiliconFlow API (如果已有，保留)
NEXT_PUBLIC_SILICONFLOW_API_KEY=your_existing_key
```

**⚠️ 注意**：
- `.env.local` 文件已在 `.gitignore` 中，不会上传到 Git
- **绝对不要**将 `SUPABASE_SERVICE_ROLE_KEY` 暴露在客户端代码中

---

## 🚀 第五步：重启开发服务器

```bash
# 停止当前服务器 (Ctrl + C)
# 重新启动
npm run dev
```

---

## ✅ 第六步：验证数据表创建成功

### 6.1 在 Supabase Dashboard 中验证

1. 点击左侧 **Table Editor**
2. 您应该看到 4 张表：
   - ✅ `users`
   - ✅ `user_conversations`
   - ✅ `conversation_analysis`
   - ✅ `user_analysis_reports`

### 6.2 查看表结构

点击任意表名，查看字段：

**user_conversations** 应该包含：
- `id` (uuid)
- `conversation_id` (text)
- `user_id` (text)
- `title` (text)
- `conversation_history` (jsonb)
- `round_count` (int4) ← 这是新增的轮数字段
- `created_at`, `updated_at`
- `is_deleted`, `deleted_at`

---

## 🔄 第七步：同步本地数据到 Supabase

### 方法 A：使用手动同步按钮（推荐）

1. 打开您的应用 http://localhost:3000/coach
2. 确保您有一些本地对话数据
3. **点击左侧边栏底部**的 **"同步到云端"** 按钮
4. 等待同步完成，会显示 Toast 提示：
   - ✅ 成功：`已同步 X 个会话到云端`
   - ❌ 失败：显示错误信息

### 方法 B：自动同步（已启用）

- 发送任意一条新消息
- 系统会自动在后台同步
- 打开浏览器控制台（F12），查看日志：
  ```
  [Sync] Starting sync for user default_user, 3 sessions
  Successfully synced to Supabase
  ```

---

## 🔍 第八步：验证数据同步成功

### 8.1 在 Supabase Dashboard 中查看

1. 进入 **Table Editor**
2. 点击 `user_conversations` 表
3. 您应该看到您的对话数据：
   - `conversation_id`: 类似 `sess_123abc...`
   - `title`: 对话标题（如"创业焦虑"）
   - `round_count`: 对话轮数
   - `conversation_history`: JSON 格式的对话内容

### 8.2 查看对话详情

点击某行数据，可以展开查看 `conversation_history`：

```json
[
  {
    "round": 1,
    "user_message": {
      "content": "我最近创业遇到了很多困难...",
      "timestamp": 1705328400000
    },
    "assistant_message": {
      "content": "我理解你的处境...",
      "timestamp": 1705328405000
    }
  }
]
```

---

## 🐛 常见问题排查

### ❌ 问题 1：SQL 执行失败

**错误提示**：`relation "users" already exists`

**解决方案**：
- SQL 开头的 `DROP TABLE` 语句会删除旧表
- 如果您想保留旧数据，请先备份
- 或者注释掉 `DROP TABLE` 语句

---

### ❌ 问题 2：同步失败，提示 "Failed to create/update user"

**可能原因**：
1. 环境变量未正确配置
2. Supabase 凭据错误
3. 数据库迁移未成功运行

**解决步骤**：
1. 检查 `.env.local` 文件是否存在
2. 确认 3 个 Supabase 变量都已正确填写
3. 重启开发服务器 `npm run dev`
4. 查看浏览器控制台的错误详情

---

### ❌ 问题 3：找不到 "同步到云端" 按钮

**位置**：左侧边栏 → 最底部 → 用户头像上方

**样式**：带有刷新图标的按钮，文字为"同步到云端"

---

### ❌ 问题 4：Supabase Dashboard 中看不到数据

**检查清单**：
1. ✅ 确认同步成功（查看浏览器控制台）
2. ✅ 刷新 Supabase Table Editor 页面
3. ✅ 检查是否在正确的 Supabase 项目中
4. ✅ 查看 Supabase Logs（Dashboard → Logs → API）

---

## 📊 验证查询（可选）

在 Supabase SQL Editor 中运行：

```sql
-- 查看用户数量
SELECT COUNT(*) FROM users;

-- 查看对话数量
SELECT COUNT(*) FROM user_conversations WHERE is_deleted = FALSE;

-- 查看特定用户的对话
SELECT 
  conversation_id,
  title,
  round_count,
  created_at
FROM user_conversations
WHERE user_id = 'default_user'
ORDER BY updated_at DESC;

-- 查看对话详情
SELECT 
  title,
  round_count,
  conversation_history
FROM user_conversations
LIMIT 1;
```

---

## ✨ 成功！

如果您看到：
- ✅ Supabase 中有 4 张表
- ✅ `user_conversations` 表中有您的对话数据
- ✅ `round_count` 字段显示正确的轮数
- ✅ 同步按钮显示最后同步时间

**恭喜！您的数据已成功同步到 Supabase！** 🎉

---

## 📞 需要帮助？

如果遇到任何问题：
1. 查看浏览器控制台（F12 → Console）
2. 查看 Supabase Dashboard → Logs
3. 提供具体的错误信息

---

**下一步**：您现在可以安全地使用应用，所有数据都会自动备份到云端！

