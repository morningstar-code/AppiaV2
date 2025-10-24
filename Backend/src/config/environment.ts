export const config = {
  port: process.env.PORT || 3000,
  claudeApiKey: process.env.CLAUDE_API_KEY,
  claudeModel: process.env.CLAUDE_MODEL || 'claude-3-haiku-20240307',
  nodeEnv: process.env.NODE_ENV || 'Production',
};
