import { completarConModelo } from '../config/modelosIA.mjs';
import { getEmbedding } from './embeddingService.mjs';
import { SYSTEM_PROMPT, USER_PROMPT_TEMPLATE } from '../models/prompts.mjs';
import { getRelevantDocs } from '../repository/mitreRepository.mjs';

/**
 * Procesa la pregunta del usuario usando RAG y un modelo de IA seleccionado.
 * @param {string} question - Pregunta del usuario
 * @param {string} modeloSeleccionado - ID del modelo IA (ej. 'gpt-4o-mini', 'deepseek-chat')
 * @returns {Promise<{answer: string, citations: object[]}>}
 */
export async function askQuestionService(question, modeloSeleccionado = 'gpt-4o-mini') {
  try {
    const vector = await getEmbedding(question);
    const docs = await getRelevantDocs(vector);

    const context = docs.map(d => d.text).join('\n\n---\n\n');
    const citations = docs.map(d => ({
      mitre_id: d.mitre_id,
      name: d.name,
      url: d.url
    }));

    const prompt = USER_PROMPT_TEMPLATE({ question, context });

    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: prompt }
    ];

    console.log(`🤖 Usando modelo IA: ${modeloSeleccionado}`);
    const respuesta = await completarConModelo(modeloSeleccionado, messages);

    return {
      answer: respuesta,
      citations: Array.from(new Map(citations.map(c => [c.mitre_id || c.url, c])).values())
    };
  } catch (error) {
    console.error("❌ Error en askQuestionService:", error);
    throw error;
  }
}

