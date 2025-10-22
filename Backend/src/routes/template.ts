import { Router } from 'express';
import { callClaude } from '../services/ai.service';
import { BASE_PROMPT } from '../prompts';
import { basePrompt as nodeBasePrompt } from '../defaults/node';
import { basePrompt as reactBasePrompt } from '../defaults/react';
import { languageConfigs } from '../language-prompts';
import { AIMessage, ErrorResponse, TemplateResponse } from '../types';

const router = Router();

// Detect project type and return appropriate template
router.post('/', async (req, res) => {
  const prompt = req.body.prompt as string;
  const language = req.body.language || 'react';

  try {
    // Get language configuration
    const config = languageConfigs[language] || languageConfigs.react;
    
    // Create language-specific base prompt
    const languageBasePrompt = `${config.basePrompt}\n\n${BASE_PROMPT}`;
    
    const response: TemplateResponse = {
      prompts: [
        languageBasePrompt,
        `Here is an artifact that contains all files of the project visible to you.\nConsider the contents of ALL files in the project.\n\n${config.basePrompt}\n\nHere is a list of files that exist on the file system but are not being shown to you:\n\n  - .gitignore\n  - package-lock.json\n`,
      ],
      uiPrompts: [config.basePrompt],
    };
    
    res.json(response);
  } catch (error) {
    console.error('Template error:', error);
    const errorResponse: ErrorResponse = { error: 'Failed to process template request' };
    res.status(500).json(errorResponse);
  }
});

export default router; 