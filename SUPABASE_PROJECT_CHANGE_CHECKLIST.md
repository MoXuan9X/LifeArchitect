# 🔄 更换 Supabase 项目后的检查清单

## ✅ 已完成的步骤

- [x] 更新 `.env` 文件中的三个环境变量
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
- [x] 清除 Next.js 构建缓存

## 🎯 接下来需要做的

### 1️⃣ **重启开发服务器**（必须）

如果开发服务器正在运行，必须重启才能加载新的环境变量：

```bash
# 停止当前服务器 (Ctrl + C)
# 然后重新启动
npm run dev
```

**⚠️ 重要**: Next.js 在启动时加载环境变量，不会自动重新加载！

---

### 2️⃣ **在新的 Supabase 项目中创建数据表**（必须）

您的新 Supabase 项目是空的，需要创建表结构。

**方法一：使用可视化设置页面（推荐）**

1. 访问: http://localhost:3000/setup
2. 点击"开始设置"
3. 如果自动创建失败，按照提示手动执行 SQL

**方法二：手动在 Supabase Dashboard 执行 SQL**

1. 访问新项目的 SQL Editor:
   ```
   https://app.supabase.com/project/YOUR_NEW_PROJECT_ID/sql/new
   ```

2. 打开文件并复制全部内容:
   ```
   supabase/migrations/002_redesign_user_data_structure.sql
   ```

3. 粘贴到 SQL Editor 并点击 "Run"

---

### 3️⃣ **验证连接**（推荐）

```bash
# 方法一：浏览器访问
http://localhost:3000/api/test-connection

# 方法二：命令行
curl http://localhost:3000/api/test-connection
```

预期结果：
```json
{
  "success": true,
  "message": "✅ 所有表都已创建！连接成功！",
  "tables": {
    "users": { "exists": true, "status": "ok" },
    "user_conversations": { "exists": true, "status": "ok" },
    "conversation_analysis": { "exists": true, "status": "ok" },
    "user_analysis_reports": { "exists": true, "status": "ok" }
  }
}
```

---

### 4️⃣ **重新同步数据**（可选）

如果您想将现有数据同步到新项目：

**方法一：使用应用内按钮**
- 打开 http://localhost:3000/coach
- 点击侧边栏"同步到云端"按钮

**方法二：使用设置页面**
- 访问 http://localhost:3000/setup
- 运行完整设置流程

---

## 🔍 不需要修改的内容

以下内容会自动从 `.env` 读取，**无需手动修改**：

- ✅ `lib/supabaseClient.ts` - 使用 `process.env`
- ✅ `app/api/sync-user-data/route.ts` - 使用 `process.env`
- ✅ `app/api/test-connection/route.ts` - 使用 `process.env`
- ✅ `app/api/setup-database/route.ts` - 使用 `process.env`
- ✅ 所有其他 API 路由

---

## ⚠️ 常见问题

### Q1: 更新环境变量后还是连接到旧项目？

**原因**: 开发服务器没有重启

**解决**: 
```bash
# 停止服务器 (Ctrl + C)
npm run dev
```

### Q2: 报错 "relation does not exist"

**原因**: 新项目中表还未创建

**解决**: 按照上面"步骤 2"创建表

### Q3: 如何确认使用的是哪个项目？

**方法**:
```bash
# 查看环境变量
cat .env | grep SUPABASE_URL
```

或访问 API 端点查看:
```bash
curl http://localhost:3000/api/test-connection | jq '.supabaseUrl'
```

---

## 📊 数据迁移说明

### 旧项目 → 新项目

如果您想迁移数据：

1. **从旧项目导出数据**（在 Supabase Dashboard）
2. **在新项目创建表结构**（执行 SQL 迁移）
3. **导入数据到新项目**

或者：

**使用本地数据作为中间层**：
1. 本地已有的对话数据会保留在 localStorage
2. 同步到新项目即可

---

## ✅ 完成确认

完成以上步骤后，您的新 Supabase 项目应该：

- ✅ 有 4 张数据表（users, user_conversations, conversation_analysis, user_analysis_reports）
- ✅ 能够通过 API 连接
- ✅ 可以正常同步数据
- ✅ 应用功能正常

---

**创建时间**: 2025-11-24  
**用途**: 更换 Supabase 项目后的配置指南

