import crypto from 'crypto';

/**
 * Token optimization utilities for reducing Claude API costs
 * Expected savings: ~85% overall token reduction
 */

// Cache for repeated prompts
const responseCache = new Map<string, any>();

/**
 * Build optimized prompt context with selective history
 * Keeps only recent messages + summary of older context
 */
export function buildPromptContext(messages: any[], maxRecent: number = 4): any[] {
  if (messages.length <= maxRecent) {
    return messages;
  }

  const recent = messages.slice(-maxRecent);
  const older = messages.slice(0, -maxRecent);
  
  // Create summary of older messages
  const summary = summarizeHistory(older);
  
  return [
    { role: "system", content: `Previous context: ${summary}` },
    ...recent
  ];
}

/**
 * Summarize older chat history to reduce token usage
 * Uses lightweight summarization to compress context
 */
export function summarizeHistory(messages: any[]): string {
  if (messages.length === 0) return "No previous context.";
  
  // Extract key information from older messages
  const userRequests = messages
    .filter(msg => msg.role === 'user')
    .map(msg => msg.content)
    .slice(0, 3); // Keep only first 3 user requests
    
  const assistantResponses = messages
    .filter(msg => msg.role === 'assistant')
    .length;
    
  return `User made ${userRequests.length} previous requests: ${userRequests.join('; ')}. Assistant provided ${assistantResponses} responses.`;
}

/**
 * Determine if task requires heavy reasoning (use Sonnet) or can use Haiku
 * Heavy tasks: code generation, complex planning, image analysis
 * Light tasks: questions, clarifications, simple responses
 */
export function isHeavyTask(prompt: string, hasImage: boolean = false): boolean {
  const heavyKeywords = [
    'create', 'build', 'generate', 'make', 'implement', 'design',
    'app', 'website', 'application', 'dashboard', 'interface',
    'component', 'function', 'class', 'method', 'api', 'database',
    'authentication', 'user management', 'backend', 'frontend',
    'complex', 'advanced', 'sophisticated', 'comprehensive'
  ];
  
  const promptLower = prompt.toLowerCase();
  const hasHeavyKeywords = heavyKeywords.some(keyword => promptLower.includes(keyword));
  const isLongPrompt = prompt.length > 100;
  const hasMultipleRequests = (prompt.match(/and|also|then|next|additionally/gi) || []).length > 2;
  
  // Always use Sonnet for images (vision capabilities)
  if (hasImage) return true;
  
  // Use Sonnet for complex tasks
  return hasHeavyKeywords || isLongPrompt || hasMultipleRequests;
}

/**
 * Get optimal model based on task complexity
 * Returns model name for Claude API
 */
export function getOptimalModel(prompt: string, hasImage: boolean = false, isFirstPrompt: boolean = false): string {
  // Always use Sonnet for first prompt (homepage) for best quality
  if (isFirstPrompt) {
    return 'claude-3.5-sonnet-20241022';
  }
  
  // Use Sonnet for heavy tasks
  if (isHeavyTask(prompt, hasImage)) {
    return 'claude-3.5-sonnet-20241022';
  }
  
  // Use Haiku for light tasks (60-70% cheaper)
  return 'claude-3-haiku-20240307';
}

/**
 * Cached Claude API call to avoid duplicate requests
 * Uses SHA1 hash of request payload as cache key
 */
export async function cachedClaudeCall(
  payload: any,
  claudeFunction: (payload: any) => Promise<any>
): Promise<any> {
  const cacheKey = getCacheKey(payload);
  
  // Check cache first
  if (responseCache.has(cacheKey)) {
    console.log('💾 Cache hit for Claude request');
    return responseCache.get(cacheKey);
  }
  
  // Make API call
  console.log('🚀 Making new Claude API call');
  const response = await claudeFunction(payload);
  
  // Cache response (limit cache size)
  if (responseCache.size > 100) {
    const firstKey = responseCache.keys().next().value;
    responseCache.delete(firstKey);
  }
  
  responseCache.set(cacheKey, response);
  return response;
}

/**
 * Generate cache key from request payload
 */
