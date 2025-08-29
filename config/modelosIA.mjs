import { getOpenAI } from './openai.mjs';
import { getDeepSeekResponse } from './deepseek.mjs';

export async function completarConModelo(model, messages, temperature = 0.2) {
  switch (model) {
    case 'gpt-4o-mini':
      const openai = getOpenAI();
      const completion = await openai.chat.completions.create({
        model,
        messages,
        temperature
      });
      return completion.choices[0].message.content;

    case 'deepseek-chat':
      return await getDeepSeekResponse(messages, temperature);

    default:
      throw new Error(`Modelo de IA no soportado: ${model}`);
  }
}
