import fetch from 'node-fetch';

const API_URL = 'https://api.deepseek.com/v1/chat/completions';
const API_KEY = process.env.DEEPSEEK_API_KEY;

function mask(key = '') {
  if (!key) return '(vacío)';
  return key.slice(0, 4) + '****' + key.slice(-4);
}

export const inicializarDeepSeek = () => {
  console.log("🔌 [DeepSeek] Intentando inicializar cliente…", mask(API_KEY));

  if (!API_KEY) {
    console.error("❌ [DeepSeek] DEEPSEEK_API_KEY no configurado en .env");
    process.exit(1);
  }

  console.log("✅ [DeepSeek] Cliente inicializado correctamente");
};

export async function getDeepSeekResponse(messages, temperature = 0.2, model = 'deepseek-chat') {
  if (!API_KEY) {
    throw new Error("❌ [DeepSeek] API Key no configurada");
  }

  let apiModel = model === 'deepseek-R1' ? 'deepseek-reasoner' : model;

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: apiModel,
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

