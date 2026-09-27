export interface GenerateOptions {
  simulate?: 'malformed' | 'wrong_shape' | 'empty' | 'slow' | 'error';
}

/**
 * Calls the backend proxy endpoint.
 * This is the ONLY place the frontend communicates with the backend.
 * The Gemini API key and direct Gemini API calls never touch the browser.
 */
export async function callApi(userInput: string, options?: GenerateOptions): Promise<string> {
  const response = await fetch('/api/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      userInput,
      simulate: options?.simulate,
    }),
  });

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    try {
      const err = await response.json();
      if (err.error) {
        message = err.error;
      }
    } catch {
      // Fallback message
    }
    throw new Error(message);
  }

  const data = await response.json();
  if (data.raw === undefined || data.raw === null) {
    throw new Error('Empty response received from proxy server.');
  }

  return data.raw;
}

/**
 * Defensive parsing before rendering.
 * Required pattern:
 * - Attempts to parse JSON string.
 * - Verifies that top-level data.days is an array.
 * - Returns parsed object or null on failure.
 * A null result must route to the error state — never a blank render or crash.
 */
export function parseResult(raw: string): any | null {
  try {
    let clean = raw.trim();
    if (clean.startsWith('```')) {
      clean = clean.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
    }
    const data = JSON.parse(clean);
    if (!Array.isArray(data.days)) return null;
    return data;
  } catch {
    return null;
  }
}
