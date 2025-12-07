# 🔧 强制刷新 Supabase Schema Cache

## 当前问题
虽然表已创建，但 schema cache 仍然没有完全加载列信息。

错误：`Could not find the 'user_id' column of 'users' in the schema cache`

---

## ⚡ 解决方案（按顺序尝试）

### 方案 1：多次刷新 Schema Cache

在 **Supabase SQL Editor** 中执行以下命令（**多执行几次**）：

```sql
-- 刷新 schema cache
NOTIFY pgrst, 'reload schema';

-- 等待 3 秒后再执行一次
NOTIFY pgrst, 'reload schema';

-- 再执行一次
NOTIFY pgrst, 'reload schema';
```

每次执行后等待 3-5 秒，然后重试同步。

---

### 方案 2：重启整个 Supabase 项目

1. 访问 **Project Settings**:
   ```
   https://supabase.com/dashboard/project/doslzlnuwmxdeeblsuab/settings/general
   ```

2. 找到 **"Restart project"** 或 **"Pause project"** 按钮

3. 点击暂停，等待 30 秒，然后重新启动

4. 等待项目完全启动（约 1-2 分钟）

5. 重试同步

---

### 方案 3：验证表结构是否正确

在 SQL Editor 中执行：

```sql
-- 检查 users 表的列
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND table_schema = 'public'
ORDER BY ordinal_position;
```

**预期结果**（应该看到以下列）：
```
id              | uuid
user_id         | text
username        | text
password_hash   | text
created_at      | timestamp with time zone
last_login_at   | timestamp with time zone
```

如果缺少 `user_id` 列，说明表没有正确创建，需要重新执行建表 SQL。

---

### 方案 4：删除并重建 users 表

如果上面的检查显示 `user_id` 列不存在，执行：

```sql
-- 删除旧表（会删除所有数据！）
DROP TABLE IF EXISTS user_analysis_reports CASCADE;
DROP TABLE IF EXISTS conversation_analysis CASCADE;
DROP TABLE IF EXISTS user_conversations CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 然后重新执行完整的建表 SQL
-- (复制 002_redesign_user_data_structure.sql 的全部内容)
```

---

### 方案 5：使用直接的数据库连接（高级）

如果以上方法都不行，可以使用 `psql` 直接连接：

1. 在 Supabase Dashboard → Project Settings → Database
2. 复制连接字符串
3. 使用 `psql` 连接并执行 `NOTIFY pgrst, 'reload schema';`

---

## 🎯 推荐操作顺序

1. **先执行方案 3**：验证表结构
2. **如果表结构正确**：执行方案 1（多次刷新）
3. **如果还不行**：执行方案 2（重启项目）
4. **如果表结构不对**：执行方案 4（重建表）

---

## 📞 当前建议

**立即尝试**：

1. 在 SQL Editor 中执行：
```sql
-- 验证列是否存在
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND table_schema = 'public'
ORDER BY ordinal_position;
```

2. 截图或复制结果告诉我

3. 然后我们根据结果决定下一步！

---

**创建时间**: 2025-11-24  
**错误**: PGRST204 - Column not in schema cache  
**状态**: 等待验证表结构

