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
 * Send chat message to the AI
 */
export async function sendChatMessage(requestData: any) {
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

    const data = await response.json();
    return { status: response.status, data: data };
  } catch (error: any) {
    console.error('❌ Chat error:', error.message);
    throw error;
  }
}
