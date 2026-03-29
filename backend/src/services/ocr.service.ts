import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface OCRResult {
  amount: number | null;
  currency: string | null;
  date: string | null;
  merchant_name: string | null;
  category: string | null;
  description: string | null;
  confidence: {
    amount: 'high' | 'low';
    currency: 'high' | 'low';
    date: 'high' | 'low';
    merchant_name: 'high' | 'low';
    category: 'high' | 'low';
    description: 'high' | 'low';
  };
  raw_text: string;
}

export async function extractReceiptData(imageBase64: string, mimeType: string): Promise<OCRResult> {
  const systemPrompt = `You are an expert receipt OCR system for CogniClaim expense management.
Analyze the provided receipt image and extract structured data.
Return ONLY a valid JSON object with no markdown formatting, no code blocks.

Required JSON structure:
{
  "amount": <number or null>,
  "currency": <3-letter ISO currency code string or null>,
  "date": <ISO date string YYYY-MM-DD or null>,
  "merchant_name": <string or null>,
  "category": <one of: "Travel", "Meals", "Accommodation", "Office Supplies", "Software", "Equipment", "Marketing", "Training", "Other" or null>,
  "description": <brief description string or null>,
  "confidence": {
    "amount": <"high" or "low">,
    "currency": <"high" or "low">,
    "date": <"high" or "low">,
    "merchant_name": <"high" or "low">,
    "category": <"high" or "low">,
    "description": <"high" or "low">
  },
  "raw_text": <full extracted text from receipt>
}

Confidence is "high" if you are confident in the extracted value, "low" if uncertain or if the field was inferred/estimated.`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20251001',
    max_tokens: 1024,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: mimeType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
              data: imageBase64,
            },
          },
          {
            type: 'text',
            text: 'Please extract all expense information from this receipt.',
          },
        ],
      },
    ],
  });

  const content = response.content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected response type from Claude API');
  }

  const rawText = content.text.trim();

  try {
    const parsed = JSON.parse(rawText) as OCRResult;
    return parsed;
  } catch {
    // Try to extract JSON from the response if it contains other text
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as OCRResult;
    }
    throw new Error('Failed to parse OCR response as JSON');
  }
}
