import { getOpenAI } from '../config/openai.mjs';

const EMBEDDING_MODEL = process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small';

export async function getEmbedding(text) {
  try {
    const openai = getOpenAI();
    const response = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: text
    });

    return response.data[0].embedding;
  } catch (err) {
    console.error("❌ Error en getEmbedding:", err); // 👈 LOG NUEVO
    throw err;
  }
}
