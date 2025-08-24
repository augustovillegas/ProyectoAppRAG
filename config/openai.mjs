import OpenAI from 'openai';

let openai = null;

function mask(key = '') {
  if (!key) return '(vacío)';
  return key.slice(0, 4) + '****' + key.slice(-4);
}

/**
 * Inicializa cliente de OpenAI con validación
 */
export const inicializarOpenAI = () => {
  const apiKey = process.env.OPENAI_API_KEY;

  console.log("🔌 [OpenAI] Intentando inicializar cliente…", mask(apiKey));

  if (!apiKey) {
    console.error("❌ [OpenAI] OPENAI_API_KEY no configurado en .env");
    process.exit(1);
  }

  openai = new OpenAI({ apiKey });
  console.log("✅ [OpenAI] Cliente inicializado correctamente");
};

/**
 * Devuelve instancia de OpenAI (ya inicializada)
 */
export const getOpenAI = () => {
  if (!openai) {
    throw new Error("El cliente de OpenAI no ha sido inicializado.");
  }
  return openai;
};