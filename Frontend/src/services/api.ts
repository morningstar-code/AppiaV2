import { API_URL } from '../config';

// API Configuration
// API_URL is set from environment or defaults to '/api'

/**
 * Get project template based on user prompt
 */
export async function getProjectTemplate(prompt: string) {
  try {
    console.log('📡 [API Request] Getting project template for prompt:', prompt);
    console.log('📡 [API Request] Full URL:', `${API_URL}/template`);

    const response = await fetch(`${API_URL}/template`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt }),
    });

    console.log('📡 [API Response] Status:', response.status);
    console.log('📡 [API Response] Status Text:', response.statusText);
    console.log('📡 [API Response] Headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      console.error('❌ [API Error] Response not OK:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('❌ [API Error] Response body:', errorText);
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ [API Success] Template data received:', data);
    return { status: response.status, data: data };
  } catch (error: any) {
    console.error('❌ [API Error] Failed to get project template:', error);
    console.error('❌ [API Error] Error type:', error?.constructor?.name);
    console.error('❌ [API Error] Error message:', error?.message);
    console.error('❌ [API Error] Error stack:', error?.stack);
    throw error;
  }
}

/**
 * Send chat message to the AI with streaming support
 */
export async function sendChatMessage(requestData: any, onChunk?: (text: string) => void) {
  try {
    const requestBody = {
      userText: requestData.userText || '',
      language: requestData.language || 'react',
      userId: requestData.userId || 'anonymous',
      messages: requestData.messages || [],
      projectId: requestData.projectId || 'default'
    };

    const response = await fetch(`${API_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    // Handle streaming response
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let finalData: any = null;

    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.type === 'chunk' && onChunk) {
                onChunk(data.text);
              } else if (data.type === 'done') {
                finalData = data;
              }
            } catch (e) {
              console.warn('Failed to parse SSE line:', line);
            }
          }
        }
      }
    }

    return { status: response.status, data: finalData || {} };
  } catch (error: any) {
    console.error('❌ Chat error:', error.message);
    throw error;
  }
}
