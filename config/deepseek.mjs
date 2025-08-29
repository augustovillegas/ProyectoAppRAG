import fetch from 'node-fetch';

const API_URL = 'https://api.deepseek.com/v1/chat/completions';
const API_KEY = process.env.DEEPSEEK_API_KEY;

export async function getDeepSeekResponse(messages, temperature = 0.2) {
  if (!API_KEY) {
    throw new Error("❌ [DeepSeek] API Key no configurada");
  }

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages,
      temperature
    })
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("❌ Error en DeepSeek:", error);
    throw new Error("Error al consultar DeepSeek");
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || 'Sin respuesta';
}
