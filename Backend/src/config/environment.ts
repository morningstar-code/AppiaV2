export const config = {
  port: process.env.PORT || 3000,
  claudeApiKey: process.env.CLAUDE_API_KEY,
  claudeModel: process.env.CLAUDE_MODEL || 'claude-3-5-sonnet-20241022',
  nodeEnv: process.env.NODE_ENV || 'Production',
};
