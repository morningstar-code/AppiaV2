export interface PatchOp {
  type: 'editFile';
  path: string;
  find: string;
  replace: string;
}

export interface PatchResponse {
  ops: PatchOp[];
}

/**
 * Validate JSON patch response
 */
export function validatePatchResponse(response: string): { valid: boolean; patch?: PatchResponse; error?: string } {
  try {
    const parsed = JSON.parse(response);
    
    if (!parsed.ops || !Array.isArray(parsed.ops)) {
      return { valid: false, error: 'Missing or invalid ops array' };
    }
    
    for (const op of parsed.ops) {
      if (op.type !== 'editFile') {
        return { valid: false, error: `Invalid operation type: ${op.type}` };
      }
      if (!op.path || !op.find || !op.replace) {
        return { valid: false, error: 'Missing required fields in operation' };
      }
    }
    
    return { valid: true, patch: parsed };
  } catch (error) {
    return { valid: false, error: `Invalid JSON: ${error}` };
  }
}
