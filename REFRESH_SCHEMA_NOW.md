# ⚡ 立即刷新 Supabase Schema Cache

## 🎯 问题
- 服务器运行在 `http://localhost:3002` （不是 3000）
- Schema cache 还未刷新
- 表已创建但 API 无法访问

---

## ✅ 解决方案（2 分钟）

### 方法 1：SQL 命令刷新（推荐）

1. **访问 Supabase SQL Editor**:
   ```
   https://supabase.com/dashboard/project/doslzlnuwmxdeeblsuab/sql/new
   ```

2. **执行以下命令**:
   ```sql
   NOTIFY pgrst, 'reload schema';
   ```

3. **点击 Run 按钮**

4. **等待 5 秒**

5. **验证是否成功**:
   ```
   http://localhost:3002/api/test-connection
   ```

---

### 方法 2：检查表是否真的存在

在 SQL Editor 中执行：

```sql
-- 检查表是否存在
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'users',
  'user_conversations', 
  'conversation_analysis',
  'user_analysis_reports'
)
ORDER BY table_name;

-- 应该返回 4 行结果
```

如果没有返回 4 行，说明表没有全部创建成功，需要重新执行建表 SQL。

---

### 方法 3：直接查看 Supabase Table Editor

访问:
```
https://supabase.com/dashboard/project/doslzlnuwmxdeeblsuab/editor
```

在左侧应该能看到：
- ✅ users
- ✅ user_conversations
- ✅ conversation_analysis
- ✅ user_analysis_reports

---

## 📱 刷新成功后

访问以下地址同步数据：

```
http://localhost:3002/coach
```

点击"同步到云端"按钮即可！

---

**请立即执行 `NOTIFY pgrst, 'reload schema';` 命令！**

