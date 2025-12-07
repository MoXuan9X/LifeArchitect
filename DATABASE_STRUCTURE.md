# 数据库结构设计文档

## 📋 表结构总览

```
users (用户信息表)
  └── user_conversations (用户对话表)
       └── conversation_analysis (对话分析表)
  └── user_analysis_reports (用户分析报告表)
```

---

## 1️⃣ users - 用户信息表

### 字段说明

| 字段 | 类型 | 说明 | 约束 |
|------|------|------|------|
| `id` | UUID | 数据库主键 | PRIMARY KEY, 自动生成 |
| `user_id` | TEXT | 用户唯一标识 | UNIQUE, NOT NULL |
| `username` | TEXT | 用户名 | UNIQUE, NOT NULL |
| `password_hash` | TEXT | 密码哈希（bcrypt） | NOT NULL |
| `created_at` | TIMESTAMPTZ | 注册时间 | DEFAULT NOW() |
| `last_login_at` | TIMESTAMPTZ | 最近登录时间 | - |

### 用途
- 存储用户的基本信息和认证数据
- 支持用户登录、注册功能
- 追踪用户活跃度

### 示例数据
```sql
{
  "user_id": "user_123abc",
  "username": "zhangsan",
  "password_hash": "$2b$10$...",
  "created_at": "2025-01-15T10:30:00Z",
  "last_login_at": "2025-01-20T15:45:00Z"
}
```

### 字段说明
- `created_at`: 用户注册时间（数据库插入时间即为注册时间）
- `last_login_at`: 追踪用户活跃度，每次登录时更新

---

## 2️⃣ user_conversations - 用户对话表

### 字段说明

| 字段 | 类型 | 说明 | 约束 |
|------|------|------|------|
| `id` | UUID | 数据库主键 | PRIMARY KEY, 自动生成 |
| `conversation_id` | TEXT | 对话唯一标识 | UNIQUE, NOT NULL |
| `user_id` | TEXT | 关联用户 | FOREIGN KEY → users(user_id) |
| `title` | TEXT | 对话标题 | NOT NULL |
| `conversation_history` | JSONB | 完整对话历史（按轮次组织）| NOT NULL, DEFAULT '[]' |
| `round_count` | INTEGER | 对话轮数 | DEFAULT 0, 自动计算 |
| `created_at` | TIMESTAMPTZ | 创建时间 | DEFAULT NOW() |
| `updated_at` | TIMESTAMPTZ | 更新时间 | 自动更新 |
| `is_deleted` | BOOLEAN | 软删除标记 | DEFAULT FALSE |
| `deleted_at` | TIMESTAMPTZ | 删除时间 | 软删除时自动设置 |
| `conversation_analysis_ids` | TEXT[] | 关联的分析ID数组 | DEFAULT '{}' |

### conversation_history 格式（按轮次组织）

```json
[
  {
    "round": 1,
    "user_message": {
      "content": "我最近创业遇到了很多困难...",
      "timestamp": 1705328400000
    },
    "assistant_message": {
      "content": "我理解你的处境，创业初期确实会面临很多挑战...",
      "timestamp": 1705328405000
    }
  },
  {
    "round": 2,
    "user_message": {
      "content": "具体来说，我在团队管理上遇到了问题...",
      "timestamp": 1705328500000
    },
    "assistant_message": {
      "content": "团队管理是创业中的核心问题...",
      "timestamp": 1705328510000
    }
  }
]
```

### 结构说明
- **`round`**: 对话轮次（从 1 开始）
- **一轮 = 用户提问 + AI 回答**
- **清晰的配对关系**：每轮的问答紧密关联
- **轮数统计**：`jsonb_array_length(conversation_history)` 即为轮数

### 用途
- 存储用户的每一次完整对话
- **按轮次组织**：一轮 = 用户提问 + AI 回答
- 支持软删除（用户可以恢复）
- 通过 `conversation_analysis_ids` 关联分析结果

### 示例数据
```sql
{
  "conversation_id": "conv_2025_001",
  "user_id": "user_123abc",
  "title": "创业焦虑讨论",
  "round_count": 5,
  "conversation_history": [
    {
      "round": 1,
      "user_message": {...},
      "assistant_message": {...}
    },
    ...
  ],
  "is_deleted": false,
  "conversation_analysis_ids": ["analysis_001", "analysis_002"]
}
```

