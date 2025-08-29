import { z } from 'zod';

const preguntaSchema = z.string().min(3).max(2000);

/**
 * Valida que la pregunta del usuario cumpla requisitos mínimos
 */
export function validarPregunta(texto) {
  const parsed = preguntaSchema.safeParse(texto?.trim());
  if (!parsed.success) {
    throw new Error("Pregunta inválida");
  }
  return parsed.data;
}

/**
 * Devuelve un mensaje legible para el usuario según el error capturado
 */
export function obtenerMensajeDeError(err) {
  const msg = err?.message || "";

  if (msg.includes("crédito disponible") || msg.includes("quota") || msg.includes("insufficient_quota")) {
    return "🚫 Tu cuenta de OpenAI no tiene crédito disponible. Revisá tu plan y uso.";
  }

  if (msg.includes("DeepSeek")) {
    return "⚠️ No se pudo conectar con DeepSeek. Verificá tu API Key o conexión.";
  }

  if (msg.includes("Modelo IA no soportado")) {
    return "⚠️ El modelo seleccionado no está disponible. Por favor seleccioná uno válido.";
  }

  if (msg.includes("Pregunta inválida")) {
    return "⚠️ Pregunta inválida. Debe tener al menos 3 caracteres.";
  }

  return "⚠️ Hubo un error procesando tu consulta. Intentalo nuevamente.";
}
