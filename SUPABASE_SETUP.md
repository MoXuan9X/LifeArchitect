# Supabase Setup Guide

## 1. 创建 Supabase 项目

1. 访问 [Supabase Dashboard](https://supabase.com/dashboard)
2. 创建新项目或选择现有项目
3. 记录以下信息：
   - Project URL (`NEXT_PUBLIC_SUPABASE_URL`)
   - Anon/Public Key (`NEXT_PUBLIC_SUPABASE_ANON_KEY`)
   - Service Role Key (`SUPABASE_SERVICE_ROLE_KEY`)

## 2. 配置环境变量

在项目根目录创建 `.env.local` 文件，添加以下内容：

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# SiliconFlow API (已有)
NEXT_PUBLIC_SILICONFLOW_API_KEY=your_existing_api_key
```

## 3. 运行数据库迁移

在 Supabase Dashboard 中：

1. 进入 SQL Editor
2. 复制 `supabase/migrations/001_create_user_data_tables.sql` 的内容
3. 粘贴并运行 SQL

或者使用 Supabase CLI：

```bash
npx supabase db push
```

## 4. 数据库表结构

迁移后会创建以下表：

### `users`
- `id` (UUID, Primary Key)
- `user_id` (TEXT, Unique) - 用户标识
- `created_at`, `updated_at`

### `chat_sessions`
- `id` (UUID, Primary Key)
- `user_id` (TEXT, Foreign Key)
- `session_id` (TEXT) - 客户端会话 ID
- `title`, `date`
- `last_updated` (BIGINT)
- Unique constraint: `(user_id, session_id)`

### `messages`
- `id` (UUID, Primary Key)
- `session_id` (UUID, Foreign Key)
- `role` ('user' | 'assistant')
- `content` (TEXT)
- `timestamp` (BIGINT)
- `is_streaming` (BOOLEAN)

### `analysis_reports`
- `id` (UUID, Primary Key)
- `session_id` (UUID, Foreign Key)
- `report_id` (TEXT)
- `type` ('diagnosis' | 'roadmap')
- `title`, `content` (JSONB)
- `created_at_timestamp` (BIGINT)
- `is_read` (BOOLEAN)
- Unique constraint: `(session_id, report_id)`

## 5. 工作原理

### 自动同步
每当用户的 sessions 数据发生变化时（发送消息、生成报告等），系统会：
1. 保存到 localStorage（本地持久化）
2. 自动同步到 Supabase（云端备份）

### API 路由
- `POST /api/sync-user-data`: 接收用户 ID 和会话数据，同步到 Supabase

### 数据流
```
用户操作 → 更新 sessions state → localStorage 保存 → Supabase 同步
```

## 6. 测试同步

1. 启动开发服务器：`npm run dev`
2. 发送几条消息
3. 打开浏览器控制台，查看是否有 "Successfully synced to Supabase" 日志
4. 在 Supabase Dashboard 的 Table Editor 中查看数据

## 7. 常见问题

### Q: 同步失败怎么办？
A: 检查浏览器控制台的错误信息，确保：
- `.env.local` 中的 Supabase 凭据正确
- 数据库迁移已成功运行
- 网络连接正常

### Q: 数据会丢失吗？
A: 不会。数据首先保存在 localStorage（本地），Supabase 同步是额外的云端备份。即使同步失败，本地数据仍然完整。

### Q: 如何从 Supabase 恢复数据？
A: 可以创建一个新的 API 路由 `GET /api/sync-user-data?userId=xxx` 来从 Supabase 读取并恢复数据。

## 8. 下一步优化（可选）

- [ ] 添加同步状态指示器（显示"正在同步..."）
- [ ] 实现从 Supabase 恢复数据的功能
- [ ] 添加离线队列（网络断开时缓存同步请求）
- [ ] 实现增量同步（只同步变化的数据）
- [ ] 添加同步冲突解决机制

