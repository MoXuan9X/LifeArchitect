# 🔧 Supabase Schema Cache 问题修复指南

## ❗ 问题诊断

您遇到的错误：
```
Could not find the table 'public.user_conversations' in the schema cache
Error Code: PGRST205
```

**这不是表不存在的问题！** 而是 Supabase 的 PostgREST API 缓存没有更新。

---

## ✅ 解决方案（3种方法）

### 方法 1：重新加载 Schema Cache（最快）⚡

#### 在 Supabase Dashboard 执行以下命令：

1. 访问 **SQL Editor**:
   ```
   https://supabase.com/dashboard/project/YOUR_PROJECT_ID/sql/new
   ```

2. 执行以下 SQL 命令：
   ```sql
   NOTIFY pgrst, 'reload schema';
   ```

3. 等待 3-5 秒，然后测试：
   ```
   http://localhost:3000/api/diagnose-supabase
   ```

---

### 方法 2：重启 PostgREST 服务

1. 访问 **Project Settings → API**
2. 点击 **"Restart API"** 按钮
3. 等待 30 秒 - 1 分钟
4. 重新测试连接

---

### 方法 3：使用 Supabase Dashboard 的 API Docs 刷新

1. 访问 **API Docs**:
   ```
   https://supabase.com/dashboard/project/YOUR_PROJECT_ID/api
   ```

2. 在页面顶部找到 **"Refresh"** 或 **"Reload Schema"** 按钮

3. 点击刷新

4. 查看是否能看到新创建的表

---

## 🔍 验证修复是否成功

### 方法 1：使用诊断 API
```bash
curl http://localhost:3000/api/diagnose-supabase
```

应该看到：
```json
{
  "success": true,
  "message": "✅ Supabase 连接完全正常",
  "diagnosis": {
    "tables": {
      "users": { "exists": true, "canRead": true },
      "user_conversations": { "exists": true, "canRead": true },
      "conversation_analysis": { "exists": true, "canRead": true },
      "user_analysis_reports": { "exists": true, "canRead": true }
    }
  }
}
```

### 方法 2：在 Supabase Dashboard 查看

访问 **Table Editor**，应该能看到所有 4 张表：
- users
- user_conversations  
- conversation_analysis
- user_analysis_reports

---

## 📊 修复后立即同步数据

访问以下页面开始同步：
```
http://localhost:3000/sync-now
```

或使用命令行：
```bash
curl -X POST http://localhost:3000/api/sync-user-data \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "default_user",
    "sessions": []
  }'
```

---

## 💡 为什么会出现这个问题？

Supabase 使用 **PostgREST** 作为 REST API 层。PostgREST 会缓存数据库 schema 以提高性能。

当您：
1. ✅ 通过 SQL Editor 创建了新表
2. ❌ 但 PostgREST 的缓存还没更新

就会出现 "table not in schema cache" 错误。

---

## ⚙️ 技术细节

### 错误代码说明
- `PGRST200`: Schema cache not loaded
- `PGRST205`: **Could not find relation in schema cache** ← 您的问题
- `42P01`: Table actually doesn't exist (PostgreSQL 原生错误)

### Schema Cache 刷新时机
Supabase 通常在以下情况自动刷新：
- 项目重启
- API 服务重启
- 手动触发 `NOTIFY pgrst, 'reload schema'`

---

## 🚀 快速命令参考

```sql
-- 1. 检查表是否真的存在（直接查询 PostgreSQL）
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'users', 
  'user_conversations', 
  'conversation_analysis', 
  'user_analysis_reports'
);

-- 2. 刷新 PostgREST schema cache
NOTIFY pgrst, 'reload schema';

-- 3. 查看表的列信息
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'user_conversations';
```

---

## ✅ 完成清单

- [ ] 执行 `NOTIFY pgrst, 'reload schema';`
- [ ] 等待 3-5 秒
- [ ] 访问 http://localhost:3000/api/diagnose-supabase 验证
- [ ] 确认所有表状态为 `exists: true, canRead: true`
- [ ] 访问 http://localhost:3000/sync-now 同步数据
- [ ] 在 Supabase Dashboard 查看同步的数据

---

**创建时间**: 2025-11-24  
**问题**: Schema Cache 未更新  
**解决方案**: 执行 `NOTIFY pgrst, 'reload schema';`