### 轮数计算逻辑
- `round_count = jsonb_array_length(conversation_history)`
- 触发器自动更新，无需手动维护

### 为什么这样设计？

#### ❌ 旧格式问题
```json
// 旧格式：平铺的消息列表
[
  {"role": "user", "content": "问题1", "timestamp": 100},
  {"role": "assistant", "content": "回答1", "timestamp": 101},
  {"role": "user", "content": "问题2", "timestamp": 200},
  {"role": "assistant", "content": "回答2", "timestamp": 201}
]
```
**问题**：
- ❌ 不知道轮数（需要遍历计算）
- ❌ 问答关系不明确
- ❌ 不方便按轮次查询

#### ✅ 新格式优势
```json
// 新格式：按轮次组织
[
  {
    "round": 1,
    "user_message": {"content": "问题1", "timestamp": 100},
    "assistant_message": {"content": "回答1", "timestamp": 101}
  },
  {
    "round": 2,
    "user_message": {"content": "问题2", "timestamp": 200},
    "assistant_message": {"content": "回答2", "timestamp": 201}
  }
]
```
**优势**：
- ✅ 轮数一目了然：`round_count = 2`
- ✅ 问答配对清晰
- ✅ 方便按轮次查询：`conversation_history[0]` 就是第一轮

---

## 3️⃣ conversation_analysis - 对话分析表

### 字段说明

| 字段 | 类型 | 说明 | 约束 |
|------|------|------|------|
| `id` | UUID | 数据库主键 | PRIMARY KEY, 自动生成 |
| `analysis_id` | TEXT | 分析唯一标识 | UNIQUE, NOT NULL |
| `conversation_id` | TEXT | 关联对话 | FOREIGN KEY → user_conversations(conversation_id) |
| `analysis_type` | TEXT | 分析类型 | CHECK: 'diagnosis' OR 'roadmap' |
| `analysis_content` | JSONB | 分析内容 | NOT NULL |
| `created_at` | TIMESTAMPTZ | 创建时间 | DEFAULT NOW() |
| `is_read` | BOOLEAN | 是否已读 | DEFAULT FALSE |

### analysis_type 取值

| 值 | 说明 | 触发条件 |
|----|------|----------|
| `diagnosis` | 问题诊断分析 | 对话达到 **5 轮** |
| `roadmap` | 行动路线图 | 对话达到 **10 轮** |

### analysis_content 格式示例

#### diagnosis 类型
```json
{
  "positive_traits": [
    {
      "title": "积极主动",
      "description": "你展现出了很强的行动力..."
    }
  ],
  "areas_for_improvement": [
    {
      "title": "情绪管理",
      "description": "建议关注压力调节..."
    }
  ]
}
```

#### roadmap 类型
```json
{
  "need_to_know": ["了解市场定位", "评估资源"],
  "explore_together": ["团队建设", "产品方向"],
  "will_learn": ["时间管理", "领导力"],
  "will_experience": ["挑战与成长", "团队协作"]
}
```

### 用途
- 针对**单个对话**进行深度分析
- 为用户提供即时反馈
- 一个对话可以有多个分析（diagnosis + roadmap）

---

## 4️⃣ user_analysis_reports - 用户分析报告表

### 字段说明

| 字段 | 类型 | 说明 | 约束 |
|------|------|------|------|
| `id` | UUID | 数据库主键 | PRIMARY KEY, 自动生成 |
| `report_id` | TEXT | 报告唯一标识 | UNIQUE, NOT NULL |
| `user_id` | TEXT | 关联用户 | FOREIGN KEY → users(user_id) |
| `report_type` | TEXT | 报告类型 | CHECK: 'personality', 'thought_pattern', 'blind_spot' |
| `report_content` | JSONB | 报告内容 | NOT NULL |
| `message_count_at_generation` | INTEGER | 生成时的总消息数 | - |
| `conversations_analyzed` | TEXT[] | 分析了哪些对话 | - |
| `created_at` | TIMESTAMPTZ | 创建时间 | DEFAULT NOW() |
| `updated_at` | TIMESTAMPTZ | 更新时间 | 自动更新 |
| `is_read` | BOOLEAN | 是否已读 | DEFAULT FALSE |

### report_type 取值

