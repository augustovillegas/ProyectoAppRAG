import { getOpenAI } from './openai.mjs';
import { getDeepSeekResponse } from './deepseek.mjs';

export async function completarConModelo(model, messages, temperature = 0.2) {
  switch (model) {
    case 'gpt-4o-mini':
      return await getOpenAI()
        .chat.completions.create({ model, messages, temperature })
        .then(res => res.choices[0].message.content);

    case 'gpt-5':      
      return await getOpenAI()
        .chat.completions.create({ model: 'gpt-5', messages })
        .then(res => res.choices[0].message.content);

    case 'deepseek-chat':
    case 'deepseek-R1':
      return await getDeepSeekResponse(messages, temperature, model);

    default:
      throw new Error(`Modelo de IA no soportado: ${model}`);
  }
}

