import { getOpenAI } from '../config/openai.mjs';
import { getEmbedding } from './embeddingService.mjs';
import { SYSTEM_PROMPT, USER_PROMPT_TEMPLATE } from '../models/prompts.mjs';

const CHAT_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

export async function askQuestionService(question) {
  try {
    const openai = getOpenAI();
    const vector = await getEmbedding(question);
    const docs = await getRelevantDocs(vector);
    const context = docs.map(d => d.text).join('\n\n---\n\n');
    const citations = docs.map(d => ({
      mitre_id: d.mitre_id,
      name: d.name,
      url: d.url
    }));

    const prompt = USER_PROMPT_TEMPLATE({ question, context });

    const completion = await openai.chat.completions.create({
      model: CHAT_MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt }
      ],
      temperature: 0.2
    });

    return {
      answer: completion.choices[0].message.content,
      citations: Array.from(new Map(citations.map(c => [c.mitre_id || c.url, c])).values())
    };
  } catch (error) {
    if (error.code === 'insufficient_quota') {
      throw new Error('🚫 Tu cuenta de OpenAI no tiene crédito disponible. Revisá tu plan y uso.');
    }
    throw error;
  }
}