| 值 | 说明 | 触发条件 |
|----|------|----------|
| `personality` | 性格分析 | 用户总轮数 ≥ **25 轮**（~50条消息）|
| `thought_pattern` | 思维模式分析 | 用户总轮数 ≥ **40 轮**（~80条消息）|
| `blind_spot` | 盲点分析 | 用户总轮数 ≥ **50 轮**（~100条消息）|

### report_content 格式示例
```json
{
  "summary": "你是一个..."
  "key_traits": ["特质1", "特质2"],
  "strengths": ["优势1", "优势2"],
  "growth_areas": ["成长方向1", "成长方向2"],
  "recommendations": ["建议1", "建议2"]
}
```

### 用途
- 跨对话的**全局用户画像**
- 基于所有对话历史生成综合分析
- 追踪用户成长轨迹

---

## 🔗 关系对比图

### 对话分析 vs 用户分析报告

```
┌─────────────────────────────────────────────────┐
│             对话分析 (对话级别)                  │
│                                                 │
│  对话A → [问题诊断] [行动路线]                   │
│  对话B → [问题诊断] [行动路线]                   │
│  对话C → [问题诊断]                             │
└─────────────────────────────────────────────────┘
                      ↓
          (基于所有对话，跨对话分析)
                      ↓
┌─────────────────────────────────────────────────┐
│           用户分析报告 (用户级别)                 │
│                                                 │
│  [性格分析]  [思维模式]  [盲点分析]              │
└─────────────────────────────────────────────────┘
```

---

## 🛠️ 辅助功能

### 1. 软删除机制
```sql
-- 删除对话（软删除）
UPDATE user_conversations 
SET is_deleted = TRUE 
WHERE conversation_id = 'conv_001';
-- deleted_at 会自动设置

-- 恢复对话
UPDATE user_conversations 
SET is_deleted = FALSE, deleted_at = NULL 
WHERE conversation_id = 'conv_001';
```

### 2. 辅助查询函数

#### 获取用户所有未删除对话
```sql
SELECT * FROM get_user_conversations('user_123abc');
```

#### 统计用户总消息数
```sql
SELECT get_user_total_messages('user_123abc');
```

---

## 📊 数据流示例

### 场景：新用户从注册到生成第一份报告

```
1. 用户注册
   → INSERT INTO users (user_id, username, password_hash)

2. 开始第一个对话
   → INSERT INTO user_conversations (conversation_id, user_id, title)

3. 用户发送消息
   → UPDATE user_conversations SET conversation_history = conversation_history || '[...]'

4. 达到5轮对话
   → INSERT INTO conversation_analysis (analysis_type='diagnosis')
   → UPDATE user_conversations ADD analysis_id

5. 达到10轮对话
   → INSERT INTO conversation_analysis (analysis_type='roadmap')

6. 用户累计50条消息（可能跨多个对话）
   → INSERT INTO user_analysis_reports (report_type='personality')

7. 用户累计80条消息
   → INSERT INTO user_analysis_reports (report_type='thought_pattern')

8. 用户累计100条消息
   → INSERT INTO user_analysis_reports (report_type='blind_spot')
```

---

## ⚡ 性能优化

### 索引策略
- ✅ 用户ID、对话ID 都有索引
- ✅ `is_deleted = FALSE` 使用部分索引
- ✅ `created_at DESC` 用于快速获取最新数据

### JSON 查询示例
```sql
-- 查询对话中用户发送的消息数
SELECT 
  conversation_id,
  jsonb_array_length(
    conversation_history #> '{}'
  ) - jsonb_array_length(
    conversation_history #> '{}' @> '[{"role":"assistant"}]'
  ) as user_message_count
FROM user_conversations;
```

---

## 🔐 安全考虑

1. **密码存储**：使用 `pgcrypto` 扩展的 `crypt()` 函数，自动 bcrypt 哈希
2. **软删除**：保护数据不被物理删除，支持恢复
3. **外键约束**：级联删除确保数据完整性
4. **Row Level Security (RLS)**：可配置用户只能访问自己的数据

---

## 📈 扩展性

### 未来可以添加
- `user_preferences` 表：用户设置和偏好
- `user_achievements` 表：用户成就和里程碑
- `conversation_tags` 表：对话标签分类
- `feedback` 表：用户对分析的反馈
- `collaboration` 表：多用户协作对话

---

这个设计是否符合您的需求？需要调整什么地方吗？

