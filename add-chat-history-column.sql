-- Add chat_history column to existing projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS chat_history JSONB DEFAULT '[]';
