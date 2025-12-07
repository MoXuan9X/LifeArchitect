-- Drop old tables if they exist (WARNING: This will delete existing data)
DROP TABLE IF EXISTS analysis_reports CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS chat_sessions CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto"; -- For password hashing

-- ============================================
-- 1. 用户信息表
-- ============================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT UNIQUE NOT NULL,           -- 用户唯一标识
  username TEXT UNIQUE NOT NULL,          -- 用户名
  password_hash TEXT NOT NULL,            -- 密码哈希（使用 bcrypt）
  created_at TIMESTAMPTZ DEFAULT NOW(),   -- 注册时间
  last_login_at TIMESTAMPTZ               -- 最近登录时间
);

-- ============================================
-- 2. 用户对话表
-- ============================================
CREATE TABLE user_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id TEXT UNIQUE NOT NULL,    -- 对话唯一标识
  user_id TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  title TEXT NOT NULL,                     -- 对话标题
  
  -- 对话历史：按轮次组织 [{ round: 1, user_message: {...}, assistant_message: {...} }, ...]
  conversation_history JSONB NOT NULL DEFAULT '[]'::jsonb,
  round_count INTEGER DEFAULT 0,           -- 对话轮数（自动计算）
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_deleted BOOLEAN DEFAULT FALSE,        -- 软删除标记
  deleted_at TIMESTAMPTZ,                  -- 删除时间
  
  -- 关联的对话分析（可以有多个）
  conversation_analysis_ids TEXT[] DEFAULT '{}'::TEXT[] -- 数组存储多个分析ID
);

-- ============================================
-- 3. 对话分析表
-- ============================================
CREATE TABLE conversation_analysis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  analysis_id TEXT UNIQUE NOT NULL,        -- 分析唯一标识
  conversation_id TEXT NOT NULL REFERENCES user_conversations(conversation_id) ON DELETE CASCADE,
  analysis_type TEXT NOT NULL CHECK (analysis_type IN ('diagnosis', 'roadmap')), -- 问题分析 / 行动路线
  analysis_content JSONB NOT NULL,         -- 分析内容（灵活的JSON结构）
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_read BOOLEAN DEFAULT FALSE            -- 是否已读
);

-- ============================================
-- 4. 用户分析报告表（跨对话的全局用户画像）
-- ============================================
CREATE TABLE user_analysis_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id TEXT UNIQUE NOT NULL,          -- 报告唯一标识
  user_id TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  report_type TEXT NOT NULL CHECK (report_type IN ('personality', 'thought_pattern', 'blind_spot')), -- 性格分析 / 思维模式 / 盲点分析
  report_content JSONB NOT NULL,           -- 报告内容
  
  -- 元数据
  message_count_at_generation INTEGER,     -- 生成时的总消息数
  conversations_analyzed TEXT[],           -- 基于哪些对话生成的
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_read BOOLEAN DEFAULT FALSE
);

-- ============================================
-- 索引优化
-- ============================================

-- 用户表索引
CREATE INDEX idx_users_user_id ON users(user_id);
CREATE INDEX idx_users_username ON users(username);

-- 对话表索引
CREATE INDEX idx_conversations_user_id ON user_conversations(user_id);
CREATE INDEX idx_conversations_conversation_id ON user_conversations(conversation_id);
CREATE INDEX idx_conversations_created_at ON user_conversations(created_at DESC);
CREATE INDEX idx_conversations_is_deleted ON user_conversations(is_deleted) WHERE is_deleted = FALSE;

-- 对话分析索引
CREATE INDEX idx_conversation_analysis_conversation_id ON conversation_analysis(conversation_id);
CREATE INDEX idx_conversation_analysis_type ON conversation_analysis(analysis_type);
CREATE INDEX idx_conversation_analysis_is_read ON conversation_analysis(is_read);

-- 用户分析报告索引
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
-- 示例数据插入（可选，用于测试）
-- ============================================

-- 插入测试用户
-- INSERT INTO users (user_id, username, password_hash, last_login_at) 
-- VALUES ('default_user', 'testuser', crypt('password123', gen_salt('bf')), NOW());

-- 插入测试对话（新格式：按轮次组织）
-- INSERT INTO user_conversations (conversation_id, user_id, title, conversation_history)
-- VALUES (
--   'conv_001', 
--   'default_user', 
--   '创业焦虑',
--   '[
--     {
--       "round": 1,
--       "user_message": {"content": "我最近很焦虑", "timestamp": 1234567890000},
--       "assistant_message": {"content": "我理解你的感受", "timestamp": 1234567891000}
--     },
--     {
--       "round": 2,
--       "user_message": {"content": "具体来说是团队问题", "timestamp": 1234567900000},
--       "assistant_message": {"content": "团队建设确实重要", "timestamp": 1234567901000}
--     }
--   ]'::jsonb
-- );
-- round_count 会自动计算为 2

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
    jsonb_array_length(uc.conversation_history) as message_count
  FROM user_conversations uc
  WHERE uc.user_id = p_user_id 
    AND uc.is_deleted = FALSE
  ORDER BY uc.updated_at DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 辅助函数：统计用户总轮数（用于触发用户分析报告）
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

