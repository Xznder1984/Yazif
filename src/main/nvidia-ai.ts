import https from 'https';

interface RenameResult {
  renamed: boolean;
  suggestedName: string;
  originalName: string;
}

interface ClassificationResult {
  type: 'audio' | 'video';
  confidence: number;
}

export class NvidiaAI {
  private baseUrl = 'https://integrate.api.nvidia.com/v1';

  async testApiKey(apiKey: string): Promise<{ valid: boolean; message: string }> {
    return new Promise((resolve) => {
      const data = JSON.stringify({
        model: 'meta/llama-3.1-8b-instruct',
        messages: [
          { role: 'user', content: 'Say "ok" if you can hear me.' }
        ],
        max_tokens: 10,
        temperature: 0.1,
      });

      const options = {
        hostname: 'integrate.api.nvidia.com',
        path: '/v1/chat/completions',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'Content-Length': Buffer.byteLength(data),
        },
      };

      const req = https.request(options, (res) => {
        let body = '';
        res.on('data', (chunk) => { body += chunk; });
        res.on('end', () => {
          if (res.statusCode === 200) {
            resolve({ valid: true, message: 'API key is valid!' });
          } else {
            try {
              const parsed = JSON.parse(body);
              resolve({ valid: false, message: parsed.error?.message || `Error ${res.statusCode}` });
            } catch {
              resolve({ valid: false, message: `HTTP ${res.statusCode}` });
            }
          }
        });
      });

      req.on('error', (err) => {
        resolve({ valid: false, message: `Network error: ${err.message}` });
      });

      req.write(data);
      req.end();
    });
  }

  async suggestName(apiKey: string, title: string, description: string): Promise<RenameResult> {
    return new Promise((resolve) => {
      const prompt = `You are a file naming assistant. Given this YouTube video title and description, suggest a clean, short filename (no extension, no special characters like <>"'/\\|?*, max 80 chars). Keep it descriptive but concise. Only output the suggested filename, nothing else.

Title: ${title}
Description: ${(description || '').substring(0, 500)}

Suggested filename:`;

      const data = JSON.stringify({
        model: 'meta/llama-3.1-8b-instruct',
        messages: [
          { role: 'system', content: 'You are a helpful file naming assistant. Output only the clean filename, nothing else.' },
          { role: 'user', content: prompt },
        ],
        max_tokens: 100,
        temperature: 0.3,
      });

      const options = {
        hostname: 'integrate.api.nvidia.com',
        path: '/v1/chat/completions',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'Content-Length': Buffer.byteLength(data),
        },
      };

      const req = https.request(options, (res) => {
        let body = '';
        res.on('data', (chunk) => { body += chunk; });
        res.on('end', () => {
          try {
            const parsed = JSON.parse(body);
            if (parsed.choices && parsed.choices[0]) {
              let suggestedName = parsed.choices[0].message.content.trim();
              // Clean up the response
              suggestedName = suggestedName
                .replace(/^["']|["']$/g, '')
                .replace(/[<>:"/\\|?*]/g, '')
                .replace(/\s+/g, ' ')
                .trim()
                .substring(0, 80);

              resolve({
                renamed: suggestedName.length > 0,
                suggestedName,
                originalName: title,
              });
            } else {
              resolve({ renamed: false, suggestedName: title, originalName: title });
            }
          } catch {
            resolve({ renamed: false, suggestedName: title, originalName: title });
          }
        });
      });

      req.on('error', () => {
        resolve({ renamed: false, suggestedName: title, originalName: title });
      });

      req.write(data);
      req.end();
    });
  }

  async classifyMediaType(apiKey: string, title: string, description: string): Promise<ClassificationResult> {
    return new Promise((resolve) => {
      const prompt = `Classify this YouTube content as either "audio" or "video". Consider:
- If it's a song, music, podcast, audiobook, or speech → "audio"
- If it's a video with visual content, tutorial, vlog, gaming, etc → "video"
- Look at the title and description for clues

Title: ${title}
Description: ${(description || '').substring(0, 300)}

Reply with ONLY one word: audio or video`;

      const data = JSON.stringify({
        model: 'meta/llama-3.1-8b-instruct',
        messages: [
          { role: 'system', content: 'You classify media types. Reply with ONLY "audio" or "video".' },
          { role: 'user', content: prompt },
        ],
        max_tokens: 10,
        temperature: 0.1,
      });

      const options = {
        hostname: 'integrate.api.nvidia.com',
        path: '/v1/chat/completions',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'Content-Length': Buffer.byteLength(data),
        },
      };

      const req = https.request(options, (res) => {
        let body = '';
        res.on('data', (chunk) => { body += chunk; });
        res.on('end', () => {
          try {
            const parsed = JSON.parse(body);
            if (parsed.choices && parsed.choices[0]) {
              const content = parsed.choices[0].message.content.trim().toLowerCase();
              const type = content.includes('audio') ? 'audio' : 'video';
              resolve({ type, confidence: 0.9 });
            } else {
              resolve({ type: 'video', confidence: 0.5 });
            }
          } catch {
            resolve({ type: 'video', confidence: 0.5 });
          }
        });
      });

      req.on('error', () => {
        resolve({ type: 'video', confidence: 0.5 });
      });

      req.write(data);
      req.end();
    });
  }
}
