import { Router } from 'express';
import { callClaude } from '../services/ai.service';
import { getSystemPrompt } from '../prompts';
import { getLanguagePrompt, getSystemPromptForLanguage } from '../language-prompts';
import { AIMessage, ChatResponse, ErrorResponse } from '../types';

const router = Router();

// Chat endpoint
router.post('/', async (req, res) => {
  const userMessages = req.body.messages as any[];
  const language = req.body.language || 'react';

  try {
    // Get the last user message
    const lastUserMessage = userMessages[userMessages.length - 1]?.content || '';
    
    // Create enhanced prompt with language-specific instructions
    const enhancedPrompt = getLanguagePrompt(language, lastUserMessage);
    const systemPrompt = getSystemPromptForLanguage(language);
    
    const messages: AIMessage[] = [
      {
        role: 'user',
        content: `${systemPrompt}\n\n${getSystemPrompt()}\n\n${enhancedPrompt}`,
      },
    ];

    const output = await callClaude(messages, 8000);
    
    const response: ChatResponse = {
      response: output,
    };
    
    res.json(response);
  } catch (error) {
    console.error('Chat error:', error);
    const errorResponse: ErrorResponse = { error: 'Failed to process chat request' };
    res.status(500).json(errorResponse);
  }
});

export default router; 