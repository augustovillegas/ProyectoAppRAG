import { z } from 'zod';

const preguntaSchema = z.string().min(3).max(2000);

export function validarPregunta(texto) {
  const parsed = preguntaSchema.safeParse(texto?.trim());
  if (!parsed.success) {
    throw new Error("Pregunta inválida");
  }
  return parsed.data;
}

export function obtenerMensajeDeError(err) {
  const msg = err?.message || "";

  if (msg.includes("crédito disponible") || msg.includes("quota") || msg.includes("insufficient_quota")) {
    return "🚫 Tu cuenta de OpenAI no tiene crédito disponible. Revisá tu plan y uso.";
  }

  if (msg.includes("Pregunta inválida")) {
    return "⚠️ Pregunta inválida. Debe tener al menos 3 caracteres.";
  }

  return "⚠️ Hubo un error procesando tu consulta. Intentalo nuevamente.";
}
