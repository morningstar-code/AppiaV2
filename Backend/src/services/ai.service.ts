import Anthropic from '@anthropic-ai/sdk';
import { config } from '../config/environment';
import { AIMessage } from '../types';

const anthropic = new Anthropic({
  apiKey: config.claudeApiKey!,
});

export async function callClaude(messages: AIMessage[], maxTokens: number): Promise<string> {
  try {
    const response = await anthropic.messages.create({
      model: config.claudeModel,
      max_tokens: maxTokens,
      messages: messages.map((msg) => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content,
      })),
    });

    return response.content[0].type === 'text' ? response.content[0].text : '';
  } catch (error) {
    console.error('Claude API error:', error);
    throw new Error('Failed to get response from Claude');
  }
} 