function getCacheKey(payload: any): string {
  // Create deterministic hash of request
  const payloadString = JSON.stringify({
    model: payload.model,
    messages: payload.messages?.map((msg: any) => ({
      role: msg.role,
      content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content)
    })),
    max_tokens: payload.max_tokens
  });
  
  return crypto.createHash('sha1').update(payloadString).digest('hex');
}

/**
 * Compress large code/HTML content to reduce tokens
 * Uses Node.js built-in zlib compression + base64 encoding
 */
export function compressContent(content: string): string {
  if (content.length < 1000) return content; // Don't compress small content
  
  try {
    const zlib = require('zlib');
    const compressed = zlib.deflateSync(Buffer.from(content, 'utf8'));
    const base64 = compressed.toString('base64');
    return `[COMPRESSED:${base64}]`;
  } catch (error) {
    console.warn('Compression failed, using original content:', error);
    return content;
  }
}

/**
 * Decompress content if it was compressed
 */
export function decompressContent(content: string): string {
  if (!content.startsWith('[COMPRESSED:')) return content;
  
  try {
    const base64 = content.replace('[COMPRESSED:', '').replace(']', '');
    const compressed = Buffer.from(base64, 'base64');
    const zlib = require('zlib');
    return zlib.inflateSync(compressed).toString('utf8');
  } catch (error) {
    console.warn('Decompression failed, using original content:', error);
    return content;
  }
}

/**
 * Track and log token usage for analytics
 */
export function logTokenUsage(usage: any, model: string, prompt: string): void {
  const totalTokens = usage.input_tokens + usage.output_tokens;
  const cost = calculateCost(totalTokens, model);
  
  console.log(`🧠 Claude usage: ${totalTokens} tokens (${usage.input_tokens} in, ${usage.output_tokens} out)`);
  console.log(`💰 Estimated cost: $${cost.toFixed(4)}`);
  console.log(`🤖 Model: ${model}`);
  console.log(`📝 Prompt length: ${prompt.length} chars`);
}

/**
 * Calculate estimated cost based on model and tokens
 */
function calculateCost(tokens: number, model: string): number {
  const rates = {
    'claude-3-haiku-20240307': { input: 0.25, output: 1.25 },
    'claude-3.5-sonnet-20241022': { input: 3, output: 15 }
  };
  
  const rate = rates[model as keyof typeof rates] || rates['claude-3.5-sonnet-20241022'];
  return (tokens * rate.input) / 1000000; // Rough estimate
}

/**
 * Lightweight system prompt to reduce token usage
 */
export const BASE_SYSTEM_PROMPT = `You are Appia, an AI full-stack app builder that generates production-ready websites and apps instantly.

CRITICAL RESPONSE FORMAT:
1. Short conversational message (max 2 sentences)
2. XML code block with all technical content

ABSOLUTELY FORBIDDEN IN CONVERSATIONAL MESSAGE:
- NO CODE snippets, JSON, HTML, CSS, JavaScript
- NO technical details or file contents
- ONLY friendly conversation like Bolt.new

REQUIRED XML format:
<boltArtifact id="project-code" title="Project Files">
  <boltAction type="file" filePath="path/to/file.ext">
    file content here
  </boltAction>
</boltArtifact>

Keep responses concise and focused.`;

/**
 * Split reasoning and generation for complex tasks
 * Step 1: Plan with Haiku (cheap)
 * Step 2: Generate with Sonnet (quality)
 */
export async function splitReasoningAndGeneration(
  prompt: string,
  claudeFunction: (payload: any) => Promise<any>
): Promise<string> {
  // Step 1: Plan with Haiku
  const planPayload = {
    model: 'claude-3-haiku-20240307',
    max_tokens: 500,
    messages: [
      { role: 'user', content: `Plan what files to create for: ${prompt}. Be concise.` }
    ]
  };
  
  const plan = await claudeFunction(planPayload);
  
  // Step 2: Generate with Sonnet
  const generatePayload = {
    model: 'claude-3.5-sonnet-20241022',
    max_tokens: 4000,
    messages: [
      { role: 'user', content: `Generate the actual code based on this plan:\n${plan}` }
    ]
  };
  
  return await claudeFunction(generatePayload);
}
