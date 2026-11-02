import { createClient } from '@supabase/supabase-js';

const MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const MAX_BASE64_CHARS = 7_000_000; // ~5MB of image data

function sendResponse(res, status, json) {
  if (typeof res.status === 'function' && typeof res.json === 'function') {
    return res.status(status).json(json);
  }
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(json));
}

async function readJson(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
}

// Only signed-in household members may spend API credits
async function getUserFromToken(token) {
  const url = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const key = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
  if (!url || !key || !token) return null;
  const { data, error } = await createClient(url, key).auth.getUser(token);
  return error ? null : data.user;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return sendResponse(res, 405, { error: 'POST only' });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return sendResponse(res, 500, { error: 'GEMINI_API_KEY is not configured on the server' });

  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  const user = await getUserFromToken(token);
  if (!user) return sendResponse(res, 401, { error: 'Please sign in again' });

  let body;
  try {
    body = await readJson(req);
  } catch {
    return sendResponse(res, 400, { error: 'Invalid JSON' });
  }

  const { image, mediaType = 'image/jpeg' } = body;
  if (!image || typeof image !== 'string' || image.length > MAX_BASE64_CHARS) {
    return sendResponse(res, 400, { error: 'An image under ~5MB is required' });
  }
  if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(mediaType)) {
    return sendResponse(res, 400, { error: 'Unsupported image type' });
  }

  try {
    const apiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-goog-api-key': apiKey },
        body: JSON.stringify({
          contents: [{
            role: 'user',
            parts: [
              { inline_data: { mime_type: mediaType, data: image } },
              {
                text: 'Transcribe the handwritten text in this image exactly as written, in its original language. ' +
                  'Keep paragraph breaks. Do not translate, correct, summarize or add commentary. ' +
                  'Mark any word you cannot read as [illegible]. Reply with the transcription only. ' +
                  'If there is no handwriting, reply with exactly: [no text found]'
              }
            ]
          }],
          generationConfig: { temperature: 0 }
        })
      }
    );

    const data = await apiRes.json();
    if (!apiRes.ok) {
      return sendResponse(res, 502, { error: data?.error?.message || 'Transcription failed' });
    }
    const text = (data.candidates?.[0]?.content?.parts || []).map(p => p.text || '').join('').trim();
    return sendResponse(res, 200, { text: text === '[no text found]' ? '' : text });
  } catch (e) {
    return sendResponse(res, 502, { error: 'Could not reach the transcription service' });
  }
}
